# frozen_string_literal: true


class SessionsController < ApplicationController
 def google_callback
   service = GoogleAuthService.new(params[:code], params[:redirect_uri])
   profile_data = service.call

   unless profile_data['email'].end_with?('@tech9.com')
      return render json: { error: 'You must sign in with your company email (tech9.com).' }, status: :unauthorized
   end

   @user = User.from_google_oauth(profile_data)

   if @user.persisted?
    access_token = JsonWebToken.encode({ user_id: @user.id }, 15.minutes.from_now)
    refresh_token = JsonWebToken.encode({ user_id: @user.id }, 30.days.from_now)

    self.auth_headers = { 'access-token' => access_token, 'refresh-token' => refresh_token }

    render json: {
       message: 'User was successfully logged in through Google',
       user: { id: @user.id, name: @user.full_name, email: @user.email,
               avatar_image_url: @user.avatar_image.url }
     }, status: :created
   else
     render json: {
       status: 'FAILURE',
       message: 'There was a problem signing you in through Google',
       data: @user.errors
     }, status: :unprocessable_entity
   end
 rescue StandardError => e
   render json: { error: e.message }, status: :internal_server_error
 end

 private

 def auth_headers=(login_token)
   response.set_header('access-token', login_token['access-token'])
   response.set_header('token-type', 'Bearer')
   response.set_header('client', 'web')
   response.set_header('Authorization', "Bearer #{login_token['access-token']}")
 end

end
