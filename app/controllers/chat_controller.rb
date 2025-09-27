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

    service.call do |text|
      next unless text

      content = { content: text }.to_json
      response.stream.write("data: #{content}\n\n")
    end
    # Stream conversation title at the end
    if service.conversation&.title.present?
      title_content = { conversation_title: service.conversation.title }.to_json
      response.stream.write("data: #{title_content}\n\n")
    end
  rescue => e
    Rails.logger.error("Streaming error: #{e.message}")
  ensure
    response.stream.close
  end

  def current_user
    User.last
  end
end
