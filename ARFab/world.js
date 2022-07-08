import * as THREE from './threejs/three.module.js';
import {
    Machine,
    Waypoint
} from './objects.js';
import * as Loader from './loader.js';
import * as Dijkstra from './dijkstra.js';
/**
 * Grid: Global raster that divides the world into cells
 * Machines and Waypoints are located in these cells.  
 * 
 * This class organizes all calculation leading into a visible world. 
 *  - dividing the space into cells
 *  - placing machines into these cells
 *  - calculating the path between machines
 * 
 * It also controls the events of an disaster, that place new objects into the world. 
 */

class World {

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} grid_size
     * @param {THREE.Scene} scene
     */
    constructor(x, y, grid_size, scene) {
        this.loader = new Loader.Loader();

        this.raster = [] //contains all cells of the raster
        this.raster_visual = [] //contains visual markers for the raster
        this.raster_visual_sing = []; //one dimensional array containing al visual markers
        this.raster_machine = [] //contains all cells that are reserved for machines

        this.unclaimed_machine_space_start = [1, 0]; //first unclaimed machine cell
        this.unclaimed_conveyer_space_start = [0, 0]; //first unclaimed conveyer cell

        this.max_X = x; //amount of raster cells in x direction
        this.max_Y = y; //amount of raster cells in y direction

        this.scene = scene; //scene for comfort reasons ;) 
        this.grid_size = grid_size; //length of a raster cell. 
    }

    /**
     * Calculate paths and dimensions
     * @param {Machine[]} meshbay 
     */
    initWorld(meshbay) {
        this.meshbay = meshbay;
        this.initRaster(this.max_X, this.max_Y, this.grid_size);
        this.placeMachinesOntoRaster(meshbay);
        this.initPaths(meshbay);
    }

    /**
     * 
     * @param {Machine[]} meshbay 
     */
    initPaths(meshbay) {
        let lager = meshbay[0].getGrid_space_tuple();
        Dijkstra.prepareDjkstra(this.raster);

        for (let i = 1; i < meshbay.length; i++) {
            let machine = meshbay[i].getGrid_space_tuple();
            let way = Dijkstra.dijkstra(lager.getIndexX(), lager.getIndexZ(), machine.getIndexX(), machine.getIndexZ());
            let visual_way = this.initVisualPath(way);
            meshbay[i].setWays(way, visual_way);
        }
    }


    /**
     * @param {GridSpaceTuple[]} way
     */
    initVisualPath(way) {
        let visual_way = [];

        way.forEach(( /** @type {GridSpaceTuple} */ grid_space_tuple) => {
            const x = grid_space_tuple.getIndexX();
            const z = grid_space_tuple.getIndexZ();

            if (this.raster_visual[x][z] != undefined) {
                visual_way.push(this.raster_visual[x][z]);
            } else {
                console.error("Missing waypoint model. System will crash");
            }
        });
        return visual_way;
    }

    /**
     * @param {number} x
     * @param {number} z
     * @param {number} grid_size
     */
    initRaster(x, z, grid_size) {
        for (let i = 0; i < x; i++) {
            let jArr = [];
            let jArrVis = [];
            this.raster.push(jArr);
            this.raster_visual.push(jArrVis);

            for (let j = 0; j < z; j++) {

                let cell_type = 0;
                if ((0 + i) % 2 == 0 || (1 + j) % 2 == 0) //Controls which cells are for paths. 
                    cell_type = 1;

                let tuple = new GridSpaceTuple(i, j, x, z, grid_size, cell_type);

                if (cell_type == 0) {
                    this.raster_machine.push(tuple);
                }

                this.raster[i].push(tuple);

                const object = new Waypoint(tuple.pos_x, tuple.pos_z,
                    grid_size, cell_type, tuple, this.loader);
                this.raster_visual[i].push(object);
                this.raster_visual_sing.push(object);
            }
        }
    }

    getRasterVisual() {
        return this.raster_visual_sing;
    }

    /**
     * @param {Machine[]} meshbay
     */
    placeMachinesOntoRaster(meshbay) {

        for (let i = 0; i < meshbay.length; i++)
            for (let j = 0; j < meshbay.length; j++) {
                if (meshbay[i].device_id < meshbay[j].device_id) {
                    let c = meshbay[i];
                    meshbay[i] = meshbay[j];
                    meshbay[j] = c;
                }
            }

        //positioning
        let grid_space_tuple = this.raster[0][0] //Storage is out of line due to a Dijkstra Bug.
        meshbay[0].getModel();
        meshbay[0].setPhysicalDimensions(grid_space_tuple);
        for (let i = 1; i < meshbay.length; i++) {
            let grid_space_tuple = this.raster_machine[i] //this.raster[pos_x][pos_y];
            meshbay[i].getModel();
            meshbay[i].setPhysicalDimensions(grid_space_tuple);
        }
    }

    /**
     * Creates a Plane simulating a flood
     * @param {boolean} visible
     */
    /**
     * Creates a Plane simulating a fire
     * @param {boolean} visible
     * @param {boolean} grid_space_tupel
     */
    disasterShowFire(visible) {
        if (this.fire == undefined) {

            //Change this to a fire model
            const geometry = new THREE.BoxBufferGeometry(this.grid_size * this.max_X * 0.1, this.grid_size * this.max_Y * 0.1, this.grid_size * this.max_Y * 0.1)
            const material = new THREE.MeshBasicMaterial({
                color: 0x888844,
                side: THREE.DoubleSide
            })
            const randomMachine = Math.floor(Math.random() * this.meshbay.length);
            let disasterCoordinates = this.meshbay[randomMachine].getGrid_space_tuple();
            this.fire = new THREE.Mesh(geometry, material);
            this.fire.position.set(disasterCoordinates.getPosX(), -this.grid_size * 1.2, disasterCoordinates.getPosZ())
            this.scene.add(this.fire);
            this.fire.rotation.x = Math.PI / 2;
            console.log("Fire triggered", this.grid_size * this.max_X * 1.5, this.grid_size * this.max_Y * 1.5)
        }

        console.log("change Fire visibility", visible)
        this.fire.visible = visible;
        if (!visible) {
            this.fire = undefined;
        }
    }
    /** Creates flashes
     * @param {boolean} visible
     * @param {boolean} grid_space_tupel
     */
    disasterShowElecticalDebris(visible) {
        if (this.debris == undefined) {

            //Change this to a flash model
            const geometry = new THREE.BoxBufferGeometry(this.grid_size * this.max_X * 0.2, this.grid_size * this.max_Y * 0.2, this.grid_size * this.max_Y * 0.2)
            const material = new THREE.MeshBasicMaterial({
                color: 0xEEEEEE,
                side: THREE.DoubleSide
            })
            const randomMachine = Math.floor(Math.random() * this.meshbay.length);
            let disasterCoordinates = this.meshbay[randomMachine].getGrid_space_tuple();
            this.debris = new THREE.Mesh(geometry, material);
            this.debris.position.set(disasterCoordinates.getPosX(), -this.grid_size * 1.2, disasterCoordinates.getPosZ())
            this.scene.add(this.debris);
            this.debris.rotation.x = Math.PI / 2;
            console.log("Debris triggered", this.grid_size * this.max_X * 1.5, this.grid_size * this.max_Y * 1.5)
        }

        console.log("change Debris visibility", visible)
        this.debris.visible = visible;
        if (!visible) {
            this.debris = undefined;
        }
    }
}

/**
 * Important class. 
 * Contains size and position of an object for the app logic. Makes it easier to access those information. 
 */
class GridSpaceTuple {

    /**
     * @param {number} i
     * @param {number} j
     * @param {number} x
     * @param {number} z
     * @param {number} grid_size
     * @param {number} cell_type
     */
    constructor(i, j, x, z, grid_size, cell_type) {
        this.pos_x = (i - x / 2) * grid_size,
            this.pos_y = -0.04,
            this.pos_z = (j - z / 2) * grid_size,
            this.index_x = i,
            this.index_z = j,
            this.grid_size = grid_size,
            this.celltype = cell_type // 0 way / 1 machine? 
    }

    getPosX() {//Coordinates (absolute, in Meter)
        return this.pos_x;
    }
    getPosY() {//Coordinates (absolute, in Meter)
        return this.pos_y;
    }
    getPosZ() {//Coordinates (absolute, in Meter)
        return this.pos_z;
    }
    getIndexX() {//Array Index Place (if you take the Grid as an Array)
        return this.index_x;
    }
    getIndexZ() {//Array Index Place (if you take the Grid as an Array)
        return this.index_z;
    }
    getGridSize() {//size of a grid cell (between two coordinates. All cells are cubic)
        return this.grid_size;
    }
    getCellType() {//Machine cell or Waypoint cell? Important for dijkstra. 
        return this.celltype;
    }
}
export {
    GridSpaceTuple
}
export {
    World
}