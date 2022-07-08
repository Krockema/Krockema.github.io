"use strict"

import {
    Machine,
    Stuff
} from './objects.js';
import {
    SimulationCommunication
} from './simulation-manager.js';
/**
 * The big hearth controlling every movement on the scene. 
 * This is also the Interface for a external simulation. 
 * 
 * @author Marcel Ehlers
 * @class Simulation 
 * @version 0.5 finished but not done.
 */
class Simulation {

    /**
     * @param {Machine[]} meshbay
     * @param {import("./world.js").World} world
     */
    constructor(meshbay) {
        this.meshbay = meshbay;
        this.instructionBuffer = [];

        //Disaster relevant instructions
        //this.disasterFlowAwayAllowed = false; //Example for creating own alternative simulations.
        this.hold_simulation = false;
        this.alternative_simulation = false;
    }


    /**
     * @param {SimulationInstruction} simulationInstruction
     */
    pushSimulationInstruction(simulationInstruction) {
        this.instructionBuffer.push(simulationInstruction);
    }

    /**
     * each frame activates this method. 
     * 
     * !!!!This is a point that can update running simulations with new instructions 
     * if the Backend is out of sync!!!!!!
     * 
     * @param {number} timeNow time, counting the frames.
     */

    update(timeNow) {
        if (this.hold_simulation) //Catastrophe Manager can hold the simulation
        {
            if (this.alternative_simulation)
                this.updateAlternativeSimulation();
            return;
        }

        for (let i = 0; i < this.instructionBuffer.length; i++) {

            if (this.instructionBuffer[i].isSimulationStarted(timeNow)) {
                //console.warn("Simulation ", this.instructionBuffer[i].getStuff().getStuffID(), " ist marked for running.");

                if (this.instructionBuffer[i].updateSimulation(timeNow)) {
                    console.log("splice", this.instructionBuffer.splice(i, 1));
                    i = 0;
                }
            }
        }
    }

    /**
     * Insert instructions for alternate stuff behavior here. (Disaster Function, indirectly controlled by catastrophe.js through render loop)
     */
    updateAlternativeSimulation() {
        /* Example 
        if (this.disasterFlowAwayAllowed) {
             for (let i = 0; i < this.instructionBuffer.length; i++) {
                 let model = this.instructionBuffer[i].getStuff();
                 if (model == undefined)
                     return;
                 model = model.getModel();
                 let x = model.position.x;
                 let y = model.position.y;
                 let z = model.position.z;
                 model.position.set(x - 0.001, y, z + 0.0004);
             }
         }
         */
    }

    /**
     * Stops all movements of stuff objects
     * @param {boolean} boolean
     */
    disasterHoldSimulation(boolean) {
        this.hold_simulation = boolean;
        this.alternative_simulation = boolean; //split this, if you want more control
    }
}
/**
 * @class Sim is a instruction object needed to define a part of the total simulation for a single stuff object.
 */
class SimulationInstruction { //BESSEREN NAMEN GEBEN

    /**
     * @param {SimulationCommunication} simcom
     * @param {Stuff[]} stuffbay; //Cause it need some time to load.
     * @param {Machine[]} meshbay
     */
    constructor(simcom, stuffbay, meshbay) {
        let machine = meshbay[simcom.getTargetMachine()];
        if (machine == undefined) {
            console.error("Invalid simulation instruction arguments. Simulation is going to fail");
            return;
        }
        this.simcom = simcom;
        this.stuffbay = stuffbay;
        this.machine = machine;
        this.simulation_phase_next = "start"; //start state
        this.lifespan = 3; //amount of possible state changes (old system), (x+1)
        this.last = "Cheesecake"; //Just initialize this. No specific value needed. 
        this.startDate = undefined;

    }
    //************************ Getter and Setter *********************************************
    get_duration_transport() {
        return this.simcom.getDurTransport();
    }
    get_duration_process() {
        return this.simcom.getDurProcess();
    }
    get_machine() {
        return this.simcom.getTargetMachine();
    }
    getLifeSpan() {
        return this.lifespan;
    }
    getStuff() {
        return this.stuffbay[0];
    }
    setSimulationStartTime() {
        this.startDate = Date.now();
    }
    //**************************** Time Checkers *********************************************
    /**
     * @param {number} timeNow
     */
    isSimulationStarted(timeNow) {
        if (this.simcom.getStartDate() <= timeNow)
            return true;
        return false;
    }

    /**
     * @param {number} timeNow
     */
    isSimulationFinished(timeNow) {
        let stuff = this.stuffbay[0];
        if (this.simcom.getEndDate() <= timeNow) {
            console.warn("Simulation ", stuff.getStuffID(), " ist marked as finished.");
            return true;
        }

        return false;
    }

    /**
     * Update method. Entry point. 
     * @param {number} timeNow
     */
    updateSimulation(timeNow) { //Emergency solution. Refractoring needed. Pull the state machine out of Object.Stuff!
        let stuff = this.stuffbay[0];
        let timeDifference = timeNow - this.timeLastTick;
        this.timeLastTick = timeNow;

        if (this.updateStateMachine(timeDifference, timeNow)) {
            console.warn("Request removal", this.stuffbay[0].getStuffID());
            return true;
        }
    }

    /**
     * This is the brain behind movements of objects between machines
     * It also triggers animation changes of the machines
     * @param {number} timeDifference
     * @param {number} timeNow
     */
    updateStateMachine(timeDifference, timeNow) {
        let stuff = this.stuffbay[0]; //Maybe we have multiple stuff models (like a robot beneath it). Thats why I inserted an array. 

        switch (this.simulation_phase_next) {
            case "start":
                if (this.startDate == undefined)
                    this.setSimulationStartTime();
                this.simulation_phase_next = "switchToTransportToMachine";
                break;
            case "finished":
                //Request destruction of simulation instruction instance (or maybe the whole stuff object) (or recycling) 
                stuff.set_visibility(false); //for recycling TODO
                console.warn("Simulation finished. Congratulation");
                return true;
                break;
            case "processing":
                //space for switching the model (if you like to show progress to the user ;))
                if (timeNow >= this.simulation_phase_end_time)
                    this.simulation_phase_next = "switchToTransportToStorage";
                break;
            case "transportToMachine":
                this.move_element(timeNow, timeDifference, stuff, "toMachine");

                if (timeNow >= this.simulation_phase_end_time) //this might be out of sync to the visible simulation, leading to an abrupt disappearing
                    this.simulation_phase_next = "switchToProcessing";
                break;
            case "transportToStorage":
                this.move_element(timeNow, timeDifference, stuff, "toStorage"); //counter, timeDifference, this, "toMachine"

                if (timeNow >= this.simulation_phase_end_time) //this might be out of sync to the visible simulation, leading to an abrupt disappearing
                    this.simulation_phase_next = "finished";
                break;
            case "switchToProcessing": //SWITCH STATES 
                if (this.machine != undefined)
                    this.machine.selectAnimation("busy");
                else
                    console.exception("Maschine is undefinded.")

                console.warn("Switch to Processing");
                //start request to Animation state cycle of target machine
                stuff.set_visibility(false);
                this.simulation_phase_end_time = this.startDate + this.simcom.getDurProcess() + this.simcom.getDurTransport();
                this.simulation_phase_next = "processing";
                break;
            case "switchToTransportToStorage":
                if (this.machine != undefined)
                    this.machine.selectAnimation("idle");
                else
                    console.exception("Maschine is undefinded.")

                console.warn("Switch to Transport -> Storage");
                stuff.set_visibility(true);
                //stop request to Animation state cycle of target machine (wont stop immediately)
                this.simulation_phase_next = "transportToStorage";
                this.simulation_phase_start_time = Date.now();
                this.simulation_phase_end_time = this.startDate + this.simcom.getDurProcess() + this.simcom.getDurTransport() * 2;
                break;
            case "switchToTransportToMachine":
                console.warn("Switch to Transport -> Machine");
                stuff.set_visibility(true);
                this.simulation_phase_next = "transportToMachine";
                this.simulation_phase_start_time = Date.now();
                this.simulation_phase_end_time = this.startDate + this.simcom.getDurTransport();
                break;
            default:
                console.error("Congratulation. If you see this, you managed to break the simulation in a way I thought it was not possible.");
                console.error("You receive a digital Cookie, if you tell me how you did this. ;D ")
                break;
        }
    }


    /**
     * @param {String} animation_request
     */

    updateLifeSpan() {
        this.lifespan = this.lifespan - 1;
    }

    triggerWaypoints() { //determines the direction of waypoints which they have to face 
        const visual_way = this.machine.getVisualWay();
        visual_way.forEach(element => {
            element.trigger(undefined, undefined);
        });
    }

    //************************ Hearth of class *********************************************

    /**
     * @param {number} counter world time
     * @param {number} timeDifference offset between local time and world time
     * @param {Stuff} element Element that is requesting a move (usually stuff, but maybe additional objects in the future. )
     * @param {string} direction 
     */
    move_element(counter, timeDifference, element, direction) {
        if (direction != this.last) {
            if ("toMachine" == direction) {
                this.waypoints = this.machine.getWayToMachine();
            } else {
                this.waypoints = this.machine.getWayToStorage();
            }
        }
        this.last = direction;

        let progress = this.calculateProgress(counter);
        let selected_path_step = this.calculateProgressStep(progress);
        let step_size = this.calculateStepSize(progress, selected_path_step, this.simcom.getDurTransport(), timeDifference);

        let new_pos_x = step_size[0] //+ element.getModel().position.x;
        let new_pos_y = step_size[1] //+ element.getModel().position.y;
        let new_pos_z = step_size[2] //+ element.getModel().position.z;


        // console.log("Simulation Move: ", new_pos_x, new_pos_y, new_pos_z)
        element.getModel().position.set(new_pos_x, new_pos_y, new_pos_z);
        this.triggerWaypoints();

        return progress;
    }
    /**
     * @param {number} selected_path_step
     * @param {number} duration
     * @returns {number[]} Vector defining the next move of the object
     * @param {number} progress
     */
    calculateStepSize(progress, selected_path_step, duration) {
        if (this.waypoints[selected_path_step] == undefined) {
            console.error("Waypoint undefined, for index:", selected_path_step);
            console.error("Targeted Machine: ", this.machine.getMachineID());
        }
        let path_elements_amount = this.waypoints.length - 1; //-1 cause 3 points = 2 movements
        let stepBorder = (100 / (path_elements_amount));

        let localProgress = ((progress % stepBorder) * path_elements_amount) / 100;

        let w1_grid_space_tuple = this.waypoints[selected_path_step];
        let w2_grid_space_tuple = this.waypoints[selected_path_step + 1];

        let vector_step_size = []

        let local_duration = duration / path_elements_amount; //The time between two Waypoints

        vector_step_size.push(w1_grid_space_tuple.pos_x + (w2_grid_space_tuple.pos_x - w1_grid_space_tuple.pos_x) * localProgress);
        vector_step_size.push(w1_grid_space_tuple.pos_y + (w2_grid_space_tuple.pos_y - w1_grid_space_tuple.pos_y) * localProgress);
        vector_step_size.push(w1_grid_space_tuple.pos_z + (w2_grid_space_tuple.pos_z - w1_grid_space_tuple.pos_z) * localProgress);
      
        return vector_step_size;
    }


    /**
     * Returns the total progress between start waypoint and end waypoint
     * @param {number} counter
     */
    calculateProgress(counter) {
        let duration = this.simcom.getDurTransport()
        let progressTime = counter - this.simulation_phase_start_time;
        let durPercentage = 100 / duration;
        let progress = durPercentage * progressTime;
        return progress;

    }

    /**
     * This method detects between two waypoints the stuff object is
     * @param {number} progress
     */
    calculateProgressStep(progress) {
        let path_elements_amount = this.waypoints.length;

        for (let i = 0; i < path_elements_amount; i++) { //minus 1, da Strecken zwischen Punkten gebraucht werden

            if (((100 / (path_elements_amount - 1)) * i) > progress) {
                if (i - 1 < 0) {
                    console.warn("Return emergency zero: ", ((100 / (path_elements_amount - 1)) * i), ">", progress, )
                    return 0;
                }
                return i - 1;
            }
        }
        return 0;
    }
}

export {
    Simulation
};
export {
    SimulationInstruction as Sim
}