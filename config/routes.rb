Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  mount MissionControl::Jobs::Engine, at: "/jobs"
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
  # Defines the root path route ("/")
  # root "posts#index"
  post "chat", to: "chat#completion"
  resources :documents, only: [ :create, :index, :show, :update, :destroy ]
  post "/google/callback", to: "sessions#google_callback"
  resources :conversations, only: [ :index, :show, :create, :update, :destroy ]
  post "/slack/events", to: "slack/events#create"
end
