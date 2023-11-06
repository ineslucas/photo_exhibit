# Pin npm packages by running ./bin/importmap

pin "application", preload: true
pin "@hotwired/turbo-rails", to: "turbo.min.js", preload: true
pin "@hotwired/stimulus", to: "stimulus.min.js", preload: true
# pin "@hotwired/stimulus-loading", to: "stimulus-loading.js", preload: true
pin_all_from "app/javascript/controllers", under: "controllers"
pin "bootstrap", to: "bootstrap.min.js", preload: true
pin "@popperjs/core", to: "popper.js", preload: true
pin "three", to: "https://ga.jspm.io/npm:three@0.157.0/build/three.module.js"
# pin "three/examples", to: "https://ga.jspm.io/npm:three@0.157.0/examples/jsm/controls/OrbitControls.js";
pin "lil-gui", to: "https://cdn.jsdelivr.net/npm/lil-gui@0.18/+esm";
