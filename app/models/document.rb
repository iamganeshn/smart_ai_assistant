class Document < ApplicationRecord
  has_many :document_chunks, dependent: :destroy

  after_commit :create_chunks_async, on: [ :create, :update ]

  def create_chunks_async
    DocumentChunkingJob.perform_later(id)
  end

  private

  def create_chunks
    # Delete old chunks on update
    document_chunks.destroy_all if persisted? && document_chunks.present?

    return if text.blank?

    # Use centralized active model
    config = EmbeddingsConfig.active_model

    # Encode text to tokens
    tokenizer = Tiktoken.get_encoding(config[:tokenizer])

    tokens = tokenizer.encode(text)

    start_idx = 0
    order = 1
    # Split tokens into chunks and create DocumentChunk
    while start_idx < tokens.size
      chunk_tokens = tokens[start_idx, config[:chunk_size]]
      break unless chunk_tokens&.any?

      chunk_text = tokenizer.decode(chunk_tokens)

      next if chunk_text.strip.empty?

      document_chunks.create!(text: chunk_text, order: order)

      # Move start index forward, keeping overlap
      start_idx += (config[:chunk_size] - config[:overlap_size])
      order += 1
    end
  end
end
