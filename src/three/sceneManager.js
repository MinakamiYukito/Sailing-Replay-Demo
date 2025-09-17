// src/utils/sceneManager.js

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import Stats from "stats.js";

import Boat from '../models/Boat.js';
import Flag from '../models/Flag.js';
import Buoy from '../models/Buoy.js';
import { graphicsSettings, importCourseData, detectDeviceCapabilities } from '../utils/replayUtils';
import waternormals from "/assets/waternormals.jpg";

let camera, scene, renderer, controls, water, sun, stats, raycaster;
let boatMeshes = [], boatInstances = [], Buoys = [], flags = [], fileNames = [];
let animationFrameId;

let _canvasRef, _mapRef, _upperHalfRef, _clockTimeRef, _interactionCallbacks, _allData;
let _selectedBoatName = null;

const colors = ["red", "blue", "green", "orange", "purple", "yellow", "cyan", "magenta"];
const loader = new GLTFLoader();

/**
 * Initialize and set the whole Three.js scene
 * @param {object} options 
 */
export async function setupScene(options) {
    _canvasRef = options.canvasRef;
    _mapRef = options.mapRef;
    _upperHalfRef = options.upperHalfRef;
    _clockTimeRef = options.clockTimeRef;
    _interactionCallbacks = options.interactionCallbacks;
    _allData = options.allData;
    fileNames = options.allData.map(data => data.name);

    initThreeJS(options.graphicsMode);

    const course_data = await importCourseData(options.allData[0].courseData);
    if (course_data) {
        generateBuoy(course_data);
        generateFlag(course_data);
        createCourseLines(course_data);
    }
    
    createBoats(options.allData);
    updateAllBoats();
    animate();
    
    window.addEventListener("resize", onWindowResize);

}

export function cleanup() {
    window.removeEventListener("resize", onWindowResize);

    if (renderer && renderer.domElement) {
        renderer.domElement.removeEventListener("click", onDocumentMouseClick);
    }

    cancelAnimationFrame(animationFrameId);

    Buoys.forEach((buoy) => buoy.dispose());
    flags.forEach((flag) => flag.dispose());
    boatInstances.forEach(({ boat }) => {
        if(boat && typeof boat.dispose === 'function'){
            boat.dispose();
        }
    });

    if (scene) {
        scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }

    if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentElement) {
            renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
    }
    
    if (stats) stats.dom.remove();

    camera = scene = renderer = controls = water = sun = stats = raycaster = null;
    _selectedBoatName = null;
    boatMeshes = [];
    boatInstances = [];
    Buoys = [];
    flags = [];
    fileNames = [];
    _allData = [];
}


//Internal Helper Functions

function initThreeJS(graphicsMode) {
    stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = "absolute";
    stats.dom.style.top = "0px";
    stats.dom.style.left = "0px";
    stats.dom.style.zIndex = "100";
    stats.dom.style.transform = "scale(1.5)";
    stats.dom.style.transformOrigin = "top left";
    document.body.appendChild(stats.dom);

    raycaster = new THREE.Raycaster();
    renderer = new THREE.WebGLRenderer({
        antialias: graphicsSettings[graphicsMode].antialias,
    });
    renderer.setPixelRatio(graphicsSettings[graphicsMode].pixelRatio);
    renderer.setSize(
        _canvasRef.current.clientWidth,
        _mapRef.current.clientHeight
    );
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.setClearColor(0x000000);
    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.zIndex = "-1";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.top = "0";
    _upperHalfRef.current.appendChild(renderer.domElement);

    renderer.domElement.addEventListener("click", onDocumentMouseClick);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(10, 50, -120);

    sun = new THREE.Vector3();

    const waterGeometry = new THREE.PlaneGeometry(3000, 3000);
    water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load(waternormals, (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: graphicsSettings[graphicsMode].waterDistortion,
        fog: scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms["turbidity"].value = graphicsSettings[graphicsMode].skyTurbidity;
    skyUniforms["rayleigh"].value = 0.5;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    const parameters = { elevation: 10, azimuth: 180 };
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();
    scene.environment = null;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(50, 200, -100);
    scene.add(directionalLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 10, 0);
    controls.minDistance = 40.0;
    controls.maxDistance = 1000.0;
    controls.update();

    const fontLoader = new FontLoader();
    fontLoader.load("/fonts/helvetiker_bold.typeface.json", function (font) {
        const textNorth = new TextGeometry("North", { font, size: 20, height: 2 });
        const northMesh = new THREE.Mesh(textNorth);
        northMesh.position.set(0, 50, 200);
        northMesh.rotateY(3);
        scene.add(northMesh);

        const textSouth = new TextGeometry("South", { font, size: 30, height: 2 });
        const southMesh = new THREE.Mesh(textSouth);
        southMesh.position.set(0, 50, -300);
        scene.add(southMesh);
    });
}

function animate() {
    if (!renderer || !stats) {
        return;
    }

    animationFrameId = requestAnimationFrame(animate);
    
    stats.begin();
    render(graphicsSettings[detectDeviceCapabilities()]);
    if (controls) { 
        controls.update();
    }
    stats.end();
}
function render(currentGraphicsSettings) {
    if (water) {
        water.material.uniforms["time"].value += currentGraphicsSettings.waterDistortion > 0 ? 1.0 / 150.0 : 0;
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function disposeObject(object) {
    if (!object) return;
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
    }
    if (object.parent) object.parent.remove(object);
}

function generateBuoy(course_data) {
    const buoyPositions = ["Top", "Left", "Bottom", "Right"];
    buoyPositions.forEach(pos => {
        if (course_data[pos]) {
            Buoys.push(new Buoy(scene, course_data[pos].X, course_data[pos].Y, disposeObject));
        }
    });
}

function generateFlag(course_data) {
    if(course_data["Start_right"]) {
        const flag = new Flag(scene, course_data["Start_right"].X, course_data["Start_right"].Y, disposeObject);
        flags.push(flag);
    }
}

function createCourseLines(course_data) {
    // draw all courselines
    _allData.forEach((data, j) => {
        const points = [];
        for (let i = 1; i < data.time.length; i++) {
            const x = data.X_Position[i];
            const y = data.Y_Position[i];
            if (!isNaN(x) && !isNaN(y)) {
                points.push(new THREE.Vector3(-x, 0, y));
            }
        }
        if (points.length > 1) {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: colors[j % colors.length] });
            const line = new THREE.Line(geometry, material);
            line.userData.boatIndex = j;
            scene.add(line);
        }
    });

    if(course_data["Start_left"] && course_data["Start_right"]) {
        const startLinePoints = [];
        startLinePoints.push(new THREE.Vector3(course_data["Start_left"].X, 0, course_data["Start_left"].Y));
        startLinePoints.push(new THREE.Vector3(course_data["Start_right"].X, 0, course_data["Start_right"].Y));
        const startLineGeo = new THREE.BufferGeometry().setFromPoints(startLinePoints);
        const startLineMat = new THREE.LineBasicMaterial({ color: 0xaaff00 });
        const startLine = new THREE.Line(startLineGeo, startLineMat);
        scene.add(startLine);
    }
}

function createBoats(allData) {
    allData.forEach((data, index) => {
        const { X_Position, Y_Position, headingRadians, time, boatId, heelAngle } = data;
        const boatInstance = new Boat(scene, colors[index % colors.length], boatId);
        
        const boatData = {
            boat: boatInstance,
            data: { X_Position, Y_Position, headingRadians, heelAngle, time },
            isLoaded: false,
            mesh: null, // store the loaded boats
        };

        boatInstance.getObject().then((loadedObject) => {
            boatData.isLoaded = true;
            boatData.mesh = loadedObject;

            if (X_Position[0] && Y_Position[0] && headingRadians[0]){
                 loadedObject.position.set(-X_Position[0], 0.3, Y_Position[0]);
                 loadedObject.rotation.y = headingRadians[0];
                 const rollRadians = heelAngle[0] * (Math.PI / 180);
                 loadedObject.rotation.x = rollRadians;
            }
            boatMeshes[index] = loadedObject;
        });

        boatInstances.push(boatData);
    });
}
function updateAllBoats() {
    function animateBoats() {
        const globalClockTime = _clockTimeRef.current;

        boatInstances.forEach((boatData) => {
            if (!boatData.isLoaded || !boatData.mesh) {
                return; 
            }
            

            const loadedObject = boatData.mesh;
            const { time, X_Position, Y_Position, headingRadians, heelAngle } = boatData.data;

            let latestPosition = null;
            for(let i = 0; i < time.length; i++) {
                if (time[i] <= globalClockTime) {
                    latestPosition = {
                        X: X_Position[i],
                        Y: Y_Position[i],
                        heading: headingRadians[i],
                        roll: heelAngle[i],
                    };
                } else {
                    break;
                }
            }
            
            if (latestPosition) {
                loadedObject.position.set(-latestPosition.X, 0.3, latestPosition.Y);
                loadedObject.rotation.y = latestPosition.heading;
                const rollRadians = latestPosition.roll * (Math.PI / 180);
                loadedObject.rotation.x = rollRadians;
            }
        });

        requestAnimationFrame(animateBoats);
    }
    animateBoats();
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = _canvasRef.current.clientWidth / _mapRef.current.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(
        _canvasRef.current.clientWidth,
        _mapRef.current.clientHeight
    );
}

function onDocumentMouseClick(event) {

    const canvasBounds = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1,
        -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(boatMeshes, true);

    if (intersects.length > 0) {
        let intersectedBoat = intersects[0].object;
        while (intersectedBoat.parent && boatMeshes.indexOf(intersectedBoat) === -1) {
            intersectedBoat = intersectedBoat.parent;
        }
        
        const boatIndex = boatMeshes.indexOf(intersectedBoat);


        const boatName = fileNames[boatIndex];

        //If the selected boat is clicked, then cancel the selection
        if (_selectedBoatName === boatName) {
            resetBoatHighlight();
            showAllTracks();
            _selectedBoatName = null;
            _interactionCallbacks.onBoatDeselect();
        } else {
            //Otherwise, select new boat
            resetBoatHighlight();
            hideAllTracks();
            highlightBoat(intersectedBoat);
            
            scene.traverse((object) => {
                if (object.isLine && object.userData.boatIndex === boatIndex) {
                    object.visible = true;
                }
            });
            
            _selectedBoatName = boatName;
            _interactionCallbacks.onBoatSelect(boatName);
        }
    } else {
        // cancel the selection if click the blank part
        if (_selectedBoatName) {
            resetBoatHighlight();
            showAllTracks();
            _selectedBoatName = null;
            _interactionCallbacks.onBoatDeselect();
        }
    }
}

function highlightBoat(boatMesh) {
    boatMesh.traverse((child) => {
        if (child.isMesh) {
            if (!child.userData.originalMaterial) {
                child.userData.originalMaterial = child.material.clone();
            }
            const edges = new THREE.EdgesGeometry(child.geometry);
            const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
            const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
            child.add(edgeLines);
            
            // store first, convenient to remove
            if (!boatMesh.userData.highlightEdges) {
                boatMesh.userData.highlightEdges = [];
            }
            boatMesh.userData.highlightEdges.push(edgeLines);
        }
    });
}

function resetBoatHighlight() {
    boatMeshes.forEach((boatMesh) => {
        if (boatMesh.userData.highlightEdges) {
            boatMesh.userData.highlightEdges.forEach(edge => {
                edge.parent.remove(edge);
                edge.geometry.dispose();
                edge.material.dispose();
            });
            boatMesh.userData.highlightEdges = [];
        }
    });
}

function hideAllTracks() {
    if (scene) {
        scene.traverse((object) => {
            if (object.isLine && object.userData.boatIndex !== undefined) {
                object.visible = false;
            }
        });
    }
}

function showAllTracks() {
     if (scene) {
        scene.traverse((object) => {
            if (object.isLine && object.userData.boatIndex !== undefined) {
                object.visible = true;
            }
        });
    }
}