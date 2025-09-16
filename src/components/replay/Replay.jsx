/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "/src/replay.css";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import waternormals from "../../../public/assets/waternormals.jpg";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import Crosswind_Small from "../../data/course/Crosswind_Small.json";
import Crosswind_Big from "../../data/course/Crosswind_Big.json";
import Trapezoid_Small from "../../data/course/Trapezoid_Small.json";
import Trapezoid_Big from "../../data/course/Trapezoid_Big.json";
import Triangular_Small from "../../data/course/Triangular_Small.json";
import Triangular_Big from "../../data/course/Triangular_Big.json";
import UpDown_Small from "../../data/course/UpDown_Small.json";
import UpDown_Big from "../../data/course/UpDown_Big.json";
import { useClock } from "../ClockContext";
import Stats from "stats.js";
import { TbUserQuestion } from "react-icons/tb";
// import TimeoutPopup from "../TimeoutPopup";

let camera, scene, renderer;
let controls, water, sun, northIndicator;
let course_data;
let stats;
//global variables to store data from multiple files
let allTimeAndXYData = []; // Store time and XY data from all files
let allTimeIntervals = []; // Store time intervals from all files
let boatMeshes = [];
let selectedBoat = null;
let raycaster;
const colors = [
  "red",
  "blue",
  "green",
  "orange",
  "purple",
  "yellow",
  "cyan",
  "magenta",
];

// Create a map to track the color assigned to each boat
const boatColorMap = {};

const loader = new GLTFLoader();

class Boat {
  constructor(color, boatId) {
    this.color = color;
    this.boat = null;

    // boat model path based on the boatId
    let boatModelPath;
    switch (boatId) {
      case "1000":
        boatModelPath = "assets/boat/scenelaser.gltf";
        break;
      case "1001":
        boatModelPath = "assets/boat/scenebyte.gltf";
        break;
      case "1002":
        boatModelPath = "assets/boat/sceneoptimist.gltf";
        break;
      case "1011":
        boatModelPath = "assets/boat/scenemegabyte.gltf";
        break;
      case "1012":
        boatModelPath = "assets/boat/sceneliberty.gltf";
        break;
      case "1013":
        boatModelPath = "assets/boat/sceneliberty.gltf";
        break;
      case "1014":
        boatModelPath = "assets/boat/scene29er.gltf";
        break;
      default:
        boatModelPath = "assets/boat/scene.gltf";
        break;
    }

    this.loadingPromise = new Promise((resolve, reject) => {
      loader.load(
        boatModelPath,
        (gltf) => {
          if (!scene) {
            console.error("Scene is not initialized!");
            return;
          }

          this.boat = gltf.scene;
          this.boat.scale.set(2, 2, 2);
          this.boat.position.set(0, -10, 0);
          this.boat.rotation.y = -1.5;

          // Traverse the scene and set color for each mesh
          this.boat.traverse((child) => {
            if (child.isMesh) {
              child.material = child.material.clone();
              child.material.color.set(this.color);
              child.material.transparent = false;
              child.material.needsUpdate = true;
            }
          });

          scene.add(this.boat);
          resolve(this.boat);
        },
        undefined,
        reject
      );
    });
  }

  getObject() {
    return this.loadingPromise;
  }
}

class Flag {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.flag = null;

    this.loadingPromise = new Promise((resolve, reject) => {
      loader.load(
        "assets/flag/scene144.gltf",
        (gltf) => {
          this.flag = gltf.scene;
          scene.add(this.flag);
          this.flag.scale.set(1, 1, 1);
          this.flag.position.set(this.x, 1, this.y);
          this.flag.rotation.y = -1.5;
          resolve(this.flag);
        },
        undefined,
        reject
      );
    });
  }

  getObject() {
    return this.loadingPromise;
  }

  dispose() {
    if (this.flag) {
      disposeObject(this.flag);
    }
  }
}

class Buoy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.Buoy = null;

    this.loadingPromise = new Promise((resolve, reject) => {
      loader.load(
        "assets/buoy/scene.gltf",
        (gltf) => {
          this.Buoy = gltf.scene;
          scene.add(this.Buoy);
          this.Buoy.scale.set(2, 2, 2);
          this.Buoy.position.set(this.x, 0, this.y);
          this.Buoy.rotation.y = -1.5;
          resolve(this.Buoy);
        },
        undefined,
        reject
      );
    });
  }

  getObject() {
    return this.loadingPromise;
  }

  dispose() {
    if (this.Buoy) {
      disposeObject(this.Buoy);
    }
  }
}

// Detect device capabilities for high or low graphics mode
function detectDeviceCapabilities() {
  const cores = window.navigator.hardwareConcurrency || 4;  // Default to 4 cores if unavailable
  const memory = navigator.deviceMemory || 4;  // Default to 4GB memory if unavailable
  return (cores >= 6 && memory >= 8) ? 'high' : 'low';
}

// Define graphics settings based on performance mode
const graphicsSettings = {
  high: {
    antialias: true,
    pixelRatio: window.devicePixelRatio,
    shadowMap: true,
    waterDistortion: 3,  // Higher water quality
    skyTurbidity: 10,  // More realistic sky rendering
  },
  low: {
    antialias: true,
    pixelRatio: 0.8,
    shadowMap: false,
    waterDistortion: 0,  // Disable water distortion for performance
    skyTurbidity: 2,  // Lower quality sky rendering
  }
};

function disposeObject(object) {
  if (object.geometry) object.geometry.dispose();
  if (object.material) {
    if (object.material.map) object.material.map.dispose();
    object.material.dispose();
  }
  scene.remove(object);
}

let Buoys = [];
let flags = [];


function generateBuoy() {
  if(course_data===null){return;}
  if (course_data["Top"] != null) {
    const Buoy_top_X = course_data["Top"]["X"];
    const Buoy_top_Y = course_data["Top"]["Y"];
    Buoys.push(new Buoy(Buoy_top_X, Buoy_top_Y));
  }

  if (course_data["Left"] != null) {
    const Buoy_left_X = course_data["Left"]["X"];
    const Buoy_left_Y = course_data["Left"]["Y"];
    Buoys.push(new Buoy(Buoy_left_X, Buoy_left_Y));
  }

  if (course_data["Bottom"] != null) {
    const Buoy_bottom_X = course_data["Bottom"]["X"];
    const Buoy_bottom_Y = course_data["Bottom"]["Y"];
    Buoys.push(new Buoy(Buoy_bottom_X, Buoy_bottom_Y));
  }

  if (course_data["Right"] != null) {
    const Buoy_right_X = course_data["Right"]["X"];
    const Buoy_right_Y = course_data["Right"]["Y"];
    Buoys.push(new Buoy(Buoy_right_X, Buoy_right_Y));
  }
}

function generateFlag() {
  const flag = new Flag(
    course_data["Start_right"]["X"],
    course_data["Start_right"]["Y"]
  );
  flags.push(flag);
}
//-----------------------------
async function importCourseData(courseData) {
  try {
    switch (courseData) {
      case "1,0":
        course_data = Crosswind_Small;
        break;
      case "1,1":
        course_data = Crosswind_Big;
        break;
      case "2,0":
        course_data = Trapezoid_Small;
        break;
      case "2,1":
        course_data = Trapezoid_Big;
        break;
      case "3,0":
        course_data = Triangular_Small;
        break;
      case "3,1":
        course_data = Triangular_Big;
        break;
      case "4,0":
        course_data = UpDown_Small;
        break;
      case "4,1":
        course_data = UpDown_Big;
        break;
      default:
        console.error("Invalid course data:", courseData);
    }
  } catch (e) {
    console.error(`Error importing JSON data: ${error}`);
  }
}

const BoatSelectionCheckboxes = ({
  fileNames,
  onVisibilityChange,
  boatInstances,
}) => {
  const [selectedBoats, setSelectedBoats] = useState(() => {
    // Load data from local storage if available, otherwise default to all true
    const savedData = JSON.parse(localStorage.getItem("selectedBoats1"));
    return savedData || Array.from({ length: fileNames.length }, () => true);
  });

  useEffect(() => {
    // Update local storage whenever selectedBoats changes
    localStorage.setItem("selectedBoats1", JSON.stringify(selectedBoats));
  }, [selectedBoats]);

  useEffect(() => {
    window.addEventListener("click", onDocumentMouseClick);
    return () => {
      window.removeEventListener("click", onDocumentMouseClick); // Cleanup
    };
  }, []);

  useEffect(() => {
    window.addEventListener("click", onDocumentMouseClick, false);
    return () => {
      window.removeEventListener("click", onDocumentMouseClick, false);
    };
  }, [boatInstances, camera]);

  const handleChange = (index) => {
    const updatedSelectedBoats = [...selectedBoats];
    updatedSelectedBoats[index] = !updatedSelectedBoats[index];
    setSelectedBoats(updatedSelectedBoats);

    // Update the visibility of the corresponding boat instance
    const boatInstance = boatInstances[index];
    if (boatInstance) {
      boatInstance.visible = updatedSelectedBoats[index];
    }

    onVisibilityChange(updatedSelectedBoats);
  };

  return (
    <div id="checkboxes">
      {fileNames.map((fileName, index) => (
        <div key={index}>
          <label style={{ color: colors[index] }}>
            <input
              type="checkbox"
              checked={selectedBoats[index]}
              onChange={() => handleChange(index)}
            />
            {fileName}
          </label>
        </div>
      ))}
    </div>
  );
};

const Replay = ({ allData, canvasRef, upperHalfRef, mapRef, lastReceivedTime, isPlaying}) => {
  const [graphicsMode, setGraphicsMode] = useState(detectDeviceCapabilities());  
  const { globalClockTime } = useClock();
  const [visibleBoats, setVisibleBoats] = useState(
    Array(allData.length).fill(true)
  );
  const clockTimeRef = useRef(globalClockTime);
  
  const rendererRef = useRef(null); // To store the renderer instance
  
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [isLiveData, setIsLiveData] = useState(window.isLiveData);

  const [boatPaths, setBoatPaths] = useState({}); // Initialize state for boat paths

  // Function to update boat info when a boat is clicked
  const updateSelectedBoat = (boatName) => {
    setSelectedBoat(boatName);
  };

  // Function that will be called by onDocumentMouseClick to reset info
  const resetSelectedBoat = () => {
    setSelectedBoat(null);
  };

  useEffect(() => {
    clockTimeRef.current = globalClockTime;
  }, [globalClockTime]);

  const handleVisibilityChange = (updatedVisibility) => {
    setVisibleBoats(updatedVisibility);
  };
  //Millie
  useEffect(() => {
    importCourseData(allData[0].courseData);
    generateBuoy();
    generateFlag();

    if (upperHalfRef.current) {
      init();
    }

    console.log(`Current Graphics Mode: ${graphicsMode}`);  // Log the current graphics mode

    return () => {
      // Dispose of all buoys and flags when component unmounts
      Buoys.forEach((Buoy) => Buoy.dispose());
      flags.forEach((flag) => flag.dispose());

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      // Clean up any event listeners
      window.removeEventListener("resize", onWindowResize);
    };
  }, [graphicsMode, upperHalfRef]);

  useEffect(() => {
    if(window.isLiveData){
    const updateBoats = () => {
      if (allData && allData.length > 0) {
        allData.forEach((data, index) => {
          const boat = boatMeshes[index];
          if (boat) {
            const newX = data.X_Position[0];
            const newY = data.Y_Position[0];
            boat.position.set(-newX, boat.position.y, newY);
            boat.rotation.y = data.headingRadians[0];
          }
        });
      }
    };

    const animateLiveData = () => {
      requestAnimationFrame(animateLiveData);
      updateBoats();
      renderer.render(scene, camera);
    };

    animateLiveData();

    return () => {
      cancelAnimationFrame(animateLiveData);
    };}
  }, [allData]);
  //-------------------------
  
  const livePoints = []; // Store live points for each boat 

  function init() {
    // Create the stats object(Ellie)
    stats = new Stats();
    stats.showPanel(0);

    // Set the position of the stats object
    stats.dom.style.position = "absolute";
    stats.dom.style.top = "0px";
    stats.dom.style.left = "0px";
    stats.dom.style.zIndex = "100";

    // Scale the stats object
    stats.dom.style.transform = "scale(1.5)";
    stats.dom.style.transformOrigin = "top left";

    // Add the stats object to the DOM
    document.body.appendChild(stats.dom);

    // Create the WebGL renderer
    if (!rendererRef.current) {
      // Create the WebGL renderer
      raycaster = new THREE.Raycaster();
      rendererRef.current = new THREE.WebGLRenderer({
        antialias: graphicsSettings[graphicsMode].antialias,
      });
      rendererRef.current.setPixelRatio(graphicsSettings[graphicsMode].pixelRatio);
      rendererRef.current.setSize(
        canvasRef.current.clientWidth,
        mapRef.current.clientHeight
      );
      rendererRef.current.toneMapping = THREE.ReinhardToneMapping;
      rendererRef.current.setClearColor(0x000000);
      rendererRef.current.domElement.style.position = "fixed";
      rendererRef.current.domElement.style.zIndex = "-1";
      rendererRef.current.domElement.style.left = "0";
      rendererRef.current.domElement.style.top = "0";
      upperHalfRef.current.appendChild(rendererRef.current.domElement);
    }

    // Reuse the existing renderer
    renderer = rendererRef.current;
    // raycaster = new THREE.Raycaster();
    // renderer = new THREE.WebGLRenderer({
    //   antialias: graphicsSettings[graphicsMode].antialias,
    // });
    // renderer.setPixelRatio(graphicsSettings[graphicsMode].pixelRatio);
    // // renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.setSize(
    //   canvasRef.current.clientWidth,
    //   mapRef.current.clientHeight
    // );

    // renderer.toneMapping = THREE.ReinhardToneMapping;
    // renderer.setClearColor(0x000000);
    // renderer.domElement.style.position = "fixed";
    // renderer.domElement.style.zIndex = "-1";
    // renderer.domElement.style.left = "0";
    // renderer.domElement.style.top = "0";

    // upperHalfRef.current.appendChild(renderer.domElement);

    // Create the scene
    scene = new THREE.Scene();

    // Create the camera
    camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      1,
      2000
    );
    camera.position.set(10, 50, -120);

    // Create the sun vector
    sun = new THREE.Vector3();

    // Create the water geometry
    const waterGeometry = new THREE.PlaneGeometry(3000, 3000);

    // Create the water object
    water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        waternormals,
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),

      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: graphicsSettings[graphicsMode].waterDistortion, // Adjust water quality
      // flowDirection: new THREE.Vector2(0, 0), // Set flow direction to 0 to stop movement
      fog: scene.fog !== undefined,
    });

    // Set the rotation of the water
    water.rotation.x = -Math.PI / 2;

    // Add the water to the scene
    scene.add(water);

    // Remove if user want to see the water movement
  
    // Disable the time update in the render loop
    // const originalRenderFunction = renderer.render.bind(renderer);

    // renderer.render = function (scene, camera) {
    //   // Disable time updates for water shader
    //   if (water.material.uniforms["time"]) {
    //     water.material.uniforms["time"].value = 0;
    //     water.material.uniforms["time"].needsUpdate = true;
    //   }

    //   // Call the original render function
    //   originalRenderFunction(scene, camera);
    // };

    // Create the sky object
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    // Set the parameters for the sky (lower quality)
    const skyUniforms = sky.material.uniforms;
    skyUniforms["turbidity"].value = graphicsSettings[graphicsMode].skyTurbidity; // Adjust sky quality
    skyUniforms["rayleigh"].value = 0.5; // Lower Rayleigh
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    // Set the parameters for the sun
    const parameters = {
      elevation: 10,
      azimuth: 180,
    };

    // Update the position of the sun and sky
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();
    scene.environment = null; // Disable environment mapping from the sky

    // Create a simple directional light to replace the complex sun
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); // Reduced intensity
    directionalLight.position.set(50, 200, -100); // Adjusted position
    scene.add(directionalLight);

    // Create orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 10, 0);
    controls.minDistance = 40.0;
    controls.maxDistance = 1000.0;
    controls.update();

    // Add event listener for window resize
    window.addEventListener("resize", onWindowResize);

    // ===== Norh Indicator ======
    const cubeSize = 20;
    const indicatorDistance = 200; // Adjust the distance from the center

    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    northIndicator = new THREE.Mesh(cubeGeometry, cubeMaterial);

    // Position the cube at the north direction
    northIndicator.position.set(0, 50, indicatorDistance);
    //scene.add(northIndicator);    

    if (window.isLiveData) {
      // Create a function to update boatPaths
      const updateBoatPaths = (allData) => {
        setBoatPaths((prevBoatPaths) => {
            const updatedBoatPaths = { ...prevBoatPaths }; // Clone the previous state

            for (let j = 0; j < allData.length; j++) {
                const boatName = allData[j].name[0];
                const X_Position = allData[j].X_Position;
                const Y_Position = allData[j].Y_Position;

                console.log('boatName:', boatName);
                console.log('X_Position:', X_Position);
                console.log('Y_Position:', Y_Position);

                // Assign a color to the boat if it doesn't already have one
                if (!boatColorMap[boatName]) {
                  const colorIndex = Object.keys(boatColorMap).length % colors.length; // Cycle through colors
                  boatColorMap[boatName] = colors[colorIndex]; // Assign a color from the colors array
                }
                
                // Create or update the path for the current boat
                if (!updatedBoatPaths[boatName]) {
                    updatedBoatPaths[boatName] = [];
                }

                if (!isNaN(X_Position[0]) && !isNaN(Y_Position[0])) {
                    const position = new THREE.Vector3(-X_Position[0], 0, Y_Position[0]);
                    updatedBoatPaths[boatName].push(position);
                } 
            }

            return updatedBoatPaths; // Return the updated state
        });
    };

    // Call the update function with the incoming data
    updateBoatPaths(allData);

    // Draw lines for the boats based on updated paths
    Object.keys(boatPaths).forEach(boatName => {
        if (boatPaths[boatName].length > 1) {
            const points = boatPaths[boatName];

            // Get the assigned color for the current boat
            const boatColor = boatColorMap[boatName];

            const geometry = new THREE.BufferGeometry().setFromPoints(points);            
            const material = new THREE.LineBasicMaterial({ color: boatColor, linewidth: 2, linecap: "round", linejoin: "round" });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
        } else {
          console.warn(`Skipping point for boat ${boatName} due to invalid position.`);
      }
    });
    } else {
      for (let j = 0; j < allData.length; j++) {
        //const timeAndXYData = allData[j].timeAndXY;        
        const time = allData[j].time;
        const X_Position = allData[j].X_Position;
        const Y_Position = allData[j].Y_Position;
  
        const points = [];
  
        for (let i = 1; i < time.length; i++) {
          const xPosition = X_Position[i];
          const yPosition = Y_Position[i];
  
          // Check if xPosition and yPosition are not NaN
          if (!isNaN(xPosition) && !isNaN(yPosition)) {
            points.push(new THREE.Vector3(-xPosition, 0, yPosition));
          }
        }
  
        if (points.length > 1) {
          // Check if there are at least 2 valid points to create a line
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
          const colorIndex = j; // Use data index for color assignment
          const color = colors[colorIndex];
  
          const material = new THREE.LineBasicMaterial({
            color: color,
            linewidth: 2,
            linecap: "round",
            linejoin: "round",
          });
  
          const line = new THREE.Line(geometry, material);
          line.userData.boatIndex = j;
          scene.add(line);
        } else {
          console.warn(
            `Skipping line ${j} due to insufficient valid data points.`
          );
        }
      }
    }    

    const startingLine = [];

    for (
      let i = course_data["Start_left"]["Y"];
      i <= course_data["Start_right"]["Y"];
      i++
    ) {
      startingLine.push(new THREE.Vector3(0, 0, i));
      startingLine.push(new THREE.Vector3(-5, 0, i));
    }

    const startingLinegeo = new THREE.BufferGeometry().setFromPoints(
      startingLine
    );

    const startingLinematerial = new THREE.LineBasicMaterial({
      color: 0xaaff00,
      linewidth: 1,
    });

    const startline = new THREE.Line(startingLinegeo, startingLinematerial);
    scene.add(startline);

    const fontLoader = new FontLoader();

    fontLoader.load("fonts/helvetiker_bold.typeface.json", function (font) {
      const textNorth = new TextGeometry("North", {
        font: font,
        size: 20,
        height: 2,
      });

      const northMesh = new THREE.Mesh(textNorth);
      northMesh.castShadow = true;
      northMesh.position.set(0, 50, 200);
      //northMesh.position.x -= -180;
      northMesh.rotateY(3);
      const textSouth = new TextGeometry("South", {
        font: font,
        size: 30,
        height: 2,
      });

      const southMesh = new THREE.Mesh(textSouth);
      southMesh.castShadow = true;
      southMesh.position.set(0, 50, -300);
      southMesh.rotateY(0);

      scene.add(northMesh);
      scene.add(southMesh);
    });

    // Start the animation loop
    animate();
    handleMultipleFilesData();
    moveBoats(colors);
    updateAllBoats(); 
  }

  function highlightBoat(boatMesh) {
    // Clear any existing highlight edges
    if (boatMesh.userData.highlightEdges) {
        boatMesh.userData.highlightEdges.forEach(edge => {
            edge.parent.remove(edge); // Remove the existing edge lines
        });
        boatMesh.userData.highlightEdges = []; // Reset highlight edges
    }

    // Initialize the array to hold highlight edges
    boatMesh.userData.highlightEdges = [];

    // Traverse the boat mesh
    boatMesh.traverse((child) => {
        if (child.isMesh) {
            // Save the original material if not already saved
            if (!child.userData.originalMaterial) {
                child.userData.originalMaterial = child.material.clone();
            }

            // Create edges geometry
            const edges = new THREE.EdgesGeometry(child.geometry);
            const edgeMaterial = new THREE.LineBasicMaterial({
                color: 0xffff00, // Highlight color (yellow)
                linewidth: 2,
            });
            const edgeLines = new THREE.LineSegments(edges, edgeMaterial);

            // Add edge lines to the mesh
            child.add(edgeLines);
            
            // Store the reference to the highlight edges in userData
            boatMesh.userData.highlightEdges.push(edgeLines);
        }
    });
}

function resetBoatHighlight() {
    boatMeshes.forEach((boatMesh) => {
        // Reset the material for each child mesh
        boatMesh.traverse((child) => {
            if (child.isMesh && child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial; // Reset material
            }
        });

        // Remove highlight edges
        if (boatMesh.userData.highlightEdges) {
            boatMesh.userData.highlightEdges.forEach(edge => {
                edge.parent.remove(edge); // Remove the edge lines
            });
            boatMesh.userData.highlightEdges = []; // Clear highlight edges reference
        }
    });
}


  function hideAllTracks() {
    scene.traverse((object) => {
      if (object.isLine) {
        object.visible = false;
      }
    });
  }

  function showAllTracks() {
    scene.traverse((object) => {
      if (object.isLine) {
        object.visible = true;
      }
    });
  }

  function onDocumentMouseClick(event, selectedBoatName, updateSelectedBoat, resetSelectedBoat) {
    const canvasBounds = renderer.domElement.getBoundingClientRect();

    const mouse = new THREE.Vector2(
      ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1,
      -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(boatMeshes, true);

    if (intersects.length > 0) {
      let intersectedBoat = intersects[0].object;

      while (
        intersectedBoat.parent &&
        boatMeshes.indexOf(intersectedBoat) === -1
      ) {
        intersectedBoat = intersectedBoat.parent;
      }

      const boatIndex = boatMeshes.indexOf(intersectedBoat);

      if (boatIndex !== -1) {
        const boatName = fileNames[boatIndex];

        if (selectedBoatName === boatName) {
          resetBoatHighlight();
          showAllTracks();
          resetSelectedBoat();          
        } else {
          resetBoatHighlight();
          hideAllTracks();
          highlightBoat(intersectedBoat);
          scene.traverse((object) => {
            if (object.isLine && object.userData.boatIndex === boatIndex) {
              object.visible = true;
            }
          });          
          updateSelectedBoat(boatName); // Update selected boat in React
        }     
      } else {
        console.log("Boat clicked, but boat not found in boatMeshes.");
      }
    } else {      
      resetBoatHighlight();
      showAllTracks();
      resetSelectedBoat(); // Reset selection in React 
    }
  } 
  // BoatInfo component to display boat name and last received time
  const BoatInfo = ({ boatName, isLiveData, lastReceivedTime }) => {

    const formattedTime = (lastReceivedTime * 60).toFixed(3);

    return (
      <div>
        <p>Boat Name: {boatName}</p>
        {isLiveData && <p>Real internal time: {formattedTime}s</p>}
      </div>
    );
  };

  useEffect(() => {
    const handleMouseClick = (event) => {
      onDocumentMouseClick(event, selectedBoat, updateSelectedBoat, resetSelectedBoat);
    };
  
    window.addEventListener("click", handleMouseClick);
  
    return () => {
      window.removeEventListener("click", handleMouseClick);
    };
  }, [selectedBoat]);

  // Function to handle window resize
  function onWindowResize() {
    if (!camera || !rendererRef.current || !canvasRef.current || !mapRef.current) return;
    // Update camera aspect ratio based on the canvas container's size
    camera.aspect = canvasRef.current.clientWidth / mapRef.current.clientHeight;
    // camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // const renderContainer = document.getElementById("render");
    // renderer.setSize(renderContainer.offsetWidth, renderContainer.offsetHeight);
    // Update the renderer size to match the container sizes
    rendererRef.current.setSize(
      canvasRef.current.clientWidth,
      mapRef.current.clientHeight
    );
  }

  // Animation loop
  function animate() {
    stats.begin();

    requestAnimationFrame(animate);
    // render();
    // Check if we're in live data mode
    if (window.isLiveData) {
      // Only render if we are playing in live data mode
      if (isPlaying) {
          render(); // Call render for live data
      }
    } else {
        // For local file upload mode, always render
        render(); // Call render for local file upload
    }
    controls.update();

    // Log the number of triangles rendered
    // console.log("Number of Triangles :", renderer.info.render.triangles);

    stats.end();
  }

  //Function to clean up stats.js when component unmounts
  useEffect(() => {
    return () => {
      stats.dom.remove();
    };
  }, []);

  // Add logic to force low graphics mode during live streaming
function setGraphicsModeForStreaming() {
  if (window.isLiveData) {
    setGraphicsMode('low');  // Force low graphics mode during live streaming
  } else {
    // Fall back to detecting device capabilities
    setGraphicsMode(detectDeviceCapabilities());
  }
}

  // Render function
  function render() {

    // Ensure graphicsMode is set based on live streaming status
    setGraphicsModeForStreaming();

    if (graphicsMode === 'high') {
      water.material.uniforms["time"].value += 1.0 / 150.0;  // Keep water moving in high mode
    } else {
      water.material.uniforms["time"].value = 0;  // Stop water movement in low mode
      water.material.uniforms["time"].needsUpdate = true;  // Force the material to update
    }

    rendererRef.current?.render(scene, camera);
  }
  // Function to handle data from multiple files
  function handleMultipleFilesData() {
    // Assuming allData is an array of data from multiple files
    allData.forEach((data) => {
      //const timeAndXYData = data.timeAndXY;
      const time = data.time;
      const X_Position = data.X_Position;
      const Y_Position = data.Y_Position;

      // Check for NaN values and skip them
      if (
        !isNaN(time) &&
        Array.isArray(X_Position) &&
        Array.isArray(Y_Position)
      ) {
        // Store time and XY data from all files
        allTimeAndXYData.push({ time, X_Position, Y_Position });
        // Calculate intervals for each file
        const intervals = calculateIntervals(data);
        allTimeIntervals.push(intervals);
      } else {
        //console.error('Invalid data encountered:', data);
      }
    });
  }

  // Calculate the time in Milliseconds between each time record point
  function calculateIntervals(data) {
    const intervals = [];
    for (let i = 2; i < data.length; i++) {
      const interval = data[i].time - data[i - 1].time;
      if (!isNaN(interval)) {
        intervals.push(interval * 60 * 1000);
      }
    }
    return intervals;
  }

  // Array to store boat instances for each file
  const boatInstances = [];

  // Function to move boats
  function moveBoats(colors) {
    allData.forEach((data, index) => {
      const {
        X_Position,
        Y_Position,
        headingRadians,
        time,
        boatId,
        heelAngle,
      } = data;

      // Create a new instance of the boat for each file with the specified color
      const boatInstance = new Boat(colors[index], boatId); // Pass color and boatId for each boat instance

      const boatData = {
        boat: boatInstance,
        data: { X_Position, Y_Position, headingRadians, heelAngle, time },
        timeIndex: 0,
        dataIndex: index,
        isLoaded: false,
      };

      boatInstance.getObject().then((loadedObject) => {
        boatData.isLoaded = true;

        // Set the initial position and rotation of the boat
        loadedObject.position.set(-X_Position[0], 0.3, Y_Position[0]);
        loadedObject.rotation.y = headingRadians[0];

        // Apply initial roll based on heel angle
        const rollRadians = heelAngle[0] * (Math.PI / 180);
        loadedObject.rotation.x = rollRadians;

        boatMeshes[index] = loadedObject;
        // Ensure all meshes are visible
        const meshes = [];
        loadedObject.traverse((child) => {
          if (child.isMesh) {
            child.visible = true;
            meshes.push(child);
          }
        });

        loadedObject.position.set(-X_Position[0], 0.3, Y_Position[0]);
        loadedObject.rotation.y = headingRadians[0];

        boatMeshes.push(loadedObject);
      });

      boatInstances.push(boatData);
    });
  }

  function updateAllBoats() {
    function animateBoats() {
      const globalClockTime = clockTimeRef.current;

      boatInstances.forEach((boatData, index) => {
        if (!boatData.isLoaded) {
          return;
        }

        const { boat, data } = boatData;
        const { X_Position, Y_Position, headingRadians, heelAngle, time } =
          data;

        if (
          !Array.isArray(time) ||
          time.length === 0 ||
          time.some((t) => t === undefined || t === null)
        ) {
          console.error(`Invalid time data for boat ${index}:`, time);
          return;
        }

        if (
          !Array.isArray(X_Position) ||
          !Array.isArray(Y_Position) ||
          !Array.isArray(headingRadians) ||
          !Array.isArray(heelAngle)
        ) {
          console.error(`Invalid position data for boat ${index}`);
          return;
        }

        if (
          X_Position.length !== Y_Position.length ||
          X_Position.length !== headingRadians.length ||
          X_Position.length !== heelAngle.length
        ) {
          console.error(`Position data lengths mismatch for boat ${index}:`, {
            X_Position: X_Position.length,
            Y_Position: Y_Position.length,
            headingRadians: headingRadians.length,
            heelAngle: heelAngle.length,
          });
          return;
        }

        const positionsToRender = time
          .map((t, idx) => ({
            time: t,
            X: X_Position[idx],
            Y: Y_Position[idx],
            heading: headingRadians[idx],
            roll: heelAngle[idx],
          }))
          .filter(
            (pos) =>
              pos.time !== undefined &&
              !isNaN(pos.X) &&
              !isNaN(pos.Y) &&
              !isNaN(pos.heading) &&
              !isNaN(pos.roll) &&
              pos.time <= globalClockTime
          );

        if (positionsToRender.length > 0) {
          const latestPosition =
            positionsToRender[positionsToRender.length - 1];

          boat.getObject().then((loadedObject) => {
            loadedObject.position.set(
              -latestPosition.X,
              loadedObject.position.y,
              latestPosition.Y
            ); // Keep the Y position unchanged
            loadedObject.rotation.y = latestPosition.heading;

            // Apply roll based on heel angle
            const rollRadians = latestPosition.roll * (Math.PI / 180);
            loadedObject.rotation.x = rollRadians;
          });
        }
      });

      requestAnimationFrame(() => animateBoats());
    }

    animateBoats();
  }

  const fileNames = allData.map((data) => data.name);

  return (
    <div>
      {/*
      <BoatSelectionCheckboxes
        fileNames={fileNames}
        onVisibilityChange={handleVisibilityChange}
        boatInstances={boatInstances}
      />
      */}
      {/* Render canvas or other components */}
      <div
        id="boat-info-container"
        style={{
          display: selectedBoat ? "block" : "none",
          position: "fixed",
          top: "10px",
          right: "10px",
          backgroundColor: "white",
          border: "1px solid #ccc",
          padding: "10px",
          zIndex: 1000,
        }}
      >
        {selectedBoat && (
          <BoatInfo
            boatName={selectedBoat}
            isLiveData={isLiveData}
            lastReceivedTime={lastReceivedTime}
          />
        )}
      </div>
      {/* <TimeoutPopup dataTimeout={dataTimeout} setDataTimeout={setDataTimeout} /> */}
    </div>
  );
};

export default Replay;