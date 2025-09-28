class Document < ApplicationRecord
  has_one_attached :file

  has_many :document_chunks, dependent: :destroy
  belongs_to :conversation, optional: true
  belongs_to :user, optional: true # uploader

  after_commit :create_chunks_async, on: [ :create, :update ], if: :file_changed?

  enum :status, { processing: 0, extracted: 1, embedding: 2, completed: 3, failed: 4 }

  def create_chunks
    # Delete old chunks on update
    document_chunks.destroy_all if persisted? && document_chunks.present?
    return if extracted_text.blank?

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
      update_columns(status: :embedding) if extracted? && !embedding?
      document_chunks.create!(text: chunk_text, order: order)

      # Move start index forward, keeping overlap
      start_idx += (config[:chunk_size] - config[:overlap_size])
      order += 1
    end
  end

  private

  def file_changed?
    file_blob.previous_changes.present?
  end

  # Extract text from attached file
  def extracted_text
    return unless file.attached?

    extracted = ""

    case file.content_type
    when "application/pdf"
      require "pdf/reader"
      file.open(tmpdir: Dir.tmpdir) do |f|
        reader = PDF::Reader.new(f)
        reader.pages.each do |page|
          extracted += page.text + "\n"
        end
      end
    when "text/plain"
      extracted = file.download.force_encoding("UTF-8")
    else
      # Optionally handle DOCX, HTML, etc.
      extracted = ""
    end

    # Save extracted text for reuse
    update_columns(text: extracted, status: :extracted) if text != extracted
    extracted
  end

  def create_chunks_async
    DocumentChunkingJob.perform_later(id)
  end
end
