require "pgvector"

class CreateDocumentsAndDocumentChunks < ActiveRecord::Migration[8.0]
  def change
    create_table :documents do |t|
      t.references :conversation, foreign_key: true
      t.text :text
      t.integer :status, null: false, default: 0
      t.timestamps
    end

    create_table :document_chunks do |t|
      t.references :document, null: false, foreign_key: true
      t.text :text, null: false
      t.integer :order, null: false
      t.integer :status, null: false, default: 0
      t.vector :embedding_openai,  limit: 1536
      t.vector :embedding_ollama,  limit: 768
      t.timestamps
    end
  end
end
