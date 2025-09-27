# app/services/chat_completion_service.rb
class ChatCompletionService
  attr_accessor :conversation, :user_id, :query, :stream, :client, :messages, :tool_result, :embedding_config

  def initialize(conversation_id:, user_id:, query:, stream: false)
    @client = openai_client
    @embedding_config = EmbeddingsConfig.active_model

    @user = User.find(user_id)
    @stream = stream
    @conversation = Conversation.find_by(id: conversation_id)

    @query = query
    @messages = [
      { role: "user", content: query }
    ]
    unless @conversation
      title = get_initial_title
      conversation = @user.conversations.build(title: title)
      conversation.save!
      @conversation = conversation
    end
    @tool_result = false
  end

  def call(&stream_writer)
    embedding = fetch_embedding
    context = build_context_from_embedding(embedding)
    context = ""
    stream_ai_response(context, &stream_writer)
    continue_with_tool_result(context, &stream_writer) if @tool_result
  end

  private

  def fetch_embedding
    @client.embeddings(
      parameters: {
        model: embedding_config[:embedding_model],
        input: @query
      }
    ).dig("data", 0, "embedding")
  end

  def build_context_from_embedding(embedding)
    DocumentChunk.find_similar(embedding).map(&:text).join("\n\n")
  end

  def stream_ai_response(context, &stream_writer)
    resp = @client.responses.create(
      parameters: {
        model: embedding_config[:chat_model],
        instructions: build_instructions(context),
        input: @messages,
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
      stream_writer.call(chunk["delta"]) if stream_writer
    when "response.completed"
      Rails.logger.info("Response usage: #{chunk.dig('response', 'usage')}")
    when "response.output_item.done"
      if chunk.dig("item", "name") == "create_contact"
        arguments = JSON.parse(chunk["item"]["arguments"])
        create_contact(arguments)
        @messages << { content: tool_success_message.to_json }
        @tool_result = true
      end
    end
  end

  def create_contact(args)
    # ContactService.new.create_or_update(args)
  end

  def tool_success_message
    { status: "success", message: "Contact created/updated successfully." }
  end

  def build_instructions(context)
    <<~PROMPT
      You are a Tech9GPT, helpful AI assistant for the employees of Tech9.

      Your job is to answer questions about any query using the provided context

      Context:

      #{context}
    PROMPT
  end

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
        "required" => ["mobile", "email"]
      }
    }
  end

  def get_initial_title
    resp = client.responses.create(
      parameters: {
        model: embedding_config[:chat_model],
        instructions: <<~INSTR,
          You are an assistant that generates a concise, clear, and relevant title
          for a conversation. Keep it short (3-7 words), capturing the main topic.
        INSTR
        input: [
          { role: "user", content: "#{query}" }
        ],
        store: false,
      }
    )
    resp.dig("output", 0, "content", 0, "text")&.strip
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
