class Message < ApplicationRecord
  belongs_to :conversation
  validates :role, presence: true, inclusion: { in: %w[user assistant system tool] }
  validates :content, presence: true

  private

  def user_message?
    role == "user"
  end
end
