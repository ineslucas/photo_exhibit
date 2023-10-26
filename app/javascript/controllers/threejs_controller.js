// Cube is commented but not deleted to show how to create a three.js cube in Rails

import { Controller } from "@hotwired/stimulus";
import * as THREE from "three";
import { OrbitControls } from "three/examples"; // as added permanently to importmaps - original: import { OrbitControls } from "https://ga.jspm.io/npm:three@0.157.0/examples/jsm/controls/OrbitControls.js";
import GUI from 'lil-gui';

// Connects to data-controller="threejs"
export default class extends Controller {
  connect() {
    console.log("Hello, Stimulus!", this.element);
    // console.log(THREE.OrbitControls);
    // console.log(GUI);

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
    /** Debug */
    this.gui = new GUI();

    // code to initialize ThreeJS
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

    /** Cube */
    // this.geometry = new THREE.BoxGeometry();
    // this.material = new THREE.MeshBasicMaterial( {
    //   color: 0x00ff00,
    //   wireframe: false
    // } );

    // this.originCube = this.createCube(0,0,0);

    /** Circle */
    const circleGeometry = new THREE.CircleGeometry( 2, 32 );
    this.wireframeMaterial = new THREE.MeshBasicMaterial( {
      color: 0x00ff00,
      wireframe: true
    } );
    this.circle = new THREE.Mesh( circleGeometry, this.wireframeMaterial );

    // Rotate the circle around the X-axis by ~30 degrees
    this.circle.rotation.x = Math.PI / - 3;

    // To rotate around the Y-axis, uncomment below:
    // this.circle.rotation.y = Math.PI / 4;

    /** Add Rectangles around the Circle */
    this.rectangles = this.addRectanglesToCircle(30, 2); // 8 rectangles, 2 of radius. Storing in a variable so we can access them outside the scope of this function (eg. for UI)

    /** Debug Variables */
    this.rectangles.forEach((rectangle) => {
      this.gui.add(rectangle.rotation, 'y').min(- 3).max(3).step(0.01).name('rotationY');
    });

    /** Grid & Axis Helper */
    this.gridHelper = new THREE.GridHelper( 10, 10 );
    this.axesHelper = new THREE.AxesHelper(5); // 5 = represents the size (length) of the axes

    this.scene.add(
      // this.originCube,
      this.gridHelper,
      this.circle,
      this.axesHelper);

    this.camera.position.z = 5;

    this.renderer.render( this.scene, this.camera );

    /** Orbit Controls */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); // needs to be renderer instead of canvas on Rails

    this.animate();
  }

  addRectanglesToCircle(numberOfRectangles, circleRadius) {
    const rectangleHeight = 0.5; // modifying the height of the rectangles
    const rectangleWidth = 1
    const rectangleGeometry = new THREE.PlaneGeometry(rectangleWidth, rectangleHeight);
    const rectangleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }); // ensuring that the material renders on both sides of our 2D plane
    const rectangles = []; // to store rectangles newly created

    for (let i = 0; i < numberOfRectangles; i++) { // = we loop as many times as the number of rectangles we want to create
      const theta = (i / numberOfRectangles) * 2 * Math.PI; // angle between each rectangle
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
    }
    return rectangles;
  }

  // createCube(x,y,z) {
  //   const cube = new THREE.Mesh( this.geometry, this.material );
  //   cube.position.set(x,y,z);
  //   return cube;
  // }

  animate() { // to fix distortion of cube object
    // This creates a loop that causes the renderer to draw the scene every time the screen is refreshed (typically 60 times per second)
    requestAnimationFrame(this.animate.bind(this));

    // Render the scene with the camera
    this.renderer.render(this.scene, this.camera);
  }
}

