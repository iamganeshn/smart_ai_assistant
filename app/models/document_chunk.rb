class DocumentChunk < ApplicationRecord
  belongs_to :document

  validates :text, presence: true

  # Enable nearest neighbor search
  has_neighbors :embedding_openai
  has_neighbors :embedding_ollama

  after_commit :generate_embedding_async, on: :create

  def generate_embedding_async
    GenerateEmbeddingJob.perform_later(id)
  end

  # Generic nearest neighbors finder
  # Example: DocumentChunk.find_similar(query_embedding, 1)
  def self.find_similar(query_embedding, limit = 3)
    nearest_neighbors(EmbeddingsConfig.active_model[:embedding_column], query_embedding, distance: :cosine).limit(limit)
  end
end
