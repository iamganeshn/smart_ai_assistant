class Message < ApplicationRecord
  belongs_to :conversation
  validates :role, presence: true, inclusion: { in: %w[user assistant system tool] }
  validates :content, presence: true


  private

  def user_message?
    role == "user"
  end

  def update_conversation_title
    return unless role == "user" && conversation.messages.where(role: "user").count == 5

    service = ChatCompletionService.new(message.conversation_id, message.user_id, content)
    new_title = service.get_initial_title
    conversation.update(title: new_title) if new_title.present?
  rescue StandardError => e
    Rails.logger.error("Failed to update conversation title: #{e.message}")
  end
end
