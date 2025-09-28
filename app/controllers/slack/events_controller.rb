# app/controllers/slack/events_controller.rb
class Slack::EventsController < ApplicationController
  def create
    payload = JSON.parse(request.body.read)

    # URL verification challenge
    if payload['type'] == 'url_verification'
      render json: { challenge: payload['challenge'] } and return
    end

    event = payload['event']
    return unless event && event['type'] == 'message' && event['channel'].start_with?('D')

    user_id = event['user']
    channel_id = event['channel']

    profile = fetch_user_profile(user_id)
    Rails.logger.info("User profile: #{profile.inspect}")
    # Todo: Update Restricting to only tech9.com users for now after testing
    unless profile&.email&.end_with?('@tech9.com')
      # response_text = fetch_gpt_response(event['text'])
      response_text = "Hello How can I help you."
      send_message(channel_id, response_text)
    else
      send_message(channel_id, "Access denied. Only @tech9.com users can interact with me.")
    end

    head :ok
  end

  private

  def fetch_user_profile(user_id)
    client = Slack::Web::Client.new
    client.users_info(user: user_id).user.profile
  rescue
    nil
  end

  def fetch_gpt_response(text)
    # Example using RestClient
    response = RestClient.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'gpt-4',
        prompt: text,
        max_tokens: 150
      }.to_json,
      {
        Authorization: "Bearer #{ENV['OPENAI_API_KEY']}",
        content_type: :json,
        accept: :json
      }
    )
    JSON.parse(response.body)['choices'][0]['text'].strip
  end

  def send_message(channel_id, text)
    client = Slack::Web::Client.new
    client.chat_postMessage(channel: channel_id, text: text)
  end
end
