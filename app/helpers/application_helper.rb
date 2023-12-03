module ApplicationHelper
  def inline_svg(path)
    File.read(Rails.root.join('app', 'assets', 'images', path)).html_safe
  end
end
