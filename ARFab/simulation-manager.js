"use-strict"

import {
    Sim
} from './simulation.js'

const simIncomingInstructionsBuffer = [];
let meshbay_instance = undefined;
let simulation_instance = undefined;
let loader_instance = undefined;
let scene_instance = undefined;


export function setInstances(meshbay, simulation, loader, scene) {
    meshbay_instance = meshbay;
    simulation_instance = simulation;
    loader_instance = loader;
    scene_instance = scene;
}
/**
 * Simulation Instructions are stored until they become alive and control the state machine of an stuff object. 
 * @param {SimulationCommunication} simInstruction 
 */
export function pushNewSimultaionInstruction(simInstruction) {
    simIncomingInstructionsBuffer.push(simInstruction);
}

export function update() { //Main render loop update function
    const now = Date.now();

    updateForNewSimulationInstances(now); //Creates an Instance of an simulation object fullfilling the requirements of the simulation_communication object.
    updateActiveSimulationInstances(now); //Triggers running simulations for moving on. 
}

/*
"Private functions"
*/

/**
 * 
 * @param {number} now 
 */
function updateForNewSimulationInstances(now) {
    for (let i = 0; i < simIncomingInstructionsBuffer.length; i++)
        if (simIncomingInstructionsBuffer[i].getStartDate() <= now+200) {
            let simcom = simIncomingInstructionsBuffer.splice(i)[0];

            let simulationInstruction = create_Simulation_Instruction_Instance(simcom);
            simulation_instance.pushSimulationInstruction(simulationInstruction);
        }
}
/**
 * Update for active simulation instruction 
 * @param {number} now 
 */
function updateActiveSimulationInstances(now) {
    simulation_instance.update(now);
}

/**
 * 
 * @param {SimulationCommunication} simcom 
 */
function create_Simulation_Instruction_Instance(simcom) {
    const stuffbay = []
    loader_instance.loadStuffGLTF("Ass", simcom.getStuffID(), stuffbay, simulation_instance, scene_instance);
    let simInstruction = new Sim(simcom, stuffbay, meshbay_instance);
    return simInstruction;
}


/**
 * Blueprint of a simulation event. Will be converted into a SimulationInstruction when it comes alive (file simulation.js)
 */
class SimulationCommunication {
    /**
     * 
     * @param {number} stuffID 
     * @param {number} location 
     * @param {number} targetMachine 
     * @param {number} duration 
     * @param {number} durTransport 
     * @param {number} durProcess 
     * @param {number} startDate 
     */
    constructor(stuffID = 1, location = -1, targetMachine = 3, duration = 10000, durTransport = 40, durProcess = 60, startDate = Date.now() + (2 * 1000)) { //Maybe irritating, duration in Milliseconds 
        this.stuffID = stuffID;
        this.location = location;
        this.targetMachine = targetMachine;
        this.duration = duration;
        this.durTransport = (duration * (durTransport / 200)); //single transport = 0,5 * total transport time, in ms
        this.durProcess = (duration * (durProcess / 100));//in ms
        this.startDate = startDate;
        this.endDate = startDate + (duration);
    }

    getStuffID() {
        return this.stuffID;
    }
    getTargetMachine() {
        return this.targetMachine;
    }
    getLocation() {
        return this.location;
    }
    getDuration() {
        return this.duration;
    }
    getDurProcess() {
        return this.durProcess;
    }
    getDurTransport() {
        return this.durTransport;
    }
    getStartDate() {
        return this.startDate;
    }
    getEndDate() {
        return this.endDate;
    }

}

export {
    SimulationCommunication
}