class PhotosController < ApplicationController
  before_action :authenticate_user!, except: [:index]

  def index
    @photos = Photo.all
  end

  def new #view, which I eventually want to turn into a modal
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
      render :new
    end
  end

  private

  def photo_params
    params.require(:photo).permit(:title, :journal_entry, :date_taken, :image)
  end
end
