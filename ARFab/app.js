import * as THREE from './threejs/three.module.js';
import {
    ARButton
} from './threejs/ARButton.js';
import * as SIMULATION from './simulation.js';
import * as SIMULATION_MANAGER from './simulation-manager.js';
import * as Loader from './loader.js';
import {
    World
} from './world.js';
import {
    Audiomanager
} from './audio/Audiomanager.js';
import {
    OrbitControls
} from './threejs/OrbitControls.js';

import {
    catastrophe
} from './catastrophy.js';

/**
 * 
 * 
 * @class App is the main class of the whole application. 
 * 
 * The constructor is partly designed by Nicholas Lever (udemy cours) 
 * https://www.udemy.com/course/learn-webxr/learn/lecture/20512670#overview
 * @author Nicholas Lever //for the constructor 
 * @author Marcel Ehlers
 */

//Some important stuff.
let machineNumber = 15; //defines the Number of expected grid spaces reserved for machines. 
//const messageHubConnectionString = "https://mate.germanywestcentral.cloudapp.azure.com/MessageHub";
const messageHubConnectionString = "https://localhost:5001/MessageHub";

class App {
    constructor() {
        //Start of Nicholas Lever's code
        const container = document.createElement('div');
        document.body.appendChild(container);
        this.clock = new THREE.Clock();
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        this.scene = new THREE.Scene();
        // @ts-ignore
        this.scene.add(new THREE.HemisphereLight(0x606060, 0x404040));
        const light = new THREE.DirectionalLight(0xffffff);
        // @ts-ignore
        light.position.set(1, 1, 1).normalize();
        // @ts-ignore
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement);
        //End of Nicholas Lever's code.

        //Scene Setup
        this.setupScene(); 
        this.setupXR();
        this.setupOrbitControls();
        window.addEventListener('resize', this.resize.bind(this));

        //Simulation Setup
        this.counter = -50;
        this.initialized = false;
        this.initialisationFinished = false;
        this.meshbay = [];
        this.loader = new Loader.Loader(this.meshbay);

        this.initBackendConnection();
    }
    setupScene() {
        this.camera.position.z = 0;
        this.camera.position.y = .2;
        this.camera.rotation.x = 30
        this.clock = new THREE.Clock();
    }
    setupXR() {

        this.renderer.xr.enabled = true;
        // @ts-ignore
        const self = this;
        let controller;

        function onSelect() {
            // @ts-ignore
            //this.loader.loadGLTF(Loader.device_id_SAW);
        }
        document.body.appendChild(
            ARButton.createButton(this.renderer, {
                optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
                domOverlay: {
                    root: document.getElementById("catastrophy")
                }
            })
        );
        // const btn = new ARButton(this.renderer);
        controller = this.renderer.xr.getController(0);
        controller.addEventListener('select', onSelect);
        // @ts-ignore
        this.scene.add(controller);

        //Standart three.js: document.body.appendChild(ARButton(this.renderer));

        this.renderer.setAnimationLoop(this.render.bind(this));
    }
    setupOrbitControls() {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.update();
        return controls;
    }
    initBackendConnection() {

        const app = this;
        const signalR = window.signalR;


        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(messageHubConnectionString)
            .configureLogging(signalR.LogLevel.Information)
            .build();

        async function start() {
            try {
                await app.connection.start();
                console.log("SignalR Connected.");
                await app.connection.send("ARINIT", "Test");
            } catch (err) {
                console.log(err);
                setTimeout(start, 5000);
            }
        };

        this.connection.onclose(start);
        // Start the connection.
        start();
        this.connection.on("clockListener", function (/** @type {any} */ msg) {
            //Shut up. 
        });
        this.connection.on("ganttChart", function (/** @type {any} */ msg) {
            //Shut up. 
        });

        this.connection.on("AR", function (/** @type {string} */ msg) {
            const serialized = JSON.parse(msg);
            app.initialize(serialized);
            console.log(serialized);
        });
        this.connection.on("SIM", function (/** @type {string} */ msg) {
            const serialized = JSON.parse(msg);

            app.addSimulationInstructionBlueprint(serialized);
            console.log(serialized);
        });

    }
    /**
     * @param {any[]} serialized //incoming message from the backend
     */
    initialize(serialized) {
        console.log(serialized)
        machineNumber = serialized.length;
        this.loader.loadMachineGLTF("storage", "storage10000", "10000", this.meshbay, this.scene, this.audioManager);
        serialized.forEach((/** @type {{ [x: string]: string | number; }} */ machine) => {
            this.loader.loadMachineGLTF(machine["Name"], machine["Name"] + machine["Id"], machine["Id"], this.meshbay, this.scene, this.audioManager);
        });
        this.initialized = true;
        console.log("Funktioniert");
    }
    initSimulation() {

        let worldSize = Math.floor(Math.sqrt(machineNumber) + 1) + 4;
        this.world = new World(worldSize + 1, worldSize, 0.03, this.scene);
        this.simulation = new SIMULATION.Simulation(this.meshbay, this.world);

        SIMULATION_MANAGER.setInstances(this.meshbay, this.simulation, this.loader, this.scene);
        this.initialisationFinished = true;

        this.initAudio();
        //Enable disaster control 
        window.catastropheManager = new catastrophe(this.world, this.simulation, this.audioManager);
        window.catastropheManager.setWorld(this.world);
    }
    initAudio() { //must be activated through the user, or it wont work. 
        const audioListener = new THREE.AudioListener();
        this.camera.add(audioListener);
        this.audioManager = new Audiomanager(audioListener);
        this.meshbay.forEach(machine => { //update AudioManager in all machines
            machine.audioManager = this.audioManager
        });
    }
    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        // @ts-ignore
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    /**
     * Main render loop
     */
    render() {

        const delta = this.clock.getDelta();

        if (window.catastropheManager) {
            catastropheManager.update(delta);
        }

        if (this.initialized) {
            this.counter++;

            if (!this.initialisationFinished) //will be triggered once
                this.initSimulation();
        }
        if (this.counter == -20) {
            this.world.initWorld(this.meshbay);
        }
        if (this.counter == 0) { //initializes the visual part.BAD, Very Bad
            if (this.meshbay.length > 0) {
                const model = this.meshbay[0].getModel();
                // @ts-ignore
                this.scene.add(model);
            }
            this.world.getRasterVisual().forEach(element => {
                // @ts-ignore
                this.scene.add(element.getModel());
            });
        }
        if (this.counter >= 0) {
            let time = delta;
            for (let i = this.meshbay.length - 1; i > 0; i--) {
                this.meshbay[i].update(time);
            }

            this.world.getRasterVisual().forEach(element => {
                // @ts-ignore
                element.update(time);
            });
            SIMULATION_MANAGER.update();
        }




        this.renderer.render(this.scene, this.camera);
    }
    /**
     * @param {{ [x: string]: number; }} seralized
     */
    addSimulationInstructionBlueprint(seralized) {
        let machine = undefined;
        console.log(seralized);
        this.meshbay.forEach(element => {
            if (element.getMachineID() == seralized["targetMachine"]) {
                machine = element;
            }
        });
        if (machine == undefined) {
            console.error("Maschine konnte nicht gefunden werden", seralized)
            return;
        }

        let simCommObject = new SIMULATION_MANAGER.SimulationCommunication(1, seralized["location"], this.meshbay.indexOf(machine), seralized["duration"], seralized["transportRatio"]);

        SIMULATION_MANAGER.pushNewSimultaionInstruction(simCommObject);
    }
}

export {
    App
};
export {
    machineNumber
};