class surface {
    constructor(sizeX,sizeY) {
        this.x = sizeX;
        this.y = sizeY;
        this.cells = [];
        this.edges = [];
    }

    addEdgeIfNotExist(frm, to) {
        var p1 = -1,p2 = -1;
        for (var i = 0; i < this.cells.length; i++) {
          if (this.cells[i].x == frm.x && this.cells[i].y == frm.y) {
            p1 = i;
          }
          if (this.cells[i].x == to.x && this.cells[i].y == to.y) {
            p2 = i;
          }
          if (p1 >= 0 && p2 >= 0) {
            break;
          }
        }
        this.edges.push(new edge(p1,p2));
    }

    logEdges() {
      var l = '';
      var counter = 0;
      for (var i = 0; i < this.edges.length; i++) {
        l = l + counter + ': ' +  this.edges[i].frm + '-' + this.edges[i].to + '\r\n';
        counter++;
      }
      console.log(l);
    }


}
