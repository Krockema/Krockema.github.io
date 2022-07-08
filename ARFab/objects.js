import * as THREE from './threejs/three.module.js';
import * as Loader from './loader.js';
import {
    Sim
} from './simulation.js';
import {
    GridSpaceTuple
} from './world.js';
import {
    Audiomanager
} from './audio/Audiomanager.js';
import {
    machineNumber
} from './app.js';

/**
 * This class contains all objects that are needed for a visual representation.
 * most of them contain a modell, some of them also animations. 
 * 
 * @author Marcel Ehlers
 * @version 1.0 Release 
 */
//********************************************************************************* */
/**
 * @class Stuff represents materials and objects that are processed by the machine. 
 */
class Stuff {

    /**
     * 
     * @param {number} stuff_id required for identification. 
     * @param {*} stuff_type defines the model, used for the visual representation
     * @param {*} stuff_name name of object (like Smartphone, Computer, Steelblock...)
     * @param {*} simulation the main instance of the simulation class. This is necessary, 
     * because stuff can pull new instructions for the simulation.
     */
    constructor(stuff_id = 0, stuff_type = "cube", stuff_name = "steel cube", simulation) {

        this.simulation = simulation; //wird gebraucht um z.b. neue Zeiten abzurufen.

        this.stuff_id = stuff_id;
        this.stuff_type = stuff_type;
        this.stuff_name = stuff_name;
        this.simulation_active = false;
        this.simulation_offset = 0; //zur Berechnung einer Differenz Lokaluhr...Weltuhr
        this.simulation_phase = "switch_to_transport";
        this.graphics = false;
        this.sim = undefined;
    }

    /**
     * This method must be called, if you want to see something on the screen
     * @param {THREE.Mesh} model 
     */
    setGraphics(model) {
        this.model = model;
        this.graphics = true;
    }

    getStuffID() {
        return this.stuff_id;
    }

    getModel() {
        return this.model;
    }
    //******************************************************************************* */
    /**
     * @param {number[]} step Vector containing the next step
     */
    move(step) {
        const x = this.model.position.x + step[0];
        const y = this.model.position.y + step[1];
        const z = this.model.position.z + step[2];
        this.model.position.set(x, y, z);
    }
    /**
     * @param {boolean} bool
     */
    set_visibility(bool) {
        this.model.visible = bool;
    }
    /**
     * @param {boolean} bool
     */
    toogle_simulation(bool) { //Erlaubt die Berechnung der Simulation für dieses Objekt. 
        this.simulation_active = bool;
    }

}
/**
 * @class Machine defines the visual and logical representation of the machines
 * 
 * There are 3 machines already defined. Cutter, Assembly, Drill. If you want to define more machines, make sure to create
 * a gltf object fitting the requirements that are listed in the documentation
 * 
 * The init signal from the backend needs to send a file name of the glb file. 
 * Sounds must be registered in Audiomanager.SelectMachineSound(). 
 * 
 */
class Machine {


    /**
     * @param {Number} device_id
     * @param {String} device_type
     * @param {String} device_name
     * @param {Audiomanager} audioManager
     */
    constructor(device_id = 0, device_type = "cut", device_name = "Kreissäge", audioManager) {
        this.animation_idle_selector = "idle"
        this.animation_busy_selector = "busy"
        this.animation_error_selector = "error"
        this.animation_current = "idle"
        this.device_id = device_id;
        this.device_type = device_type;
        this.device_name = device_name;

        this.animated = false;
        this.graphics = false;
        this.animation_next_state = "idle";

        this.red = "0xff7777";
        this.green = "0x77ff77";
        this.orange = "0xBB9933"
        this.colorstatus = "red"
        this.clock = new THREE.Clock();

        this.audioManager = audioManager;
    }
    /**
     * @param {GridSpaceTuple[]} wayToMachine
     * @param {any[]} visualWay
     */
    setWays(wayToMachine, visualWay) {
        this.wayToMachine = wayToMachine;
        this.visual_way = visualWay;
    }
    getWayToMachine() {
        return this.wayToMachine;
    }
    getVisualWay() {
        return this.visual_way;
    }
    getWayToStorage() {
        let tmp = this.wayToMachine.slice();
        return tmp.reverse();
    }
    /**
     * Must be called during initialisation
     * @param {THREE.Mesh} model
     * @param {THREE.Mesh} modelStateLight
     * @param {string | any[]} [animations]
     */
    setGraphics(model, modelStateLight, animations) {
        this.model = model;
        this.model_state_light = modelStateLight;
        this.model_state_light.material.transparent = true;
        this.model_state_light.material.opacity = 0.35;

        this.graphics = true;
        //    console.log("Graphics Load: ", this.model, this.model_state_light);

        this.mixer = new THREE.AnimationMixer(this.model);

        if (animations.length >= 5) {
            this.animated = true;

            this.action_busy = this.mixer.clipAction(animations[0]);
            this.action_error = this.mixer.clipAction(animations[1]);
            this.action_idle = this.mixer.clipAction(animations[2]);
            this.action_switch_to_busy = this.mixer.clipAction(animations[3]);
            this.action_switch_to_idle = this.mixer.clipAction(animations[4]);
            //this.clip_switch_to_error = this.model.mixer.clipAction(this.model.animations[5]); //not needed right now
            return;
        }

    }

    /**
     * Animation State Machine Initialisation
     * @param {string} selectedAnimation
     */
    selectAnimation(selectedAnimation) {


        switch (selectedAnimation) {
            case "busy":
                this.audioManager.playLocalNotification(this, "Pling");
                if (this.lock2) {
                    break;
                }
                if (this.lock)
                    break;
                if (this.animation_current = "busy")
                    this.animation_next_state = "switch_to_error";
                this.animation_next_state = "start_switch_to_processing";
                break;
            case "idle":
                this.audioManager.playLocalNotification(this, "Plong");
                if (this.lock2) {
                    break;
                }
                this.animation_next_state = "start_switch_to_idle";
                break;
            default:
                this.animation_next_state = "switch_to_error";
                break;
        }
    }

    /**
     * @param {Waypoint[]} waypoints
     */
    setOutPath(waypoints) {
        this.waypoints = waypoints;
    }

    /**
     * @param {GridSpaceTuple} grid_space_tuple
     */
    setPhysicalDimensions(grid_space_tuple) {

        let grid_size = grid_space_tuple.getGridSize();
        let x = grid_space_tuple.getPosX();
        let y = grid_space_tuple.getPosY();
        let z = grid_space_tuple.getPosZ(); // @ts-ignore

        this.model.position.set(x, y, z); // @ts-ignore
        this.model.scale.set(grid_size / 2, grid_size / 2, grid_size / 2); // @ts-ignore
        this.model_state_light.position.set(x, -grid_size * 1.5, z); // @ts-ignore
        this.model_state_light.scale.set(grid_size * 2, grid_size / 10, grid_size * 2);
        this.grid_space_tuple = grid_space_tuple;

        this.ticktest = 0;
    }

    getMachineID() { //Name ist Mist
        return this.device_id;
    }
    getModel() {
        return this.model;
    }
    getDeviceType() {
        return this.device_type;
    }

    getModelStateLight() {
        return this.model_state_light;
    }
    getWayPointsToNextMachine() {
        return this.waypoints;
    }
    getGrid_space_tuple() {
        return this.grid_space_tuple;
    }
    /**
     * This is the state machine of machines. 
     * Its purpose is to fluently switch between animations, and trigger sounds.
     * 
     * To understand the running program, please read the implementation.
     * 
     * The lock variables block changes due to simulation mistakes (2 Stuff objects arriving, )
     * 
     * @param {Number} delta
     */
    update(delta) {
        let transitionTime = 2; //one second

        if (this.animated == false)
            return;
        switch (this.animation_next_state) {
            case "idle":

                this.lock = false;
                this.lock2 = false;
                if (this.action_idle != undefined)
                    if (!this.action_idle.isRunning())
                        this.action_idle.play();
                break;
            case "start_switch_to_processing":

                this.lock = true;
                this.lock2 = true;
                this.animation_transition = transitionTime * 500 //ms
                this.animation_next_state = "switch_to_processing";

                this.action_switch_to_busy.setDuration(transitionTime); //one second
                this.action_switch_to_busy.play();
                this.action_idle.crossFadeTo(this.action_switch_to_busy, transitionTime / 2);
                this.model_state_light.material.color.setHex(this.green);
                this.audioManager.playLocalSound(this, "transition", 0.5, true);
                break;
            case "switch_to_processing":


                this.animation_transition = this.animation_transition - delta * 500;
                // console.log(this.animation_transition);
                if (this.animation_transition < 0 + delta * 500) {
                    this.action_busy.play();
                    this.action_idle.stop();
                    this.action_switch_to_busy.stop();
                    this.animation_next_state = "processing";
                    this.audioManager.playLocalSound(this, "busy", 0.5, true);
                }

                break;
            case "start_switch_to_idle":
                this.lock2 = true;

                this.audioManager.playLocalSound(this, "transition", 0.5, true);
                this.action_error.stop(); //Quickfix for a bug
                this.action_switch_to_idle.stop();
                this.action_switch_to_busy.stop();

                this.animation_transition = transitionTime * 500;
                this.animation_next_state = "switch_to_idle";

                this.action_switch_to_idle.setDuration(transitionTime); //one second
                this.action_switch_to_idle.play();
                this.action_busy.crossFadeTo(this.action_switch_to_idle, transitionTime / 2);
                this.model_state_light.material.color.setHex(this.orange);
                break;
            case "switch_to_idle":

                this.animation_transition = this.animation_transition - delta * 500;

                if (this.animation_transition < 0 + delta * 490) {

                    console.warn("SWITCH TO IDLE STOPPED")
                    this.action_idle.play();
                    this.action_busy.stop();
                    this.action_switch_to_idle.stop();
                    this.animation_next_state = "idle";
                    this.audioManager.playLocalSound(this, "idle", 0.5, true);
                }
                break;
            case "processing":
                this.lock2 = false;
                //nothing to do here
                break;
            case "switch_to_error":
                this.action_error.play();
                this.action_error.crossFadeTo(this.action_busy, 300);
                this.animation_next_state = "error";
                console.warn("error selected");
                break;
            case "error":
                //nothing to do here
                break;
        }
        this.mixer.update(delta);
    }
}

/**
 * Waypoints are pulsating 
 */
class Waypoint {

    /**
     * @param {number} x
     * @param {number} z
     * @param {number} grid_size
     * @param {number} grid_type //depending of conveyer or machine compatible place
     * @param {GridSpaceTuple} grid_space_tuple
     * @param {Loader.Loader} loader
     */
    constructor(x, z, grid_size, grid_type, grid_space_tuple, loader) {
        this.marker = [];
        this.animations = []
        let color = 0xff5555;
        if (grid_type == 1)
            color = 0x55ff55;
        loader.loadWayPointModel(this.marker, this.animations, x, z, grid_size) //new THREE.Mesh(new THREE.BoxBufferGeometry(0.6, 0.6, 0.6), material);
        this.lastStartPosition = "Schwarzwälderkirschtorte";
        this.lastEndPostion = "Käsekampfkuchen";
        this.existence = 0;

        this.grid_space_tuple = grid_space_tuple;
    }

    getModel() {
        return this.marker[0];
    }
    /**
     * Updates the pulsing animation of waypoints.
     * @param {Number} time
     */
    update(time) {

        if (this.existence <= 0) {
            this.existence = 0;
            this.getModel().visible = false;
            return;
        }
        this.getModel().visible = true;

        if (this.mixer != undefined)
            this.mixer.update(time);

        this.existence--;
    }

    /**
     * Decides if the model has enough animations. 
     * Then it creates AnimationClips that can be started and paused like a video.
     */
    initAnimations() {
        if (this.animations[0].length < 2)
            return;
        this.mixer = new THREE.AnimationMixer(this.getModel());
        this.straight_north = this.mixer.clipAction(this.animations[0][1]);
    }

    /**
     * 
     * @param {String} startPosition
     * @param {String} endPosition
     */
    trigger(startPosition, endPosition) { //tells the waypoints in which direction they are facing
        if (this.mixer == undefined)
            this.initAnimations();
        if (startPosition != this.lastStartPosition && endPosition != this.lastEndPostion) {
            this.straight_north.play();
            this.lastStartPosition = startPosition;
            this.lastEndPostion = endPosition;
            //this.selectAnimation(startPosition,endPosition);
        }
        this.existence = 1;

    }

    /**
     * 
     * @returns Array Index X (not Coordinates)
     */
    getX() {
        return this.grid_space_tuple.getIndexX();
    }
    /**
     * 
     * @returns Array Index Z (not Coordinates)
     */
    getZ() {
        return this.grid_space_tuple.getIndexZ();
    }
}

export {
    Machine
};
export {
    Stuff
};
export {
    Waypoint
};