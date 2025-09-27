# app/controllers/documents_controller.rb
class DocumentsController < ApplicationController
  before_action :set_document, only: [:show, :update, :destroy]

  def index
    documents =
      if params[:conversation_id].present?
        Document.where(conversation_id: params[:conversation_id])
      else
        Document.where(conversation_id: nil) # global docs (admin uploaded)
      end

    render json: documents.map { |d| document_response(d) }
  end

  def create
    debugger
    return render json: { error: "files are required" }, status: :unprocessable_entity if document_params[:files].blank?

    created_documents = []
    failed_documents = []

    document_params[:files].each do |file|
      document = Document.new(file: file, conversation_id: document_params[:conversation_id])
      if document.save
        created_documents << document_response(document)
      else
        failed_documents << { file: file.original_filename, errors: document.errors.full_messages }
      end
    end

    render json: { created: created_documents, failed: failed_documents }, status: :created
  end

  def update
    if @document.update(file: params[:file], status: :uploaded)
      render json: document_response(@document), status: :ok
    else
      render json: { errors: @document.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    render json: document_response(@document), status: :ok
  end

  def destroy
    @document.destroy
    render json: { message: "Document deleted successfully" }, status: :ok
  end

  private

  def set_document
    @document = Document.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Document not found" }, status: :not_found
  end

  def document_params
    params.permit(:conversation_id, files: [])
  end

  def document_response(document)
    file = document.file
    document.as_json(only: [:id, :status, :conversation_id]).merge(
      file_url: file.attached? ? url_for(file) : nil,
      file_name: file.attached? ? file.filename.to_s : nil,
      file_size: file.attached? ? "#{file.byte_size/1000} Kb" : nil,
      file_type: file.attached? ? file.content_type : nil,
      is_global: document.conversation_id.nil?
    )
  end
end
