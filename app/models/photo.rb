class Photo < ApplicationRecord
  has_one_attached :image # Creates an instance method I can call on a photo object to get the image
  belongs_to :user
  validates :image, presence: true
  validates :title, presence: true
  # validates :journal_entry, presence: true
  validates :date_taken, presence: true
end
