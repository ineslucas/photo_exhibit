import { Controller } from "@hotwired/stimulus";
import * as THREE from "three";
// import { OrbitControls } from "three/examples";

// Connects to data-controller="threejs"
export default class extends Controller {
  connect() {
    console.log("Hello, Stimulus!", this.element);

    this.initThreeJS();

    window.addEventListener('resize', () => {
      console.log('window has been resized');

      // Update sizes
      this.sizes.width = window.innerWidth;
      this.sizes.height = window.innerHeight;

      // Update camera
      this.camera.aspect = this.sizes.width / this.sizes.height;
      this.camera.updateProjectionMatrix();

      // Update renderer
      this.renderer.setSize(this.sizes.width, this.sizes.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    window.addEventListener('dblclick', () => {
      if(!document.fullscreenElement) {
        console.log('go fullscreen');
        this.renderer.domElement.requestFullscreen(); // code line specific to Rails & Stimulus, otherwise we'd call requestFullscreen() directly on the canvas
      } else {
        console.log('leave fullscreen');
        document.exitFullscreen();
      }
    });
  }

  initThreeJS() {
    // code to initialize ThreeJS
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    this.renderer = new THREE.WebGLRenderer();
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    this.renderer.setSize( this.sizes.width, this.sizes.height );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // retina display - optimizing for performance, by creating a pixel ratio between own screens' and a maximum of 2
    document.body.appendChild(this.renderer.domElement);

    this.geometry = new THREE.BoxGeometry();
    this.material = new THREE.MeshBasicMaterial( {
      color: 0x00ff00,
      wireframe: false
    } );

    this.originCube = this.createCube(0,0,0);

    this.scene.add( this.originCube );

    this.camera.position.z = 5;

    this.renderer.render( this.scene, this.camera );

    this.animate();
  }

  createCube(x,y,z) {
    const cube = new THREE.Mesh( this.geometry, this.material );
    cube.position.set(x,y,z);
    return cube;
  }

  animate() { // to fix distortion of cube object
    // This creates a loop that causes the renderer to draw the scene every time the screen is refreshed (typically 60 times per second)
    requestAnimationFrame(this.animate.bind(this));

    // Render the scene with the camera
    this.renderer.render(this.scene, this.camera);
  }
}
