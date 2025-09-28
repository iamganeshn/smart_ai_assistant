json.data do
  json.id           @conversation.id
  json.title        @conversation.title
  if @conversation.messages.any?
    json.messages(@conversation.messages.order(:created_at)) do |message|
      json.id           message.id
      json.content      message.content
      json.role         message.role
    end
  else
    json.messages [ {
      id: "welcome",
      content: "Hello! I'm Tech9 GPT, your internal AI assistant. Ask me anything or upload documents for analysis.",
      role: "assistant"
    } ]
  end

  json.documents(@conversation.documents) do |document|
    json.id           document.id
    json.file_url     document.file.attached? ? url_for(document.file) : nil
    json.file_name    document.file.attached? ? document.file.filename.to_s : nil
    json.file_size    document.file.attached? ? "#{document.file.byte_size / 1000} Kb" : nil
    json.file_type    document.file.attached? ? document.file.content_type : nil
    json.status       document.status
  end
end
