class DocumentChunkingJob < ApplicationJob
  queue_as :default

  def perform(document_id)
    document = Document.find_by(id: document_id)

    return if document.blank? || !document.file.attached?

    document.create_chunks
  end
end
