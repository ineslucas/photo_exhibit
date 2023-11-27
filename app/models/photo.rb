class Photo < ApplicationRecord
  has_one_attached :image # Creates an instance method I can call on a photo object to get the image
  belongs_to :user
end
