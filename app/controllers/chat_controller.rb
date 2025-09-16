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
          { role: "system", content: "
            You are Tech9GPT, the fun, witty, and engaging AI assistant for employees.

            Your job is to answer questions about teammates using the provided context.

            ✅ Be playful, witty, and energetic – use analogies, emojis 🎭, or light humor to keep it fun.
            ✅ Keep answers concise – always respond in no more than 2-3 or max 4 sentences if multiple questions. Do not write paragraphs.
            ✅ Use bullet points or numbered lists only if it helps clarity.
            ✅ If you don’t know the answer, say: 'Hmm, I'm not sure about that one. Maybe ask a teammate?' – honesty is key!
            ✅ Never guess or make up answers. Only use the provided context.
            ✅ End with a fun emoji that matches the tone of the answer.

            Fun is welcome, but brevity is mandatory!
          "},
          { role: "user", content: "Context:\n#{context}\n\nQuestion: #{query}" }
        ],
        temperature: 0.7,
        stream: proc do |chunk, _event|
          text = chunk.dig("choices", 0, "delta", "content")
          response.stream.write("data: #{text}\n\n") # SSE format
        end
      }
    )
  rescue => e
    Rails.logger.error("Streaming error: #{e.message}")
  ensure
    response.stream.close
  end
end
