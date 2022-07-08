"use strict"

import * as THREE from './threejs/three.module.js';
import * as Objects from './objects.js';
import {
    GLTFLoader
} from './threejs/GLTFLoader.js';

var stuff_id = 0; //The IDs of stuff objects will be incremented for each object. 

/**
 * This file is responsible for loading models.
 * 
 * @author Marcel Ehlers
 * @class Loader 
 */

class Loader {
    constructor() { //useless
        // console.log("Instance of Loader created.")
    }

    /**
     * @param {THREE.Mesh[]} marker
     * @param {THREE.AnimationClip[]} animations
     * @param {number} x
     * @param {number} z
     * @param {number} grid_size
     */
    loadWayPointModel(marker, animations, x, z, grid_size) { //Erzeugt ein Förderbandelement
        // @ts-ignore
        const loader = new GLTFLoader().setPath('./assets/');
        loader.load('waypoints_animated.glb',
            function ( /** @type {{ scene: any; animations: any; }} */ gltf) {
                {
                    marker.push(gltf.scene); // @ts-ignore
                    marker[0].position.set(x, -0.05, z); // @ts-ignore
                    marker[0].scale.set(grid_size - 0.01, 0.005, grid_size - 0.01);
                    animations.push(gltf.animations);
                }
            }
        );
    }

    /**
     * Loads a machine model. device_type_model holds the file name.
     * @param {string} device_typ_model
     * @param {string} device_name
     * @param {string | number} device_id
     * @param {Objects.Machine[]} meshbay
     * @param {THREE.Scene} scene
     * @param {import("./audio/Audiomanager.js").Audiomanager} audioManager
     */
    loadMachineGLTF(device_typ_model, device_name, device_id, meshbay, scene, audioManager) { //devicetyp (model) muss übergeben werden
        // @ts-ignore
        const loader = new GLTFLoader().setPath('./assets/')
        loader.load(device_typ_model + '.glb',
            function ( /** @type {{ scene: THREE.Mesh; animations: string | any[]; }} */ gltf) {
                const material = new THREE.MeshBasicMaterial({
                    color: 0xff5555
                });
                const stateLight = new THREE.Mesh(new THREE.BoxBufferGeometry(0.6, 0.6, 0.6), material);
                const mach = new Objects.Machine(Number(device_id), device_typ_model, device_name, audioManager);

                mach.setGraphics(gltf.scene, stateLight, gltf.animations);
                meshbay.push(mach); // @ts-ignore
                scene.add(gltf.scene); // @ts-ignore
                scene.add(stateLight);
            },
            function ( /** @type {any} */ xhr) {},
            function ( /** @type {any} */ err) {
                console.log('Fehlerhaft');
            }
        );
    }

    /**
     * 
     * Loads a stuff model. Right now, a cube is loaded. 
     * 
     * @param {string} stuff_typ_model
     * @param {string} stuff_name
     * @param {Objects.Stuff[]} stuffbay
     * @param {import("./simulation.js").Simulation} simulation
     * @param {{ add: (arg0: THREE.Mesh) => void; }} scene
     */
    loadStuffGLTF(stuff_typ_model, stuff_name, stuffbay, simulation, scene) {
        const loader = new GLTFLoader().setPath('./assets/')

        loader.load(stuff_typ_model + '.glb',
            function ( /** @type {any} */ gltf) {
                console.warn("Finished loading of Stuff ", stuff_id);
                const stuff = new Objects.Stuff(stuff_id, stuff_typ_model, stuff_name, simulation);
                stuff_id++;
                const material = new THREE.MeshStandardMaterial({
                    color: 0xFFFFFF * Math.random()
                });
                const stateLight = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.1, 0.1), material);

                stuff.setGraphics(stateLight); // @ts-ignore
                stateLight.scale.set(.1, .1, .1); // @ts-ignore
                stateLight.position.set(-.1, -0.4, -0.1); // @ts-ignore
                stuffbay.push(stuff);
                scene.add(stateLight);
            },
            function ( /** @type {{ loaded: number; total: number; }} */ xhr) {
                //  console.log('lädt' + xhr.loaded / xhr.total);
            },
            function ( /** @type {any} */ err) {
                console.log('Fehlerhaft');
            }
        );
    }
}
export {
    Loader
};