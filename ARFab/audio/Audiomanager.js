/**
 * This class contains the state system behind all sounds played on.
 * Some of them are triggered threw the machine state machine,
 * some are triggered threw user interaction.  
 * 
 * The Audiomanager is passive. It only reacts on push events. 
 */
import * as THREE from '../threejs/three.module.js';

import {
    Machine
} from "../objects.js";



class Audiomanager {

    /**
     * @param {THREE.AudioListener} audioListener
     */
    constructor(audioListener) {
        this.active_global_sounds = [];
        this.active_local_sounds = [];
        this.audioListener = audioListener;
    }


    /**
     * Short notification sounds without loops can be called with this function. 
     * @param {Machine} machine (for positioning)
     * @param {string} notification_sound (the sound file that should be played)
     */
    playLocalNotification(machine, notification_sound) {
        const notification = new THREE.PositionalAudio(this.audioListener);
        let audiofile = notification_sound + ".mp3";

        console.log("Play Notification Local: ", audiofile);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('audio/' + audiofile, function ( /** @type {any} */ buffer) {
            notification.setLoop(false);
            notification.setBuffer(buffer);
            notification.setRefDistance(20);
            notification.play();
        });
        machine.getModel().add(notification);
    }

    /**
     * @param {String} soundID
     * @param {String} audioType
     * @param {Number} volume
     * @param {Boolean} loop
     */
    playGlobalSound(soundID, audioType, volume, loop) {
        const sound = new THREE.Audio(this.audioListener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('audio/' + audioType, function ( /** @type {any} */ buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(loop);
            sound.setVolume(volume);
            sound.play();

        });
        if (loop == true) { //sounds without loop stop without a command
            sound.soundID = soundID;
            this.active_global_sounds.push(sound);
        }
    }

    /**
     * @param {String} soundID
     */
    stopGlobalSound(soundID) {
        console.warn("stop Sound: ",soundID)
        let selectedSound = this.active_global_sounds.find(sound => sound.soundID === soundID)
        if (selectedSound == undefined) {
            console.error("Sound ID is wrong",soundID);
            return;
        }
        selectedSound.stop();
        this.active_global_sounds.splice(this.active_global_sounds.indexOf(selectedSound), 1);
    }

    /**
     * @param {Machine} machine
     * @param {String} audioType
     * @param {Number} volume
     * @param {Boolean} loop
     */
    playLocalSound(machine, audioType, volume, loop) {

        let selectedSound = this.active_local_sounds.find(sound => sound.machine === machine)
        if (selectedSound != null) {
            if (selectedSound.isPlaying)
                selectedSound.stop();
            this.active_local_sounds.splice(this.active_local_sounds.indexOf(selectedSound), 1);
        }
        const sound = new THREE.PositionalAudio(this.audioListener);

        let audiofile = this.selectMachineSound(machine, audioType);

        if (audiofile == ".mp3")
            return;


        console.log("Play Sound Local: ", audiofile);

        // load a sound and set it as the PositionalAudio object's buffer
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('audio/' + audiofile, function ( /** @type {any} */ buffer) {
            sound.setLoop(loop);
            sound.setBuffer(buffer);
            sound.setRefDistance(20);
            sound.play();
        });
        if (loop == true) { //sounds without loop stop without a command
            sound.machine = machine;
            this.active_local_sounds.push(sound);
        }
        let mesh = machine.getModel();


        // finally add the sound to the mesh
        mesh.add(sound);



    }

    /**
     * @param {Machine} machine
     * @param {string} audioType
     */
    selectMachineSound(machine, audioType) {
        //This is for better controll of what is possible. It can be coded shorter
        let name = "";
        switch (machine.getDeviceType()) {
            case 'Ass':
                name = "Ass";
                break;
            case 'Cut':
                name = "Cut";
                break;
            case 'Dri':
                name = "Dri";
                break;
            case 'Storage':
                /*NOT YET IMPLEMENTED*/
                ;
                break;
        }
        switch (audioType) {
            case 'busy':
                name = name + "_Busy";
                break;
            case 'transition':
                name = name + "_Transition";
                break;
            case 'transition':
                name = name + "_Transition"; //Unused, alternative for back transition
                break;
            case 'error':
                name = name + "_Error";
                break;
            case 'idle':
                name = name + "_Idle";
                break;
        }
        name = name + ".mp3";

        return name;
    }

}


/**
 * Audio play command for global sounds must contain following parameters:
 * 
 * {String id, String audioType, Number volume, Boolean loop}
 * 
 *  - id is for identification. Multiple files can be played at the same time
 *  - audioType is the name of the file that shall be played. 
 *  - volume is a number between 0 and 1
 *  - loop controlls
 * 
 * Removing a Sound requires this parameters:
 * {String id}
 * 
 * Local Audio Sources (Machines) can be set with these parameters:
 * 
 * {Machine machine, String audioType, Number volume}
 * 
 *  - machine is needed to supply coordinates
 *  - audioType sets the sound that shall be played (busy.) Audio File will be selected with (Machinetype and audioType)
 *    Only one sound can be played per machine. 
 *  - volume is a number between 0 and 1
 * 
 * 
 * 
 * Audiofiles must be in the ogg format. 
 */


/**
 * Provided Audiofiles: 
 * catastrophy.ogg (Pride Goes Before a Fall, As I May, 4 Seconds of Intro)
 * catastrophy_active.ogg (Air Sirene, https://freesound.org/people/ScreamStudio/sounds/412171/)
 */
export {
    Audiomanager
};