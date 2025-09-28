# app/controllers/chat_controller.rb
class ChatController < ApplicationController
  include ActionController::Live
  def completion
    return if performed?

    response.headers["Content-Type"] = "text/event-stream"

    service = ChatCompletionService.new(
      conversation_id: params[:conversation_id],
      user_id: current_user.id,
      query: params[:query],
      stream: true
    )

    service.call do |payload|
      next unless payload

      json = payload.is_a?(String) ? { type: "delta", content: payload }.to_json : payload.to_json
      response.stream.write("data: #{json}\n\n")
    end

    # Stream conversation metadata at the end
    if service.conversation
      response.stream.write(
        "data: #{ {
          type: "metadata",
          conversation_id: service.conversation.id,
          conversation_title: service.conversation.title
        }.to_json }\n\n"
      )
    end
  rescue => e
    Rails.logger.error("Streaming error: #{e.message}")
  ensure
    response.stream.close
  end
end
