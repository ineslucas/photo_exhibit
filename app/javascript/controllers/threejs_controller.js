import { Controller } from "@hotwired/stimulus";
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import GUI from 'lil-gui';

// Connects to data-controller="threejs"
export default class extends Controller {
  static targets = [ "canvas", "photoInfo" ];

  connect() {
    // console.log("Hello, Stimulus!", this.element); // console.log(THREE.OrbitControls); // console.log(GUI);
    this.handleResize();
    // this.handleFullscreen();
    this.rectangles = [];
    this.thetaValues = [];
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

  // handleFullscreen() {
  //   window.addEventListener('dblclick', () => {
  //     if(!document.fullscreenElement) {
  //       console.log('go fullscreen');
  //       this.renderer.domElement.requestFullscreen(); // code line specific to Rails & Stimulus, otherwise we'd call requestFullscreen() directly on the canvas
  //     } else {
  //       console.log('leave fullscreen');
  //       document.exitFullscreen();
  //     }
  //   });
  // }

  initThreeJS() {
    /** Debug */
    // this.gui = new GUI();

    /** Creating Main Scene & Cursor / Mouse Move listerners */
    this.scene = new THREE.Scene();
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    this.mouse = new THREE.Vector2();
    window.addEventListener('mousemove', (event) => { // callback function - function that gets called (back) when the event happens
      event.preventDefault(); // Prevents the default behaviour of the mousemove event, which is to move the cursor
      this.mouse.x = event.clientX / this.sizes.width * 2 - 1;
      this.mouse.y = - (event.clientY / this.sizes.height) * 2 + 1;
    });

    /** Which rectangle am I clicking on? Update singlePhotoDisplay accordingly */
    window.addEventListener('click', () => {
      if (this.currentIntersect) {
        // Iterate through each object in the rectangles array
        this.rectangles.forEach((rectangle, index) => {
          if(this.currentIntersect === rectangle) {
            console.log(`clicked on rectangle ${index + 1}`);
            /** Update the single photo display with the texture of the clicked rectangle */
            this.singlePhotoDisplay.material.map = rectangle.material.map;
            this.singlePhotoDisplay.material.needsUpdate = true;

            /** Update measurements to resemble the new material */
            const aspectRatio = rectangle.material.map.image.width / rectangle.material.map.image.height;
            let width, height;
            if (aspectRatio >= 1) {
              // Landscape or square
              width = Math.min(2, aspectRatio);
              height = width / aspectRatio;
            } else {
              // Portrait
              height = Math.min(2, 1 / aspectRatio);
              width = height * aspectRatio;
            }
            this.singlePhotoDisplay.geometry.dispose();
            this.singlePhotoDisplay.geometry = new THREE.PlaneGeometry(width, height);

            /** Update the contents of photoInfoTarget - update the title, journal entry and photo to correspond to clicked on rectangle */
            const photo = this.allPhotosData[index];
            this.photoInfoTarget.innerHTML = `
              <p>${photo.journal_entry}</p>
              <b>${photo.title}</b>`; // <img src="${photo.image_url}" width="300" />
          }
        });
      }
    });

    /** Camera & Renderer */
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(0xFFFFFF); // 0xFFFFFF = white
    this.renderer.setSize( this.sizes.width, this.sizes.height );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // retina display - optimizing for performance, by creating a pixel ratio between own screens' and a maximum of 2
    document.body.appendChild(this.renderer.domElement);

    /**
     * Objects */

      /** Circle */
      const circleGeometry = new THREE.CircleGeometry( 2, 32 );
      this.wireframeMaterial = new THREE.MeshBasicMaterial({ visible: false });
      this.circle = new THREE.Mesh(circleGeometry, this.wireframeMaterial);
      this.circle.rotation.x = Math.PI / - 3; /** Rotate the circle around the X-axis by ~30 degrees */
      // this.circle.rotation.y = Math.PI / 4; /** To rotate around the Y-axis, uncomment: */

      /** Single Photo Display */
      this.singlePhotoDisplay = this.createSinglePhotoDisplay();

    /** Raycaster */
    this.raycaster = new THREE.Raycaster();
    // this.raycaster.params.Mesh.threshold = 5; // How close to the object the mouse needs to be in order to trigger the hover effect

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
      // this.gridHelper,
      this.circle,
      // this.axesHelper,
      this.singlePhotoDisplay);

    this.renderer.render( this.scene, this.camera );
  }

  addRectanglesToCircle(numberOfRectangles, circleRadius) {
    const rectangleHeight = 0.5;
    const rectangleWidth = 1;
    const rectangles = []; // to store rectangles newly created, this is what gets called in the initThreeJS() function

    for (let i = 0; i < numberOfRectangles; i++) { // = we loop as many times as the number of rectangles we want to create
      const theta = (i / numberOfRectangles) * 2 * Math.PI; // angle between each rectangle
      this.thetaValues.push(theta); // to be used in the position and rotation of each photo on click

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
      const photoURL = this.allPhotosData[i];
      new THREE.TextureLoader().load(photoURL.image_url, texture => {
        rectangle.material.map = texture;
        texture.colorSpace = THREE.SRGBColorSpace
        rectangle.material.opacity = 1; // texture now visible
        rectangle.material.needsUpdate = true;

        /** New measurements of the geometry as per loaded texture */
        const aspectRatio = texture.image.width / texture.image.height;
        if (aspectRatio >=1) {
          // Landscape or square photo
          const newWidth = Math.min(2, aspectRatio);
          const newHeight = newWidth / aspectRatio;
          rectangle.geometry.dispose(); // Dispose old geometry
          rectangle.geometry = new THREE.PlaneGeometry(newWidth, newHeight);
        } else {
          // Portrait photo
          const newHeight = Math.min(2, 1 / aspectRatio);
          const newWidth = newHeight * aspectRatio;
          rectangle.geometry.dispose(); // Dispose old geometry
          rectangle.geometry = new THREE.PlaneGeometry(newWidth, newHeight);
        }
        // console.log("aspectRatio", aspectRatio) // defined
        // console.log("rectangle.geometry.width", rectangle.geometry.width); // undefined
        // console.log("rectangle.geometry.height", rectangle.geometry.height); // undefined
        // console.log("rectangle.scale.x", rectangle.scale.x); // returns 1
        // console.log("this.rectangleHeight", this.rectangleWidth); // undefined
        // console.log("texture.image.width", texture.image.width); // defined, but value is not at scale, so can't use it as is
        // console.log("rectangle.geometry.parameters.width * aspectRatio", rectangle.geometry.parameters.width * aspectRatio); // defined
        rectangle.geometry.needsUpdate = true;
      });
    }

    return rectangles;
  }

  createSinglePhotoDisplay() {
    // This createSinglePhotoDisplay function is called from within initThreeJS, which happens right after loadImageURLs() in the connect method.
    // At this moment, this.mainTextureOnDisplay is still undefined because the texture hasn't finished loading yet. That's why the console log inside createSinglePhotoDisplay shows undefined.

    /** Geometry */
    const singlePhotoDisplayGeometry = new THREE.PlaneGeometry(2, 1);
    /** Material */
    const singlePhotoDisplayMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide, // ensures that the material renders on both sides of our 2D plane
      map: this.mainTextureOnDisplay || null // Ensuring the texture is loaded before assigning it to the material happens in the loadImageURLs() function
    });
    /** Mesh & effectively creating the object */
    const singlePhotoDisplay = new THREE.Mesh(singlePhotoDisplayGeometry, singlePhotoDisplayMaterial);

    /** Positioning it fixed at the center of the scene */
    singlePhotoDisplay.position.set(0, 0, 0);
    singlePhotoDisplay.rotation.set(0, 0.38, 0); // 0.38 = 22 degrees in radians - facing the camera at load

    return singlePhotoDisplay;
  }

  /** Loading texture from Cloudinary URLs into previously created rectangle */
  loadImageURLs() {
    console.log("Logging the canvas O9", this.canvasTarget);

    // Accessing the DOM to retrieve the URLs stored in an input element.
    const photoDataInput = document.querySelector('input[name="photo_data"]'); // only reason we're able to select this is because it's in the DOM and this controller has access through the canvasTarget - verify!
    this.allPhotosData = JSON.parse(photoDataInput.value); // creating an array of the URLs/info stored in the input element

    this.allPhotosData.forEach((photo, index) => {
      // The key is the use of a callback function to handle the asynchronous nature of texture loading.
      new THREE.TextureLoader().load(photo.image_url, texture => {

        // Loading only the first texture from the URL at index 0 and setting it as the main texture for display.
        // Check if it's the first photo to set as the main texture
        if (index === 0) {
          this.mainTextureOnDisplay = texture; // Assigning the loaded texture to mainTextureOnDisplay once it's available.
          texture.colorSpace = THREE.SRGBColorSpace;
          console.log("Main texture loaded:", this.mainTextureOnDisplay);

          /** New measurements of the geometry of the main image as per loaded texture */
          const aspectRatio = texture.image.width / texture.image.height;
          this.mainTextureAspectRatio = aspectRatio;
          console.log(`Aspect ratio of main texture: ${aspectRatio} and width: ${texture.image.width} and height: ${texture.image.height}`); // logging correctly!

          let width, height;
          if (aspectRatio >= 1) {
            // Landscape or square
            width = Math.min(2, aspectRatio);
            height = width / aspectRatio;
          } else {
            // Portrait
            height = Math.min(2, 1 / aspectRatio);
            width = height * aspectRatio;
          }

          this.singlePhotoDisplay.geometry.dispose(); // Dispose old geometry
          this.singlePhotoDisplay.geometry = new THREE.PlaneGeometry(width, height);

          // Updating the material of the single photo display with the loaded texture:
            // This update is inside the callback, ensuring the texture is loaded before assignment.
          this.singlePhotoDisplay.material.map = this.mainTextureOnDisplay; // Assign the loaded texture to the single photo display.
          this.singlePhotoDisplay.material.needsUpdate = true; // Telling Three.js that the material has been updated and that it needs to be re-rendered.
        }
      });

    });

    /** Creating Rectangles & Debug Variables */
    this.rectangles = this.addRectanglesToCircle(this.allPhotosData.length, 2.5); // Add as many rectangles as imageURLs exist // 2.5 OG
    // this.rectangles.forEach((rectangle) => {
    //   this.gui.add(rectangle.rotation, 'y').min(- 3).max(3).step(0.01).name('rotationY');
    // });

    // Calling addToScene inside the callback to ensure the scene is updated after the texture is loaded.
    this.addToScene();

  }

  animate() {
    // Creating a loop that causes the renderer to draw the scene every time the screen is refreshed (typically 60 times per second)
    requestAnimationFrame(this.animate.bind(this));

    /** Render the main scene with orbit controls */
    this.renderer.render(this.scene, this.camera);

    /** Raycaster Animation */
    this.raycaster.setFromCamera(this.mouse, this.camera) // Raycaster is an object that allows us to detect intersections between rays and objects
    this.intersects = this.raycaster.intersectObjects(this.rectangles);

    /** Billboarding */
    this.singlePhotoDisplay.lookAt(this.camera.position); // Make the singlePhotoDisplay always face the camera

    /** Response to Hovering */
    if (this.intersects.length > 0) {
      const hoveredRectangle = this.intersects[0].object;
      const additionalRotation = 15 * (Math.PI / 180); // 15 degrees in radians
      hoveredRectangle.rotation.x = Math.PI / 2 + additionalRotation;

      // Moving the hovered rectangle to the side
        // const index = this.rectangles.indexOf(hoveredRectangle); // "At what position (index) in the this.rectangles array is the hoveredRectangle located?"
        // const theta = this.thetaValues[index]; // Get stored theta value for the hovered rectangle
        // hoveredRectangle.position.x = (2.5 + 0.5) * Math.sin(theta);
        // hoveredRectangle.position.y = (2.5 + 0.5) * Math.cos(theta);
      // hoveredRectangle.material.color.set(0xff0000); // Red
    } else {
      // When not hovering
      this.rectangles.forEach((rectangle, index) => {
        const theta = this.thetaValues[index];
        rectangle.position.x = 2.5 * Math.sin(theta); // 2.5 is a harded coded value - the original circleRadius
        rectangle.position.y = 2.5 * Math.cos(theta);

        rectangle.rotation.x = Math.PI / 2; // original rotation
        rectangle.rotation.y = Math.PI / 2 - theta; // original rotation
        rectangle.rotation.z = 0; // original rotation

        // rectangle.material.color.set(0xffffff); // Blue
      });
    }

    // How to check if we're hovering over a rectangle:
    if (this.intersects.length) {
      // if (this.currentIntersect === null) { // if right before we weren't hovering over a rectangle,
      //   // console.log("mouse enter");
      // }
      this.currentIntersect = this.intersects[0].object;
    } else {
      // if (this.currentIntersect) { // if right before there was something inside the currentIntersect variable & now there isn't, it means we just left a rectangle
      //   console.log("mouse leave");
      // }
      this.currentIntersect = null;
    }
  }
}
