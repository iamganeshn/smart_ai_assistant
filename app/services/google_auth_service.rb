# frozen_string_literal: true


# app/services/google_auth_service.rb
class GoogleAuthService
 GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
 GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


 def initialize(code, redirect_uri)
   @code = code
   @redirect_uri = redirect_uri
   @client_id = ENV.fetch("GOOGLE_CLIENT_ID", nil)
   @client_secret = ENV.fetch("GOOGLE_CLIENT_SECRET", nil)
 end


 def call
   access_token = fetch_google_access_token
   fetch_google_profile(access_token)
 end


 private


 def fetch_google_access_token
   response = RestClient.post(
     GOOGLE_TOKEN_URL,
     {
       code: @code,
       client_id: @client_id,
       client_secret: @client_secret,
       redirect_uri: @redirect_uri,
       grant_type: "authorization_code"
     }
   )
   JSON.parse(response.body)["access_token"]
 end


 def fetch_google_profile(access_token)
   response = RestClient.get(GOOGLE_USERINFO_URL, { Authorization: "Bearer #{access_token}" })
   JSON.parse(response.body)
 end
end
