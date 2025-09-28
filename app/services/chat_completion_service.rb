# app/services/chat_completion_service.rb
class ChatCompletionService
  attr_accessor :conversation, :user_id, :query, :stream, :client, :messages, :tool_result, :embedding_config, :user_message, :assistant_response

  def initialize(conversation_id:, user_id:, query:, stream: false)
    @client = openai_client
    @embedding_config = EmbeddingsConfig.active_model

    @user = User.find(user_id)
    @stream = stream
    @conversation = Conversation.find_by(id: conversation_id)

    @query = query

    if @conversation.title == "New Conversation"
      truncated_title = @query.length > 40 ? @query[0..40] + "..." : @query
      @conversation.title = truncated_title
      @conversation.save!
    end

    # Load previous messages for context and add current query
    @messages = load_conversation_messages
    @messages << { role: "user", content: query }

    # Create user message
    @user_message = @conversation.messages.create!(
      role: "user",
      content: @query
    )

    @tool_result = false
    @assistant_response = ""
  end

  def call(&stream_writer)
    embedding = fetch_embedding
    context = build_context_from_embedding(embedding)
    stream_ai_response(context, &stream_writer)
    continue_with_tool_result(context, &stream_writer) if @tool_result

    # Create assistant message after response is complete
    create_assistant_message

    @conversation
  end

  def fetch_embedding
    @client.embeddings(
      parameters: {
        model: embedding_config[:embedding_model],
        input: @query
      }
    ).dig("data", 0, "embedding")
  end

  def build_context_from_embedding(embedding)
    DocumentChunk.joins(:document)
      .where(documents: { conversation_id: [ @conversation.id, nil ] })
      .find_similar(embedding)
      .map(&:text)
      .join("\n\n")
  end

  def stream_ai_response(context, &stream_writer)
    @client.responses.create(
      parameters: {
        model: embedding_config[:chat_model],
        instructions: build_instructions(context),
        input: @messages,
        tools: [employee_lookup_tool, employee_count_tool],
        store: false,
        stream: proc do |chunk, _event|
          handle_chunk(chunk, &stream_writer)
        end
      }
    )
  end

  def continue_with_tool_result(context, &stream_writer)
    @client.responses.create(
      parameters: {
        model: embedding_config[:chat_model],
        instructions: build_instructions(context),
        input: @messages,
        store: false,
        stream: proc do |chunk, _event|
          handle_chunk(chunk, &stream_writer)
        end
      }
    )
  end

  def handle_chunk(chunk, &stream_writer)
    case chunk["type"]
    when "response.output_text.delta"
      delta_text = chunk["delta"]
      @assistant_response += delta_text if delta_text
      stream_writer.call({ type: "delta", content: delta_text }) if stream_writer && delta_text.present?

    when "response.completed"
      Rails.logger.info("Response usage: #{chunk.dig('response', 'usage')}")

    when "response.output_item.done"
      tool_name = chunk.dig("item", "name")
      if tool_name == "get_employee_info"
        args = JSON.parse(chunk["item"]["arguments"])
        # Notify client we are invoking the tool
        stream_writer.call({ type: "tool_call", tool: tool_name }) if stream_writer
        result = lookup_employee(args["name"])
        @messages << { role: "assistant", content: result }
        @tool_result = true

      elsif tool_name == "get_employee_count"
        stream_writer.call({ type: "tool_call", tool: tool_name }) if stream_writer
        @messages << { role: "assistant", content: "Total Tech9 Employees: #{User.count}" }
        @tool_result = true
      end
    end
  end

  def build_instructions(context)
    <<~PROMPT
      You are Tech9GPT, a helpful AI assistant for Tech9 employees.

      You can use the provided context, or call tools to fetch information.

      - If the user asks about an employee (like email or details), use `get_employee_info`.
      - If the user asks about the total number of employees, use `get_employee_count`.

      Context:

      #{context}
    PROMPT
  end

  def create_assistant_message
    return if @assistant_response.blank?

    @conversation.messages.create!(
      role: "assistant",
      content: @assistant_response.strip
    )
  end

  def load_conversation_messages
    return [] unless @conversation&.persisted?

    @conversation.messages.order(:created_at).limit(10).map do |message|
      { role: message.role, content: message.content }
    end
  end

  # ---------------- Tools ----------------

  def employee_lookup_tool
    {
      "type" => "function",
      "name" => "get_employee_info",
      "description" => "Retrieve employee information from Tech9 users table",
      "parameters" => {
        "type" => "object",
        "properties" => {
          "name" => { "type" => "string", "description" => "Employee full or partial name" }
        },
        "required" => ["name"]
      }
    }
  end

  def employee_count_tool
    {
      "type" => "function",
      "name" => "get_employee_count",
      "description" => "Retrieve the total number of employees (users count)",
      "parameters" => { "type" => "object", "properties" => {} }
    }
  end

  def lookup_employee(name)
    users = User.search_by_name(name)
    if users.any?
      { status: "success", users: users.map { |user| { name: user.full_name, email: user.email } } }
      message = ""
      users.each do |user|
        message += "Name: #{user.full_name}, Email: #{user.email}\n"
      end
      message.strip
    else
      "No employee found with name like '#{name}'"
    end
  end

  private

  def openai_client
    case EmbeddingsConfig.active_model_key
    when :openai
      OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY"))
    when :ollama
      OpenAI::Client.new(uri_base: ENV.fetch("OLLAMA_URI_BASE"))
    else
      raise "Unknown embedding provider: #{EmbeddingsConfig.active_model_key}"
    end
  end
end
