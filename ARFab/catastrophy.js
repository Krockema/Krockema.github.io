/**
 * This class is the master of disaster. 
 * 
 * There are 3 types of disasters:
 * - undefined, but easy to create. (former flood, but removed cause it was bad morality to insert it)
 * - Flash
 * - Fire
 */

import {
    World
} from './world.js'

import {
    Simulation
} from './simulation.js'
import {
    Audiomanager
} from './audio/Audiomanager.js';

class catastrophe {

    /**
     * @param {World} world
     * @param {Simulation} simulation
     * @param {Audiomanager} audioManager
     */
    constructor(world, simulation, audioManager) {
        this.world = world;
        this.simulation = simulation;
        /** @type {Audiomanager} */
        this.audioManager = audioManager;
        this.isRunning = false;
        this.catBlueprint = []; //holds information of which events will happen during the disaster
    }


    /**
     * @param {String} type flood, fire, electrical
     * @param {Number} duration seconds 
     */
    start_catastrophe(type, duration) {
        if (this.isRunning) {
            return false;
        }
        this.active_catastrophe = type;
        this.duration = duration;

        this.isRunning = true;

        switch (type) {
            case "flood":
                this.init_flood();
                break;
            case "fire":
                this.init_fire();
                break;
            case "electrical":
                this.init_electrical();
                break;
        }
        return true;
    }

    /**
     * As the duration timer goes down (not up) event timestamps start high, and go low.
     * This function creates a disaster consisting of multiple events. 
     * 
     * The class for that is CatEvent (see below)
     * 
     * You can programm a disaster as you wish ;) 
     */
    /**
     * Inits a fire accident, that randomly sets one machine on fire, plays some sounds and stops all stuff objects. 
     */
    init_fire() {
        this.catBlueprint = [];
        const sirene_sound = new CatEvent("sound", this.duration, 0, {
            soundID: "sirene1",
            file: "catastrophy_active",
            volume: 0.8,
            loop: false
        });
        const fire_sound = new CatEvent("sound", this.duration / 3 * 2, 0, {
            soundID: "disastersound",
            file: "disaster_fire",
            volume: 0.8,
            loop: true
        });
        const show_fire = new CatEvent("world", this.duration / 2, 0, "fire");
        const stop_simulation = new CatEvent("simulation", this.duration / 4 * 3, 0, "stop");

        this.catBlueprint.push(sirene_sound, fire_sound, show_fire, stop_simulation)
    }
    /**
     * Inits a short circuit. Right now with a fire sound. (sry for that, don't have a device for that kind of sounds)
     */
    init_electrical() {
        this.catBlueprint = [];
        const sirene_sound = new CatEvent("sound", this.duration, 0, {
            soundID: "sirene1",
            file: "catastrophy_active",
            volume: 0.8,
            loop: false
        });
        const fire_sound = new CatEvent("sound", this.duration / 3 * 2, 0, {
            soundID: "disastersound",
            file: "disaster_fire",
            volume: 0.8,
            loop: true
        });
        const show_lightning = new CatEvent("world", this.duration / 2, 0, "electrical");
        const stop_simulation = new CatEvent("simulation", this.duration / 4 * 3, 0, "stop");

        this.catBlueprint.push(sirene_sound, fire_sound, show_lightning, stop_simulation)
    }

    /**
     * The catastrophe needs an update on each frame. 
     * @param {Number} delta
     */
    update(delta) {
        let finalize = false;
        if (!this.isRunning) {
            if (this.catBlueprint.length > 0)
                this.processCatastrophe(true);
            return;
        }
        this.duration -= delta;
        if (this.duration < 0) {
            this.isRunning = false;
            finalize = true;
        }
        this.processCatastrophe(finalize);
    }
    /**
     * This function decides, searches for events that are about to become active. It also splits the request up into different event types.
     * 
     * Valid event types are defined here. If you want to create events, have a look at the function initFire();
     *  
     * @param {boolean} finalize
     */
    processCatastrophe(finalize) {
        this.catBlueprint.forEach( /** @type {CatEvent} */ event => {
            switch (event.getType()) {
                case "sound":
                    this.processSoundEvent(event, finalize);
                    break;
                case "world":
                    this.processWorldEvent(event, finalize);
                    break;
                case "simulation":
                    this.processSimulationEvent(event, finalize);
                    break;
            }

        });
    }

    /**
     * This function controls the AudioManager in context of disaster sounds. It can create sounds, and it can stop those that are looped. 
     * Unlooped sounds cannot be stopped, and will create a harmless error message. 
     * @param {CatEvent} event
     * @param {boolean} finalize
     */
    processSoundEvent(event, finalize) {

        if (event.getStartDate() < this.duration)
            return;
        if (finalize || event.enddate > this.duration) { //end of event
            this.audioManager.stopGlobalSound(event.getArgs().soundID);
            this.catBlueprint.splice(this.catBlueprint.indexOf(event), 1);
            console.log("Finalizing Sound Event", event.args.soundID)
            return;
        }

        if (event.active)
            return;
        const params = event.getArgs();

        this.audioManager.playGlobalSound(params.soundID, params.file + ".mp3", params.volume, params.loop);
        event.active = true;

        console.warn("Startet Disaster sound")
    }
    /**
     * @param {CatEvent} event
     * @param {boolean} finalize
     */
    processWorldEvent(event, finalize) {
        if (event.getStartDate() < this.duration)
            return;
        if (event.active && !finalize && event.enddate < this.duration)
            return;

        switch (event.args) {
            case "fire":
                this.world.disasterShowFire(true);
                if (finalize) this.world.disasterShowFire(false);
                break;
            case "electrical":
                this.world.disasterShowElecticalDebris(true);
                if (finalize) this.world.disasterShowElecticalDebris(false);
                break;
        }
        event.active = true;

        if (finalize) {
            this.catBlueprint.splice(this.catBlueprint.indexOf(event), 1);
        }

    }
    /**
     * Events that effect the simulation of stuff objects are processed by this class. 
     * Right now, only a hold signal is send out. 
     * 
     * The command receiving object is Simulation located in simulation.js. 
     * @param {CatEvent} event
     * @param {boolean} finalize
     */
    processSimulationEvent(event, finalize) {

        if (event.getStartDate() < this.duration)
            return;
        if (event.active && !finalize && event.enddate < this.duration)
            return;


        switch (event.args) {
            case "stop":
                /*stops the simulation and enables alternative manipulation options 
                       (must be set for things like floating stuff)*/
                this.simulation.disasterHoldSimulation(true);
                if (finalize) this.simulation.disasterHoldSimulation(false);
                break;
        }
        event.active = true;

        if (finalize) {
            this.catBlueprint.splice(this.catBlueprint.indexOf(event), 1);
        }
    }

    /**
     * @param {Simulation} simulation
     */
    setSimulation(simulation) {
        this.simulation = simulation;
    }
    /**
     * @param {World} world
     */
    setWorld(world) {
        this.world = world;
    }
}

/**
 * 
 */
class CatEvent {
    /**
     * @param {String} type valid types are: sound, world, simulation
     * @param {Number} startdate =  0 < startdate < duration
     * @param {Number} enddate = 0 < enddate < startdate < duration
     * @param {any} args = look at the engine, which args are valid. Sounds args are soundID, file names of sounds, volume and loop control
     *
     * Important note: not looping sound with a duration > disaster duration will throw an error:
     * "Audiomanager.js:77 Sound ID is wrong [SoundID]" They will stop automatically, but cannot be 
     * stopped through the catastrophe class (due to the architecture of Audiomanager.js)
     * 
     * It has no negative effect besides this message. You can ignore it. 
     *
     */
    constructor(type, startdate, enddate, args) {
        this.type = type;
        this.startdate = startdate;
        this.enddate = enddate;
        this.args = args;
        this.active = false;
    }
    getType() {
        return this.type;
    }
    getStartDate() {
        return this.startdate;
    }
    getEndDate() {
        return this.enddate;
    }
    getArgs() {
        return this.args;
    }
}


export {
    catastrophe
}