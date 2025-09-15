# config/initializers/embeddings.rb
module EmbeddingsConfig
  MODELS = {
    openai: {
      embedding_model: "text-embedding-3-small",
      chat_model: "gpt-4o-mini",
      tokenizer: "cl100k_base",
      chunk_size: 500,
      overlap_size: 50,
      embedding_column: :embedding_openai
    },
    ollama: {
      embedding_model: "nomic-embed-text",
      chat_model: "llama3",
      tokenizer: "p50k_base",
      chunk_size: 300,
      overlap_size: 30,
      embedding_column: :embedding_ollama
    }
  }.freeze

  # Set default model to use
  def self.active_model
    MODELS[:ollama]  # change to :openai to switch
  end

  def self.active_model_key
    MODELS.key(active_model)
  end
end
