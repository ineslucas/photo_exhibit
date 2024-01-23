import { Controller } from "@hotwired/stimulus"
import Matter from "matter-js"
import decomp from "poly-decomp"
import "pathseg"
// import FlowerIcon from "../images/flower_icon.svg"
import FlowerIconPNG from "../images/flower_icon.png"
import LoginButton from "../images/LoginButton.png"
import LogoutButton from "../images/LogoutButton.png"
import AddNewPhotoButton from "../images/AddNewPhotoButton.png"
import StartAPhotoExhibitButton from "../images/StartAPhotoExhibitButton.png"

// Connects to data-controller="menu"
export default class extends Controller {
  static targets = [ "menu", "icon", "blur", "shapes" ]

  hasInitializedPhysics = false;

  get isUserSignedIn() {
    return this.shapesTarget.dataset.userSignedIn === "true";
  }

  show() {
    this.menuTarget.classList.remove("d-none");
    this.blurTarget.classList.remove("d-none");
    this.iconTarget.classList.add("d-none");

    if (!this.hasInitializedPhysics) {
      this.initializePhysics();
      this.hasInitializedPhysics = true;
    }

    // this.handleResize = this.handleResize.bind(this);
    // this.handleResize(); // Calling immediately to set up initial size
    // window.addEventListener('resize', this.handleResize); // Add event listener for window resize
  }

  close() {
    this.menuTarget.classList.add("d-none");
    this.blurTarget.classList.add("d-none");
    this.iconTarget.classList.remove("d-none");
    // window.removeEventListener('resize', this.handleResize);
  }

  // handleResize() { // 🍓
  //   if (!this.renderer) {
  //     return;
  //   }

  //   // Update the canvas dimensions
  //   const canvas = this.renderer.canvas;
  //   const container = canvas.parentElement; // Or another method to determine the new size

  //   this.renderer.canvas.width = container.offsetWidth;
  //   this.renderer.canvas.height = container.offsetHeight;

  //   // Update the bounds of the render
  //   this.renderer.bounds.max.x = container.offsetWidth;
  //   this.renderer.bounds.max.y = container.offsetHeight;

  //   // Optionally, reposition bodies if needed
  //   // This part depends on how you want the bodies to adjust to new canvas size
  // }

  signIn() {
    window.location.href = '/users/sign_in';
  }

  signUpRoute() {
    window.location.href = '/users/sign_up';
  }

  addNewPhotoRoute() {
    window.location.href = '/photos/new';
  }

  signOut() {
    fetch('/users/sign_out', {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
      }
    }).then(response => {
      if (response.ok) {
        window.location = '/'; // Redirecting after logout
      }
    });
  }

  // unless you I need to use these variables outside intializePhysics, I don't need to declare them as instance variables (using this.)
  initializePhysics() {
    const sectionTag = this.shapesTarget;
    let w = sectionTag.offsetWidth;
    let h = sectionTag.offsetHeight;

    // Creating engine
    this.engine = Matter.Engine.create();
    this.renderer = Matter.Render.create({ // storing the renderer as an instance variable so I can access it in other methods
      element: sectionTag,
      engine: this.engine,
      options: {
        width: w,
        height: h,
        background: 'transparent',
        wireframes: false,
        pixelRatio: window.devicePixelRatio
      }
    });

    window.addEventListener('resize', () => {
      w = sectionTag.offsetWidth;
      h = sectionTag.offsetHeight;

      Matter.Render.setPixelRatio(this.renderer, window.devicePixelRatio);
      this.renderer.canvas.width = w;
      this.renderer.canvas.height = h;
      Matter.Engine.update(this.engine, this.renderer);
    });

    // forming a Flower Icon shape from SVG
    Matter.Common.setDecomp(decomp);
    const pathData = "M26.2631 100C-36.9428 175.636 24.3654 236.944 100.001 173.738C175.622 236.944 236.945 175.578 173.739 100C236.945 24.3644 175.622 -36.9438 100.001 26.2621C24.3654 -36.9438 -36.9428 24.3644 26.2631 100ZM100.001 137C120.436 137 137.001 120.435 137.001 100C137.001 79.5655 120.436 63 100.001 63C79.5665 63 63.001 79.5655 63.001 100C63.001 120.435 79.5665 137 100.001 137Z";
    let svgPathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svgPathElement.setAttribute("d", pathData);
    let vertices = Matter.Svg.pathToVertices(svgPathElement);

    console.log("vertices", vertices)

    const createShape = (x, y) => { // receives x and y coordinates as arguments - dependant on mouse position
      const flowerBody = Matter.Bodies.fromVertices(x, y, vertices, {
        frictionAir: 0.05,
        render: {
          sprite: {
            texture: FlowerIconPNG,
            yScale: 0.2,
            xScale: 0.2
          }
        }
      }, true);

      // console.log('Shape created at:', x, y);
      return flowerBody;
    };

    const login = Matter.Bodies.rectangle(70, 500, 133, 40, { // x, y, width, height
      render: {
        fillStyle: "#671069",
        chamfer: { radius: 20 },
        sprite: {
          texture: LoginButton,
          yScale: 0.5,
          xScale: 0.5
        }
      }
    })

    const logout = Matter.Bodies.rectangle(70, 500, 133, 40, { // x, y, width, height
      render: {
        fillStyle: "#671069",
        chamfer: { radius: 20 },
        sprite: {
          texture: LogoutButton,
          yScale: 0.5,
          xScale: 0.5
        }
      }
    })

    const addNewPhoto = Matter.Bodies.rectangle(70, 500, 160, 40, { // x, y, width, height
      render: {
        fillStyle: "#671069",
        chamfer: { radius: 20 },
        sprite: {
          texture: AddNewPhotoButton,
          yScale: 0.5,
          xScale: 0.5
        }
      }
    })

    const signUp = Matter.Bodies.rectangle(70, 500, 280, 40, { // x, y, width, height
      render: {
        fillStyle: "#671069",
        chamfer: { radius: 20 },
        sprite: {
          texture: StartAPhotoExhibitButton,
          yScale: 0.5,
          xScale: 0.5
        }
      }
    })

    console.log(signUp.bounds);

    const wallOptions = { isStatic: true, render: { visible: false } };
    const ground = Matter.Bodies.rectangle(w / 2, h + 50, w + 100, 100, wallOptions);
    const ceiling = Matter.Bodies.rectangle(w / 2, -50, w + 100, 100, wallOptions);
    const leftWall = Matter.Bodies.rectangle(-50, h / 2, 100, h + 100, wallOptions);
    const rightWall = Matter.Bodies.rectangle(w + 50, h / 2, 100, h + 100, wallOptions);

    const mouseControl = Matter.MouseConstraint.create(this.engine, {
      element: sectionTag,
      constraint: {
        render: { visible: false }
      }
    });

    const initialShapes = Matter.Composites.stack(50, 50, 3, 3, 40, 40, createShape); // creates a grid of shapes // x, y, columns, rows, columnGap, rowGap, callback

    Matter.World.add(this.engine.world, [
      ground,
      ceiling,
      leftWall,
      rightWall,
      mouseControl,
      initialShapes,
    ]);

    const userButton = this.isUserSignedIn ? logout : login;
    Matter.World.add(this.engine.world, userButton);

    if (this.isUserSignedIn) {
      Matter.World.add(this.engine.world, addNewPhoto);
    }

    if (!this.isUserSignedIn) {
      Matter.World.add(this.engine.world, signUp);
    }

    sectionTag.addEventListener("click", (event) => {
      const shape = createShape(event.clientX, event.clientY);
      initialShapes.bodies.push(shape);
      Matter.World.add(this.engine.world, shape);
    });

    // When we move our mouse, matter checks for collions - Does the mouse touch the body?
    sectionTag.addEventListener("mousemove", (event) => {
      const vector = { x: event.clientX, y: event.clientY };
      const hoveredShapes = Matter.Query.point(initialShapes.bodies, vector);
      hoveredShapes.forEach(shape => {
        shape.render.sprite = null;
        shape.render.fillStyle = "red";
      });
      this.currentMousePosition = { x: event.clientX, y: event.clientY };
    });

    sectionTag.addEventListener("mousedown" , () => {
      if (Matter.Query.point([logout], this.currentMousePosition).length > 0) {
        this.signOut();
      }
    });

    sectionTag.addEventListener("mousedown", () => {
      if (Matter.Query.point([login], this.currentMousePosition).length > 0) {
        this.signIn();
      }
    });

    sectionTag.addEventListener("mousedown", () => {
      if (Matter.Query.point([addNewPhoto], this.currentMousePosition).length > 0) {
        this.addNewPhotoRoute();
      }
    });

    sectionTag.addEventListener("mousedown", () => {
      if (Matter.Query.point([signUp], this.currentMousePosition).length > 0) {
        this.signUpRoute();
      }
    });

    // Run the renderer
    Matter.Render.run(this.renderer);

    // Create runner
    const runner = Matter.Runner.create();

    // Run the engine
    Matter.Runner.run(runner, this.engine);

    // Gravity
    let time = 0;
    const changeGravity = () => {
      time += 0.001;
      this.engine.world.gravity.x = Math.sin(time);
      this.engine.world.gravity.y = Math.cos(time);
      requestAnimationFrame(changeGravity);
    };

    changeGravity();

    // Change gravity based on device orientation
    // window.addEventListener("deviceorientation", function(event){
    //   this.engine.world.gravity.x = event.gamma
    //   this.engine.world.gravity.y = event.beta
    // });
  }
}


// Instance Variables: When you prefix a variable with this, it becomes an instance variable. Instance variables are accessible throughout the entire class = they can be accessed in any method of the class.
  // if I plan to use the variable outside of the method, I should create it with this.engine = Matter.Engine.create(); instead of const

// Local Variables: Variables that are declared inside a method or block are called local variables. They can be accessed only inside the method or block in which they are declared.


// Handle window resize
// window.addEventListener("resize", () => {
//   w = sectionTag.offsetWidth;
//   h = sectionTag.offsetHeight;
//   renderer.canvas.width = w;
//   renderer.canvas.height = h;
//   Matter.Render.lookAt(renderer, {
//     min: { x: 0, y: 0 },
//     max: { x: w, y: h }
//   });
// });
