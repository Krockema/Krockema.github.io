class CellSystem {
    constructor(map) {
        this.map = map;
        this.cells = [];
        this.initialize();
    }

    initialize() {
        let cells = this.map.cells.filter(cell => !cell.isBlocked);
        for (let cell of cells) {
            this.cells.push(cell);
        }
    }

    step(dividePercentCell, flipPercentCell) {
        let isRunning = true;
        let currentCell = this.map.getRandomCell();

        _.pull(this.cells, currentCell);

        let neighbors = this.getNeighbors(currentCell);

        if((currentCell.isBlocked || currentCell.isVisited || currentCell.isGoal) && neighbors.length > 0 ) {

          // Reset if Cell Moved previously
          if(currentCell.isGoal) {
            currentCell.type = CellType.Visited;
          }

          // Cell RuleSystem.
          var ran = _.random(0,100);
          var direction = _.random(0, neighbors.length - 1);
          if (ran <= dividePercentCell) {
                neighbors[direction].type = CellType.Visited;
          }
          if(ran <= dividePercentCell + flipPercentCell && ran > dividePercentCell ) {
                currentCell.type = CellType.Free;
                neighbors[direction].type = CellType.Goal;
          }

        }
        return isRunning;
    }

    getNeighbors(cell) {

        let neighbors = [];
        let map = this.map;

        let useIfFree = (x, y) => {
            let cell = map.getCell(x, y);
            if (cell !== undefined && cell.isFree) {
                neighbors.push(cell);
            }
        }

        useIfFree(cell.position.x + 1, cell.position.y + 0);
        useIfFree(cell.position.x + 0, cell.position.y + 1);
        useIfFree(cell.position.x + 0, cell.position.y - 1);
        useIfFree(cell.position.x - 1, cell.position.y + 0);


        useIfFree(cell.position.x + 1, cell.position.y + 1);
        useIfFree(cell.position.x - 1, cell.position.y + 1);
        useIfFree(cell.position.x + 1, cell.position.y - 1);
        useIfFree(cell.position.x - 1, cell.position.y - 1);

        return neighbors;
    }

    getPopulation() {
      return this.map.cells.filter(cell => !cell.isFree).length;
    }

    /**
     * Convert a number to a color using hsl, with range definition.
     * Example: if min/max are 0/1, and i is 0.75, the color is closer to green.
     * Example: if min/max are 0.5/1, and i is 0.75, the color is in the middle between red and green.
     * @param i (floating point, range 0 to 1)
     * param min (floating point, range 0 to 1, all i at and below this is red)
     * param max (floating point, range 0 to 1, all i at and above this is green)
     */
    numberToColorHsl(i, min, max) {
            var ratio = i;
            if (min > 0 || max < 1) {
                if (i < min) {
                    ratio = 0;
                } else if (i > max) {
                    ratio = 1;
                } else {
                    var range = max - min;
                    ratio = (i - min) / range;
                }
            }

            // as the function expects a value between 0 and 1, and red = 0� and green = 120�
            // we convert the input to the appropriate hue value
            var hue = ratio * 1.2 / 3.60;
            //if (minMaxFactor!=1) hue /= minMaxFactor;
            //console.log(hue);

            // we convert hsl to rgb (saturation 100%, lightness 50%)
            var rgb = this.hslToRgb(hue, 1, .5);
            // we format to css value and return
            return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
        }
        /**
         * http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
         *
         * Converts an HSL color value to RGB. Conversion formula
         * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
         * Assumes h, s, and l are contained in the set [0, 1] and
         * returns r, g, and b in the set [0, 255].
         *
         * @param   Number  h       The hue
         * @param   Number  s       The saturation
         * @param   Number  l       The lightness
         * @return  Array           The RGB representation
         */
    hslToRgb(h, s, l) {
        var r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
    }
}
