Rails.application.routes.draw do
  devise_for :users
  root to: "pages#home"
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Index action
  get '/photos', to: 'photos#index', as: 'photos'

  # New action aka form/view
  get 'photos/new', to: 'photos#new', as: 'new_photo'

  # Create action (no view, storing in the database)
  post 'photos', to: 'photos#create'

  # Show action
  # get 'photos/:id', to: 'photos#show', as: 'photo'

  # Edit action
  # get 'photos/:id/edit', to: 'photos#edit', as: 'edit_photo'

  # Update action
  # patch 'photos/:id', to: 'photos#update'

  # Additional route for update action to support PUT
  # put 'photos/:id', to: 'photos#update'

  # Destroy action
  # delete 'photos/:id', to: 'photos#destroy'

  get 'photos/find/:id', to: 'photos#find_photo', as: 'find_photo'
end
