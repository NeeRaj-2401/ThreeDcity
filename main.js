import './style.css'
import { dumpObject } from './debugging';
//Import the THREE.js library
import * as THREE from "three";
// To allow for the camera to move around the scene
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

//Create a Three.JS Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('#DEFEFF');
//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

//Keep the 3D object on a global variable so we can access it later
let object;

//OrbitControls allow the camera to move around the scene
let controls;

const cars = [];
//Instantiate a loader for the .gltf file
const loader = new GLTFLoader();
//Load the file
loader.load(
  `models/city/scene.gltf`,
  function (gltf) {
    //If the file is loaded, add it to the scene
    object = gltf.scene;
    scene.add(object);
    // console.log(dumpObject(object).join('\n')); // uncomment to see loaded object

    // Assuming object is the root of the GLTF scene
    const floor = object.getObjectByName('Floor_6_World_ap_0');

    // Check if the floor object exists and enable shadow reception
    if (floor) {
      floor.receiveShadow = true;
    }

    // add show to all objects
    object.traverse((obj) => {
      if (obj.castShadow !== undefined) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    // targeting car and rotating it
    const loadedCars = object.getObjectByName('Cars');
    const fixes = [
      { prefix: 'Car_08', rot: [Math.PI * .5, 0, Math.PI * .5], },
      { prefix: 'CAR_03', rot: [0, Math.PI, 0], },
      { prefix: 'Car_04', rot: [0, Math.PI, 0], },
    ];

    object.updateMatrixWorld();
    for (const car of loadedCars.children.slice()) {
      const fix = fixes.find(fix => car.name.startsWith(fix.prefix));
      const obj = new THREE.Object3D();
      car.getWorldPosition(obj.position);
      car.position.set(0, 0, 0);
      // car.rotation.set(...fix.rot);
      obj.add(car);
      scene.add(obj);
      cars.push(obj);
    }
  },
  function (xhr) {
    //While it is loading, log the progress
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    //If there is an error, log it
    console.error(error);
  }
);

//Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ alpha: true }); //Alpha: true allows for the transparent background
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

//Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);
controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.update();
//Set how far the camera will be from the 3D model
camera.position.set(0, 10, 1000);

//Add lights to the scene, so we can actually see the 3D model
{
  const skyColor = 0xB1E1FF;  // light blue
  const groundColor = 0xB97A20;  // brownish orange
  const intensity = 0.6;
  const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  scene.add(light);
}

{
  const color = 0xFFFFFF;
  const intensity = 0.8;
  const light = new THREE.DirectionalLight(color, intensity);
  light.castShadow = true;
  light.position.set(5, 10, 2);

  light.shadow.bias = -0.004;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  // Set up the shadow camera's helper to visualize the light's frustum
  const shadowHelper = new THREE.CameraHelper(light.shadow.camera);
  scene.add(shadowHelper);


  scene.add(light);
  scene.add(light.target);

  const cam = light.shadow.camera;
  cam.near = 1;
  cam.far = 2000;
  cam.left = -1500;
  cam.right = 1500;
  cam.top = 1500;
  cam.bottom = -1500;
}


//Render the scene
function animate(time) {
  //tageting cars
  time *= 0.001;  // convert to seconds
  if (cars) {
    cars.forEach((car) => {
      car.rotation.y = time;
    });
  }
  // Update the shadow camera's helper to match the light's frustum
  const shadowHelper = scene.getObjectByName('shadowHelper');
  if (shadowHelper) {
    shadowHelper.update();
  }
  requestAnimationFrame(animate);
  //Here we could add some code to update the scene, adding some automatic movement
  renderer.render(scene, camera);
}

//Add a listener to the window, so we can resize the window and the camera
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//Start the 3D rendering
animate();