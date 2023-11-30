import { Controller } from "@hotwired/stimulus";
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { main } from "@popperjs/core";

// Connects to data-controller="threejs"
export default class extends Controller {
  static targets = ['canvas'];

  connect() {
    // console.log("Hello, Stimulus!", this.element); // console.log(THREE.OrbitControls); // console.log(GUI);
    this.handleResize();
    this.handleFullscreen();
    this.initThreeJS();
    this.loadImageURLs();
  }

  handleResize() {
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
  }

  handleFullscreen() {
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

  /** Loading texture from Cloudinary URLs*/
  loadImageURLs() {
    // Logging the canvas for debugging purposes.
    console.log("Logging the canvas", this.canvasTarget);

    // Accessing the DOM to retrieve the URLs stored in an input element.
    const imageUrlsInput = document.querySelector('input[name="image_urls"]'); // only reason we're able to select this is because it's in the DOM and this controller has access through the canvasTarget - verify!
    this.imageURLs = JSON.parse(imageUrlsInput.value); // creating an array of the URLs stored in the input element

    // Loading only the first texture from the URL at index 0 and setting it as the main texture for display.
    // The key is the use of a callback function to handle the asynchronous nature of texture loading.
    new THREE.TextureLoader().load(this.imageURLs[0], texture => {
      // Assigning the loaded texture to mainTextureOnDisplay once it's available.
      this.mainTextureOnDisplay = texture;
      console.log("Main texture loaded:", this.mainTextureOnDisplay);

      // Updating the material of the single photo display with the loaded texture:
      // This update is inside the callback, ensuring the texture is loaded before assignment.
      this.singlePhotoDisplay.material.map = this.mainTextureOnDisplay; // Assign the loaded texture to the single photo display.
      this.singlePhotoDisplay.material.needsUpdate = true; // Telling Three.js that the material has been updated and that it needs to be re-rendered.

      /** Creating Rectangles */
      this.rectangles = this.addRectanglesToCircle(this.imageURLs.length, 1.5); // Add rectangles based on the number of imageURLs

      /** Debug Variables */
      this.rectangles.forEach((rectangle) => {
        this.gui.add(rectangle.rotation, 'y').min(- 3).max(3).step(0.01).name('rotationY');
      });

      // Calling addToScene inside the callback to ensure the scene is updated after the texture is loaded.
      this.addToScene();
      this.addToPictureScene();
    });
  }

  initThreeJS() {
    /** Debug */
    this.gui = new GUI();

    /** Main Scene, Camera, Renderer */
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(0xFFFFFF); // 0xFFFFFF = white
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    this.renderer.setSize( this.sizes.width, this.sizes.height );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // retina display - optimizing for performance, by creating a pixel ratio between own screens' and a maximum of 2
    document.body.appendChild(this.renderer.domElement);

    /** Scene with SinglePhotoDisplay */
    this.pictureScene = new THREE.Scene();
    this.pictureCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.pictureCamera.position.z = 5; // similar as (main) camera

    /** Circle */
    const circleGeometry = new THREE.CircleGeometry( 2, 32 );
    this.wireframeMaterial = new THREE.MeshBasicMaterial( {
      color: 0x00ff00,
      wireframe: true
    } );
    this.circle = new THREE.Mesh( circleGeometry, this.wireframeMaterial );

    /** Rotate the circle around the X-axis by ~30 degrees */
    this.circle.rotation.x = Math.PI / - 3;

    /** To rotate around the Y-axis, uncomment: */
    // this.circle.rotation.y = Math.PI / 4;

    /** Single Photo Display */
    this.singlePhotoDisplay = this.createSinglePhotoDisplay();

    /** Grid & Axis Helper */
    this.gridHelper = new THREE.GridHelper( 10, 10 );
    this.axesHelper = new THREE.AxesHelper(5); // 5 = represents the size (length) of the axes

    this.camera.position.z = 5;
    this.camera.position.x = 2;

    /** Orbit Controls */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); // needs to be renderer instead of canvas on Rails

    /** Lock the vertical (polar) angle to prevent tilting */
    this.controls.minPolarAngle = Math.PI / 2; // Set to the current horizontal angle
    this.controls.maxPolarAngle = Math.PI / 2; // Same as minPolarAngle to lock it
    // this.controls.enableZoom = false; // Disable zooming

    this.animate();
  }

  addToScene() {
    this.scene.add(
      this.gridHelper,
      this.circle,
      this.axesHelper);

    this.renderer.render( this.scene, this.camera ); // TBC see if this is needed or if addToPictureScene is also needs it
  }

  addToPictureScene() {
    this.pictureScene.add(this.singlePhotoDisplay); // Ensure this is only added after the texture is loaded
  }

  addRectanglesToCircle(numberOfRectangles, circleRadius) {
    const rectangleHeight = 0.5;
    const rectangleWidth = 1;
    const rectangles = []; // to store rectangles newly created, this is what gets called in the initThreeJS() function

    for (let i = 0; i < numberOfRectangles; i++) { // = we loop as many times as the number of rectangles we want to create
      const theta = (i / numberOfRectangles) * 2 * Math.PI; // angle between each rectangle

      const rectangleMaterial = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true, // Creating a transparent material initially
        opacity: 0
      });
      const rectangleGeometry = new THREE.PlaneGeometry(rectangleWidth, rectangleHeight);
      const rectangle = new THREE.Mesh(rectangleGeometry, rectangleMaterial);

      // Position and rotation of each rectangle
      rectangle.position.x = circleRadius * Math.sin(theta);
      rectangle.position.y = circleRadius * Math.cos(theta);
      // Rectangle's rotation to face away from the circle's center
      rectangle.rotation.z = 0; // theta + Math.PI / 2 also a cool possibility, especially with rotation.y at 0.
      rectangle.rotation.x = Math.PI / 2;
      rectangle.rotation.y = Math.PI / 2 - theta;

      this.circle.add(rectangle); // Adding the rectangle as a child of the circle. This means that if we move or rotate the circle, the rectangles will follow its transformation as they're considered part of the circle in the scene hierarchy.
      rectangles.push(rectangle); // Adding the rectangle to the rectangles array, so that rectangles array can be accessed outside

      // Loading the texture from the URL at index i and updating material.map with it
      new THREE.TextureLoader().load(this.imageURLs[i], texture => {
        rectangle.material.map = texture;
        rectangle.material.opacity = 1; // makes the texture visible
        rectangle.material.needsUpdate = true;
      });
    }

    return rectangles;
  }

  createSinglePhotoDisplay() {
    // This createSinglePhotoDisplay function is called from within initThreeJS, which happens right after loadImageURLs() in the connect method.
    // At this moment, this.mainTextureOnDisplay is still undefined because the texture hasn't finished loading yet. That's why the console log inside createSinglePhotoDisplay shows undefined.

    /** Geometry */
    const singlePhotoDisplayGeometry = new THREE.PlaneGeometry(1*2, 0.5*2);
    /** Material */
    const singlePhotoDisplayMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide, // ensures that the material renders on both sides of our 2D plane
      map: this.mainTextureOnDisplay || null // Ensuring the texture is loaded before assigning it to the material happens in the loadImageURLs() function
    });
    /** Mesh & effectively creating the object */
    const singlePhotoDisplay = new THREE.Mesh(singlePhotoDisplayGeometry, singlePhotoDisplayMaterial);

    /** Positioning it fixed at the center of the scene */
    singlePhotoDisplay.position.set(0, 0, 0);
    singlePhotoDisplay.rotation.set(0, 0, 0);

    return singlePhotoDisplay;
  }

  animate() {
    // Creating a loop that causes the renderer to draw the scene every time the screen is refreshed (typically 60 times per second)
    requestAnimationFrame(this.animate.bind(this));

    // Render the main scene with orbit controls
    this.renderer.render(this.scene, this.camera);

    // Render the picture scene without orbit controls
    // this.renderer.render(this.pictureScene, this.pictureCamera);
  }
}
