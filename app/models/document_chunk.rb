class DocumentChunk < ApplicationRecord
  enum :status, { uploaded: 0, embedding: 1, completed: 2, failed: 3 }, default: :uploaded

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
  def self.find_similar(query_embedding, limit = 3, threshold = 0.7)
    results = nearest_neighbors(
      EmbeddingsConfig.active_model[:embedding_column],
      query_embedding,
      distance: :cosine
    )
    .limit(limit)
    .select("document_chunks.*, cosine_distance(#{EmbeddingsConfig.active_model[:embedding_column]}, '[#{query_embedding.join(",")}]') AS distance")
    results.select { |r| r.distance.to_f <= threshold }
  end
end
