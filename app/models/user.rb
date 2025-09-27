class User < ApplicationRecord
  has_secure_password

  enum :role, { employee: 0, manager: 1, admin: 2 }, default: :employee

  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  normalizes :email, with: -> (e) { e.strip.downcase }

  has_many :conversations, dependent: :destroy

  def full_name
    "#{first_name} #{last_name}"
  end
end
