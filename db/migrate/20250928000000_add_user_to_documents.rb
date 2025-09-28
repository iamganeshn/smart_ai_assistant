class AddUserToDocuments < ActiveRecord::Migration[8.0]
  def change
    add_reference :documents, :user, foreign_key: true, null: true
  end
end
