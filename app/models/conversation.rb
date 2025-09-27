class Conversation < ApplicationRecord
  belongs_to :user
  has_many :messages, dependent: :destroy
  has_many :documents, dependent: :destroy

  validates :title, presence: true
end
