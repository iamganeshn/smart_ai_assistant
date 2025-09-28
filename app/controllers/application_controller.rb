class ApplicationController < ActionController::API
  before_action :authenticate_request

  private

  # Returns the current logged-in user based on JWT token
  def current_user
    return @current_user if defined?(@current_user)

    header = request.headers["Authorization"]
    token = header.split(" ").last if header.present?

    decoded = JsonWebToken.decode(token)
    @current_user = User.find_by(id: decoded[:user_id]) if decoded
  end

  # Ensure request has valid token
  def authenticate_request
    render json: { error: "Not Authorized" }, status: :unauthorized unless current_user
  end
end
