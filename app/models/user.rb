require 'open-uri'

class User < ApplicationRecord
  has_secure_password

  enum :role, { employee: 0, manager: 1, admin: 2 }, default: :employee

  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  normalizes :email, with: -> (e) { e.strip.downcase }

  has_many :conversations, dependent: :destroy
  has_many :messages, through: :conversations, dependent: :destroy
  has_one_attached :avatar_image

  def full_name
    "#{first_name} #{last_name}"
  end

 def self.from_google_oauth(profile)
   user = User.find_or_initialize_by(email: profile['email'])


   # If user is new, set password and skip confirmation
   if user.new_record?
    random_password = SecureRandom.hex(10)
     user.password = random_password
     user.password_confirmation = random_password
     user.first_name = profile['given_name']
     user.last_name = profile['family_name']
     user.save!
   end
   user.attach_avatar_from_url(profile['picture'])
   user
 end

  # Method to attach avatar from a URL to ActiveStorage
  def attach_avatar_from_url(url)
    return if url.blank? # Skip if there's no avatar URL


    downloaded_image = URI.parse(url).open # Download the image from the URL
    avatar_image.attach(io: downloaded_image, filename: "avatar_#{id}.jpg",
                        content_type: 'image/jpg')
  end
end
