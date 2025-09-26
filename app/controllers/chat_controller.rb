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
            You are Tech9GPT, helpful AI assistant for employees.

            Your job is to answer questions about any query using the provided context.

            ✅ Use bullet points or numbered lists only if it helps clarity.
            ✅ If you don’t know the answer, say: 'Hmm, I'm not sure about that one. Maybe ask a teammate?' – honesty is key!
            ✅ Never guess or make up answers. Only use the provided context.
            ✅ End with a fun emoji that matches the tone of the answer.
            ❌ Don’t mention that you are an AI model or assistant.
            ❌ Don’t reference the context as 'the document' or 'the text above'.
            ❌ Don’t include 'As an AI language model' in your response."
          },
          { role: "user", content: "Context:\n#{context}\n\nQuestion: #{query}" }
        ],
        temperature: 0.7,
        stream: proc do |chunk, _event|
          text = chunk.dig("choices", 0, "delta", "content")
          next unless text
          payload = { content: text }.to_json
          response.stream.write("data: #{payload}\n\n") # SSE format
        end
      }
    )
  rescue => e
    Rails.logger.error("Streaming error: #{e.message}")
  ensure
    response.stream.close
  end
end
