# app/controllers/slack/events_controller.rb
class Slack::EventsController < ApplicationController
  skip_before_action :authenticate_request

  # POST /slack/events
  def create
    payload = JSON.parse(request.body.read)

    # URL verification challenge
    if payload['type'] == 'url_verification'
      render json: { challenge: payload['challenge'] } and return
    end

    head :ok

    event = payload['event']
    return unless event && event['type'] == 'message' && event['channel'].start_with?('D')

    return if event['bot_id']

    user_id = event['user']
    channel_id = event['channel']

    profile = fetch_user_profile(user_id)
    Rails.logger.info("User profile: #{profile.inspect}")
    # Todo: Update Restricting to only tech9.com users for now after testing
    unless profile&.email&.end_with?('@tech9.com')
      response_text = SlackChatService.new(event['text']).call
      send_message(channel_id, response_text)
    else
      send_message(channel_id, "Access denied. Only @tech9.com users can interact with me.")
    end

  end

  private

  def fetch_user_profile(user_id)
    client = Slack::Web::Client.new
    client.users_info(user: user_id).user.profile
  rescue
    nil
  end

  def send_message(channel_id, text)
    client = Slack::Web::Client.new
    client.chat_postMessage(channel: channel_id, text: text)
  end
end
