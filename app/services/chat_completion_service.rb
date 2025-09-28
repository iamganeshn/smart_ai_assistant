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
      truncated_title = @query.length > 16 ? @query[0..16] + "..." : @query
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
      .where(documents: { conversation_id: [@conversation.id, nil] })
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
        # Todo: replace with actual tools later
        # tools: [create_contact_tool],
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
      stream_writer.call(delta_text) if stream_writer
    when "response.completed"
      Rails.logger.info("Response usage: #{chunk.dig('response', 'usage')}")
    when "response.output_item.done"
      # Todo: handle tool results properly later
      if chunk.dig("item", "name") == "create_contact"
        arguments = JSON.parse(chunk["item"]["arguments"])
        # create_contact(arguments)
        @messages << { content: { status: "success", message: "Contact created/updated successfully." }.to_json }
        @tool_result = true
      end
    end
  end

  def build_instructions(context)
    <<~PROMPT
      You are a Tech9GPT, helpful AI assistant for the employees of Tech9.

      Your job is to answer questions about any query using the provided context

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
  # Todo: implement actual tool actions later
  def create_contact_tool
    {
      "type" => "function",
      "name" => "create_contact",
      "description" => "Whenever we get a lead, create/update a contact",
      "parameters" => {
        "type" => "object",
        "properties" => {
          "name" => { "type" => "string" },
          "mobile" => { "type" => "string" },
          "email" => { "type" => "string" }
        },
        "required" => [ "mobile", "email" ]
      }
    }
  end

  private

  # Todo: Make it as global method later
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
