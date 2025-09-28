json.data do
  json.id           @conversation.id
  json.title        @conversation.title
  json.messages(@conversation.messages.order(:created_at)) do |message|
    json.id           message.id
    json.content      message.content
    json.role         message.role
  end
end
