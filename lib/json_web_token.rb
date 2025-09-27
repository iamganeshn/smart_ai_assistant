# app/lib/json_web_token.rb
class JsonWebToken
 SECRET_KEY = Rails.application.secret_key_base

 # Encode payload with expiry (in seconds)
 def self.encode(payload, exp = 120.minutes.from_now)
   payload[:exp] = exp.to_i
   JWT.encode(payload, SECRET_KEY)
 end


 # Decode token, returns payload or raises exception
 def self.decode(token)
   decoded = JWT.decode(token, SECRET_KEY)[0]
   HashWithIndifferentAccess.new decoded
 rescue JWT::DecodeError, JWT::ExpiredSignature
   nil
 end
end
