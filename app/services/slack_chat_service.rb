# app/services/slack_chat_service.rb
class SlackChatService
  attr_reader :query, :embedding_config

  def initialize(query)
    @query = query
    @embedding_config = EmbeddingsConfig.active_model
    @client = openai_client
  end

  def call
    embedding = fetch_embedding
    context = build_context_from_embedding(embedding)
    generate_ai_response(context)
  end

  private

  def fetch_embedding
    @client.embeddings(
      parameters: {
        model: embedding_config[:embedding_model],
        input: @query
      }
    ).dig("data", 0, "embedding")
  rescue => e
    Rails.logger.error("Embedding fetch failed: #{e.message}")
    nil
  end

  def build_context_from_embedding(embedding)
    return "" unless embedding

    DocumentChunk.joins(:document)
      .where(documents: { conversation_id: nil })
      .find_similar(embedding)
      .map(&:text)
      .join("\n\n")
  rescue => e
    Rails.logger.error("Context building failed: #{e.message}")
    ""
  end

  def generate_ai_response(context)
    resp = @client.responses.create(
      parameters: {
        model: embedding_config[:chat_model],
        instructions: build_instructions(context),
        input: [{ role: "user", content: @query }],
        store: false
      }
    )
    resp.dig("output", 0, "content", 0, "text") || ""
  rescue => e
    Rails.logger.error("AI response failed: #{e.message}")
  end

  def build_instructions(context)
    <<~PROMPT
      You are Tech9GPT, a helpful AI assistant for the employees of Tech9.

      Use the provided context to answer the user's question accurately.

      Context:

      #{context}
    PROMPT
  end

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
