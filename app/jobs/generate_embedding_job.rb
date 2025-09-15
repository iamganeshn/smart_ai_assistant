class GenerateEmbeddingJob < ApplicationJob
  queue_as :default

  def perform(document_chunk_id)
    chunk = DocumentChunk.find(document_chunk_id)

    return if chunk.text.blank?

    response = embedding_client.embeddings(
      parameters: {
        model: EmbeddingsConfig.active_model[:embedding_model],
        input: chunk.text
      }
    )
    embedding = response.dig("data", 0, "embedding")
    chunk.update_column(EmbeddingsConfig.active_model[:embedding_column], embedding)
  end

  def embedding_client
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
