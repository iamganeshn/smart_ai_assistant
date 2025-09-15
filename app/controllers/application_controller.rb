class ApplicationController < ActionController::API
  def openai_client
    case EmbeddingsConfig.active_model_key
    when :openai
      OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY"))
    when :ollama
      OpenAI::Client.new(uri_base: ENV.fetch("OLLAMA_URI_BASE"))
    else
      raise "Unknown embedding provider: #{EmbeddingsConfig.active_model_key}"
    end
  end
end
