# <img src="https://github.com/user-attachments/assets/5e5ab477-5623-43bb-a39e-539074fbc60a" alt="tech9gpt-icon" width="35" height="35" style="vertical-align: botton;" /> Smart AI Assistant

Smart AI Assistant transforms internal documents into a conversational knowledge base. Employees can simply ask questions and get instant, accurate answers—powered by automatic text extraction, chunking, and vector search.

It supports multiple conversations, with global documents managed by admins and personal conversation documents, ensuring both shared and private context.

Built on a modern stack (Rails + pgvector + Solid Queue) with Google SSO and Slack integration, it’s secure, scalable, and easy to extend.

---

## ✨ Core Features

Backend (Rails):

- Document upload (multi-file) with Active Storage (S3-ready) + PDF/text extraction
- Automatic status pipeline: uploaded → extracted → embedding → completed / failed
- Token-aware chunker (`tiktoken_ruby`) + overlap handling
- Vector similarity search using `pgvector` (via `DocumentChunk#find_similar`)
- Dual provider embedding/chat abstraction (OpenAI or local Ollama) via `EmbeddingsConfig`
- Streaming chat responses (Server-Sent Events) with conversation persistence
- Background jobs (Solid Queue) for chunk creation + embeddings (`DocumentChunkingJob`, `GenerateEmbeddingJob`)
- Job dashboard at `/jobs` (mission_control-jobs)

Frontend (React/MUI):

- Conversation list (create, rename, delete) + streaming message view
- SSE client that appends tokens live and updates conversation metadata once finished
- Document management screen: upload, replace, delete, status polling, per-row action menu
- Download button & file type detection (from `file_type`)
- Auth placeholder (token stored in localStorage)

---

## 📦 Tech Stack

| Layer       | Tech                                        |
| ----------- | ------------------------------------------- |
| Backend     | Rails 8, Ruby 3.3.8                         |
| Data Store  | PostgreSQL + pgvector extension             |
| Async Jobs  | solid_queue + mission_control-jobs UI       |
| Embeddings  | OpenAI or Ollama (nomic-embed-text)         |
| Chat Models | OpenAI GPT (gpt-4o-mini) or Ollama (llama3) |
| Frontend    | React 19, Vite, MUI, React Router 7         |
| Auth (stub) | Google OAuth endpoint + JWT scaffold        |

---

## ✅ Requirements

- Ruby 3.3.8
- PostgreSQL 14+ (with pgvector installed)
- Node 20+/pnpm or npm (for React client)
- Optional: Ollama (local LLM + embedding testing)
- OpenAI API key (if using OpenAI)

> RAG = retrieval (vector similarity over chunked documents) + generation (LLM answer synthesis) with injected context.

---

## 🚀 Setup (Backend + Frontend)

### 1. Clone

```bash
git clone git@github.com:iamganeshn/smart_ai_assistant.git
cd smart_ai_assistant
```

### 2. Ruby deps

```bash
bundle install
```

### 3. Node deps (frontend)

```bash
cd client
npm install   # or pnpm install
cd ..
```

### 4. Environment

Create `.env` (if not already) and set (add only what you use):

```env
OPENAI_API_KEY=sk-...
OLLAMA_URI_BASE=http://localhost:11434
JWT_SECRET=change_me

# Mission Control (basic auth for /jobs dashboard)
MISSION_CONTROL_JOBS_USER=admin
MISSION_CONTROL_JOBS_PASSWORD=secret

# Active Storage (S3 / Bucketeer style vars)
BUCKETEER_AWS_ACCESS_KEY_ID=
BUCKETEER_AWS_SECRET_ACCESS_KEY=
BUCKETEER_AWS_REGION=us-east-1
BUCKETEER_BUCKET_NAME=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Slack App (for DM interactions)
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
```

Client (frontend) env lives in `client/.env` (copy from `client/.env.example`). Only keys prefixed with `VITE_` are exposed at build time.

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_BACKEND_URL=http://localhost:3000
```

### 5. Database & extensions

```bash
bin/rails db:create
bin/rails db:migrate
```

Ensure pgvector is enabled (migration already included):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 6. (Optional) Ollama models

```bash
brew install ollama
ollama pull llama3:latest
ollama pull nomic-embed-text:latest
ollama serve
```

### 7. Start services

In three terminals:

```bash
bin/rails server
bin/jobs start          # Solid Queue worker
cd client && npm run dev
```

Visit: http://localhost:5173 (frontend) and http://localhost:3000 (API), jobs dashboard at http://localhost:3000/jobs

---

## 🗂 Data Flow & Processing Pipeline

1. Upload file(s) → `DocumentsController#create` saves ActiveStorage blob (status: uploaded)
2. After commit callback triggers `DocumentChunkingJob`
3. File text extracted (PDF or plain text). Status → extracted
4. Chunks created with overlap; status advances to embedding
5. `GenerateEmbeddingJob` runs per chunk (embeddings stored in provider-specific column)
6. When all chunks complete → document status: completed
7. Chat queries embed the question and select similar chunks across (conversation + global) documents

Statuses exposed to frontend: uploaded, extracted, embedding, completed, failed.

---

## 🔌 API Overview

| Method | Path               | Purpose                                       |
| ------ | ------------------ | --------------------------------------------- |
| POST   | /chat              | Stream chat completion (SSE)                  |
| GET    | /conversations     | List conversations                            |
| POST   | /conversations     | Create conversation                           |
| GET    | /conversations/:id | Show conversation + messages                  |
| PUT    | /conversations/:id | Rename conversation                           |
| DELETE | /conversations/:id | Delete conversation                           |
| GET    | /documents         | List documents (global or by conversation_id) |
| POST   | /documents         | Upload multiple documents                     |
| PUT    | /documents/:id     | Replace file                                  |
| DELETE | /documents/:id     | Delete document                               |
| POST   | /google/callback   | Google OAuth (stub for auth)                  |
| POST   | /slack/events      | Slack Events (message DMs)                    |

SSE response stream sends incremental `{ content: "token" }` chunks then a final metadata object `{ conversation_id, conversation_title }`.

---

## 🧠 Embeddings & Model Switching

`config/initializers/embeddings.rb` centralizes provider configs. Change the return value of `active_model` to switch between `:ollama` and `:openai`. Each provider supplies:

- embedding_model
- chat_model
- tokenizer
- chunk_size & overlap_size
- embedding_column (per-provider storage on chunks)

Regenerating embeddings after a switch is left to future tasks (e.g., backfill job).

---

## 🖥 Frontend Dev Notes

- Uses fetch for streaming SSE (manual reader) in chat component.
- Conversation state cached client-side; titles updated optimistically.
- Document table polls every 5s while any doc not completed/failed.
- Download icon uses `file_url` from API; file type column derived from MIME subtype.

---

## 🔐 Auth (Current State)

- Minimal placeholder: token expected in `Authorization` header (localStorage key `tech9gpt_user`).
- Google login endpoint exists.
- Slack DM integration: users can DM the bot; only allowed domain logic placeholder in `Slack::EventsController`.

---

## 🧪 Quick Console Examples

```ruby
# Get similar context manually
emb = ChatCompletionService.new(conversation_id: Conversation.first.id, user_id: User.first.id, query: "Test", stream: false).fetch_embedding
similar_texts = DocumentChunk.joins(:document).find_similar(emb).limit(5).map(&:text)
```

```bash
# Raw chat (SSE) example
curl -N -H 'Content-Type: application/json' \
  -d '{"query":"What documents do we have?","conversation_id":1}' \
  http://localhost:3000/chat

# Slack URL verification (simulate)
curl -X POST http://localhost:3000/slack/events \
  -H 'Content-Type: application/json' \
  -d '{"type":"url_verification","challenge":"test123"}'
```

---

## 🛣 Roadmap (Short-Term)

- Retry & failure reason for documents
- Granular progress (chunk counts / embedded counts)
- Search + filter + sort on documents table
- Live push (Action Cable / SSE) for document status instead of polling
- Auth hardening + per-user doc scoping
- Slack thread replies & conversation persistence mapping

---

## 🙌 Contributing

PRs welcome. Please include a short description and update README if changing setup steps.

---

## 📒 Notes

- All heavy work (text extraction, chunking, embeddings) offloaded to background jobs.
- SSE chosen over WebSockets for simplicity; can migrate later.
- Designed for incremental extension (tools, function calling, richer doc metadata).

---

Happy hacking! 🧪
