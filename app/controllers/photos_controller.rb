class PhotosController < ApplicationController
  before_action :authenticate_user!, except: [:index, :find_photo]

  def index
    @photos = Photo.all
  end

  def new #view, which I eventually want to turn into a modal, using Turbo Frames and Streams
    @photo = Photo.new
  end

  def create
    # "@photo = current_user.photos.build(photo_params)" is a more concise version of the first 2 lines
    # "build" also initializes the object with the user_id, same as "new"
    @photo = Photo.new(photo_params)
    @photo.user = current_user
    if @photo.save
      redirect_to photos_path, notice: "Photo was successfully added."
    else
      # render :new
      redirect_to new_photo_path, alert: 'Try to add a photo this time.'
      # downside of redirect_to is that it doesn't keep the journal entry text
    end
  end

  def show
    @photo = Photo.find(params[:id])
  end

  def edit
    @photo = Photo.find(params[:id])
    # TODO - readd once I have users - inital 3 photos appear to be under a different user
    # if @photo.user != current_user
    #  redirect_to photos_path, notice: "You can only edit your own photos."
    # end
  end

  def update
    @photo = Photo.find(params[:id])
    @photo.update(photo_params)
    redirect_to photos_path, notice: "Photo was successfully updated."
  end

  # TBD - determine if still needed
  def find_photo
    @photo = Photo.find(params[:id])
  end

  private

  def photo_params
    params.require(:photo).permit(:title, :journal_entry, :date_taken, :image)
  end
end
