# Smart AI Assistant

> **Note:** This project is primarily based on **RAG (Retrieval-Augmented Generation)**. It may or may not include a chatbot interface, depending on usage.

Built with **Rails 8** and **Ruby 3.3.8**, supporting embeddings, document chunking, and local development with **Ollama** or **OpenAI**.

---

## Features

* Automatic **document chunking** with token-aware splitting (`tiktoken_ruby`)
* **PostgreSQL vector similarity search** (`pgvector`) for fast retrieval
* **Embeddings and chat completions** via OpenAI or Ollama
* **Background jobs** using Solid Queue, monitored with `mission_control-jobs`
* Easy switch between Ollama and OpenAI models

---

## Requirements

* Ruby 3.3.8
* Rails 8
* PostgreSQL >= 14
* Ollama (for local embeddings/chat testing)

> **RAG (Retrieval-Augmented Generation):** Combines a vector search over documents with a generative LLM to produce context-aware answers.

---

## Installation

### 1. Clone the repo

```bash
git clone git@github.com:iamganeshn/smart_ai_assistant.git
cd smart-ai-assistant
```

### 2. Install dependencies

```bash
bundle install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update with your keys:

```env
OPENAI_API_KEY='your_openai_api_key'
OLLAMA_URI_BASE=http://localhost:11434
```

---

### 4. Set up PostgreSQL + pgvector

* Ensure **PostgreSQL (>=14)** is installed and running.
* Install the **pgvector** extension and enable it in your database:

```bash
brew install pgvector
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 5. Database setup

```bash
bin/rails db:create
bin/rails db:migrate
```

---

### 6. Start Ollama server (local dev)

Install Ollama:

```bash
brew install ollama
```

Pull required models (one-time):

```bash
ollama pull llama3:latest
ollama pull nomic-embed-text:latest
```

Start the server:

```bash
ollama serve
```

Check available models:

```bash
ollama list
```

Sample output:

```
nomic-embed-text:latest    274 MB
llama3:latest              4.7 GB
```

---

### 7. Start background job worker

Using **Solid Queue**:

```bash
bin/jobs start
```

> Document chunking and embedding generation happen automatically after document creation via async background jobs.

---

### 8. Start Rails server

```bash
bin/rails server
```

---

## Configuration

Switch between **Ollama** and **OpenAI** models by updating `EmbeddingsConfig`:

```ruby
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

  # Default model to use
  def self.active_model
    MODELS[:ollama]  # change to :openai to switch
  end

  def self.active_model_key
    MODELS.key(active_model)
  end
end
```

> **Note:** Changing the `active_model` key automatically updates embeddings and chat models throughout the app.

---

## Gems Used

| Purpose                     | Gem                    |
| --------------------------- | ---------------------- |
| Database-backed Rails cache | `solid_cache`          |
| Background jobs             | `solid_queue`          |
| Job monitoring              | `mission_control-jobs` |
| Asset pipeline fix          | `propshaft`            |
| Vector similarity search    | `pgvector`             |
| OpenAI client               | `ruby-openai`          |
| Token-aware chunking        | `tiktoken_ruby`        |
| PostgreSQL                  | `pg`                   |
| Web server                  | `puma`                 |
| Environment variables       | `dotenv-rails`         |

> **Note:** `solid_cache` and `solid_cable` are optional and currently not actively used, but can be leveraged for caching or real-time updates in the future.

---

## Quick Start / Example Usage

Create a document and let background jobs handle chunking & embedding:

```ruby
# rails console
doc = Document.create!(title: "Climate Change", text: File.read("sample_long_text.txt"))
```

Retrieve embeddings and search for similar chunks:

```ruby
embedding = EmbeddingsConfig.active_model[:embedding_model]
chunks = doc.document_chunks
puts chunks.map(&:text)
```

Send a query via chat API:

```bash
curl -X POST http://localhost:3000/chat/completion \
     -d "query=What are the effects of climate change?"
```

Streaming responses are supported via **SSE**, so users see partial answers as they are generated.

---

## Notes

* All chunking/embedding happens **asynchronously** after document creation.
* You can switch between Ollama and OpenAI models by updating `EmbeddingsConfig`.
* SSE streaming is used for chat responses; **Action Cable** is not required for now.
* Tested with **Ollama 0.11.10** and **PostgreSQL 14**.

---