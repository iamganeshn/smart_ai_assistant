json.data(@conversations) do |conversation|
  json.id           conversation.id
  json.title        conversation.title
end
