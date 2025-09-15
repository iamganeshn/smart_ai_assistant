class DocumentChunkingJob < ApplicationJob
  queue_as :default

  def perform(document_id)
    document = Document.find_by(id: document_id)
    return if document.blank? || document.text.blank?

    # Delete old chunks
    document.document_chunks.destroy_all

    config = EmbeddingsConfig.active_model
    tokenizer = Tiktoken.get_encoding(config[:tokenizer])
    tokens = tokenizer.encode(document.text)

    start_idx = 0
    order = 1

    while start_idx < tokens.size
      chunk_tokens = tokens[start_idx, config[:chunk_size]]
      break unless chunk_tokens&.any?

      chunk_text = tokenizer.decode(chunk_tokens)
      next if chunk_text.strip.empty?

      document.document_chunks.create!(text: chunk_text, order: order)

      start_idx += (config[:chunk_size] - config[:overlap_size])
      order += 1
    end
  end
end
