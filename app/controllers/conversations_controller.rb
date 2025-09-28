class ConversationsController < ApplicationController
  def index
    @conversations = current_user.conversations.order(updated_at: :desc)
  end

  def show
    @conversation = current_user.conversations.find(params[:id])
  end

  def update
    @conversation = current_user.conversations.find(params[:id])
    if @conversation.update(conversation_params)
      render :show
    else
      render json: @conversation.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @conversation = current_user.conversations.find(params[:id])
    @conversation.destroy
    head :no_content
  end

  private

  def conversation_params
    params.require(:conversation).permit(:title)
  end

  def current_user
    # Todo: Placeholder for current user method, replace with actual authentication logic
    User.first
  end
end
