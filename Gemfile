source "https://rubygems.org"

ruby "3.3.8"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.0.2", ">= 8.0.2.1"
# Use postgresql as the database for Active Record
gem "pg", "~> 1.1"
# Use the Puma web server [https://github.com/puma/puma]
gem "puma", ">= 5.0"
# Build JSON APIs with ease [https://github.com/rails/jbuilder]

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

gem "aws-sdk-s3", require: false
gem "pdf-reader", "~> 2.15.0"
# Use the database-backed adapters for Rails.cache, Active Job, and Action Cable
gem "solid_cache"
gem "solid_queue"
gem "mission_control-jobs" # provides a Rails-based frontend to Active Job adapters
gem "solid_cable"
gem "rest-client", "~> 2.1"
gem "jwt", "~> 3.1.2"
gem "jbuilder", "~> 2.14.1"
gem 'slack-ruby-client'

# Propshaft is an asset pipeline library for Rails
gem "propshaft" # UI was not working after adding mission_control, so it suggested this one.

# PostgreSQL vector similarity search
gem "pgvector", "~> 0.3.0"

# OpenAI client for embeddings & chat completions
gem "ruby-openai", "~> 8.3.0"

# Token-aware text splitter (for chunking documents)
gem "tiktoken_ruby", "~> 0.0.12"

gem "neighbor", "~> 0.6.0"

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

# Deploy this application anywhere as a Docker container [https://kamal-deploy.org]
gem "kamal", require: false

# Add HTTP asset caching/compression and X-Sendfile acceleration to Puma [https://github.com/basecamp/thruster/]
gem "thruster", require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
# gem "image_processing", "~> 1.2"

# Use Rack CORS for handling Cross-Origin Resource Sharing (CORS), making cross-origin Ajax possible
gem "rack-cors"

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"

  gem "dotenv-rails"
  # Static analysis for security vulnerabilities [https://brakemanscanner.org/]
  gem "brakeman", require: false

  # Omakase Ruby styling [https://github.com/rails/rubocop-rails-omakase/]
  gem "rubocop-rails-omakase", require: false
end
