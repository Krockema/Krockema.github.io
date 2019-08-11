function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}
function computeTopology(diagram) {
  var cells = diagram.cells,
      x0 = diagram.extent[0][0],
      y0 = diagram.extent[0][1],
      x1 = diagram.extent[1][0],
      y1 = diagram.extent[1][1],
      arcs = [],
      arcIndex = -1,
      arcIndexByEdge = {};

  return {
    objects: {
      voronoi: {
        type: "GeometryCollection",
        geometries: cells.map(function(cell) {
          var cell,
              site = cell.site,
              halfedges = cell.halfedges,
              cellArcs = [],
              clipArc;

          // If this cell has edges…
          if (halfedges.length) {
            halfedges.forEach(function(halfedge) {
              var edge = diagram.cellEdges[halfedge];
              if (edge.right) {
                var l = edge.left.index,
                    r = edge.right.index,
                    k = l + "," + r,
                    i = arcIndexByEdge[k];
                if (i == null) arcs[i = arcIndexByEdge[k] = ++arcIndex] = edge;
                cellArcs.push(site === edge.left ? i : ~i);
                clipArc = null;
              } else if (clipArc) { // Coalesce border edges.
                if (edge.left) edge = edge.slice(); // Copy-on-write.
                clipArc.push(edge[1]);
              } else {
                arcs[++arcIndex] = clipArc = edge;
                cellArcs.push(arcIndex);
              }
            });

            // Ensure the last point in the polygon is identical to the first point.
            var firstArcIndex = cellArcs[0],
                lastArcIndex = cellArcs[cellArcs.length - 1],
                firstArc = arcs[firstArcIndex < 0 ? ~firstArcIndex : firstArcIndex],
                lastArc = arcs[lastArcIndex < 0 ? ~lastArcIndex : lastArcIndex];
            lastArc[lastArcIndex < 0 ? 0 : lastArc.length - 1] = firstArc[firstArcIndex < 0 ? firstArc.length - 1 : 0].slice();
          }

          // Otherwise, assume that the polygon subsumes the extent.
          else if (site[0] >= x0 && site[0] <= x1 && site[1] >= y0 && site[1] <= y1) {
            arcs[++arcIndex] = [[x0, y1], [x1, y1], [x1, y0], [x0, y0], [x0, y1]];
            cellArcs.push(arcIndex);
          }

          return {
            type: "Polygon",
            data: site.data,
            arcs: [cellArcs]
          };
        })
      }
    },
    arcs: arcs
  };
}

function calcPolygonArea2(v) {
    var total = 0;
    for (var k = 0; k < v.coordinates.length; k++) {
      var cellTotal = 0;
      var vertices = v.coordinates[k];
      for (var i = 0, l = vertices.length; i < l; i++) {
        var addX = vertices[i][0];
        var addY = vertices[i == vertices.length - 1 ? 0 : i + 1][1];
        var subX = vertices[i == vertices.length - 1 ? 0 : i + 1][0];
        var subY = vertices[i][1];

        cellTotal += (addX * addY * 0.5);
        cellTotal -= (subX * subY * 0.5);
      }
      console.log('cell total: ' + Math.abs(cellTotal));
      total = total + Math.abs(cellTotal);
    }
    console.log('Total: ' + Math.abs(total));

    // return ;
}

function calcPolygonArea(v) {
  var total = 0;
  for (var k = 0; k < v.coordinates.length; k++) {
    var cellTotal = 0;
    var vertices = v.coordinates[k];
    cellTotal = polygonArea(vertices)
    console.log('cell total: ' + Math.abs(cellTotal));
    total = total + Math.abs(cellTotal);
  }
  console.log('Total: ' + Math.abs(total));

}
function polygonArea(polygons)
{
  var j = 0;
  var area = 0;
  // console.log('Polygons is...', polygons);

  for (var i = 0; i < polygons.length; i++) {
     j = (i + 1) % polygons.length;

     area += polygons[i][0] * polygons[j][1];
     area -= polygons[i][1] * polygons[j][0];
    // console.log('Area is...', area, polygons[i][0] * polygons[j][1] - polygons[i][1] * polygons[j][0]);
  }

  area /= 2;
  return (area < 0 ? -area : area);
}
