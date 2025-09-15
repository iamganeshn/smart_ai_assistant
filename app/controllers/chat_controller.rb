# app/controllers/chat_controller.rb
class ChatController < ApplicationController
  include ActionController::Live
  def completion
    response.headers["Content-Type"] = "text/event-stream"
    query = params[:query]

    # 1. Generate embedding for query
    embedding = openai_client.embeddings(
      parameters: {
        model: EmbeddingsConfig.active_model[:embedding_model],
        input: query
      }
    ).dig("data", 0, "embedding")

    # 2. Find relevant chunks
    similar_chunks = DocumentChunk.find_similar(embedding, 3)
    context = similar_chunks.map(&:text).join("\n\n")

    # 3. Call chat/completion model
    openai_client.chat(
      parameters: {
        model: EmbeddingsConfig.active_model[:chat_model],
        messages: [
          { role: "system", content: "You are an expert assistant.  Answer the questions strictly using the provided context. Be concise, precise, and authoritative. Never add disclaimers, filler phrases, or extra commentary, Provide actionable information if relevant and Do NOT include phrases like 'according to the context' or unnecessary hedging" },
          { role: "user", content: "Context:\n#{context}\n\nQuestion: #{query}" }
        ],
        temperature: 0.6,
        stream: proc do |chunk, _event|
          text = chunk.dig("choices", 0, "delta", "content")
          if text.present?
            response.stream.write("#{text}\n\n") # SSE format
          end
        end
      }
    )
  rescue => e
    Rails.logger.error("Streaming error: #{e.message}")
  ensure
    response.stream.close
    # render json: { answer: response.dig("choices", 0, "message", "content"), chunks: similar_chunks.pluck(:order) }
  end
end
