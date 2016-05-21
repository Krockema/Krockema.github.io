angular.module('app' , [])
.controller('HomeController', function ($attrs, $interval, $scope) {
  $scope.initDensity = parseInt(500);
  $scope.initDistribution = parseInt(10);
  $scope.dividePercent = parseInt(70);
  $scope.flipPercent = parseInt(30);
  $scope.stepcounter = 0;
  $scope.algorithm = {
    voronoi : true,
    delaunay : false,
    pointers : true,
  }
  var stop;
  // Canvas Context
  var canvas = document.getElementById("c"),
      context = canvas.getContext("2d"),
      width = canvas.width = 600,
      height = canvas.height = 600;
  // Voronoi Parameters
  var particles = new Array($scope.initDensity);
  var voronoi = d3_voronoi.voronoi()
      .extent([[-1, -1], [width + 1, height + 1]]);
  var topology;
  var VoronoiGeo;

  $scope.generateMap =  function() {
      // initialize the map - Create a Random Dot Matrix
      particles = new Array($scope.initDensity);
      for (var i = 0; i < parseInt($scope.initDensity); ++i) {
          var cellType = 'healthy';
          if (Math.random() < (parseInt($scope.initDistribution) / 100)) {
            cellType = 'infected';
          }
          particles[i] = {0: Math.random() * width,
                          1: Math.random() * height,
                          vx: 0,
                          vy: 0,
                          cellType: cellType};
          }
      topology = computeTopology(voronoi(particles));
      VoronoiGeo = topojson.mesh(topology, topology.objects.voronoi, function(a, b) { return a !== b; });
      reDrawGraph(topology);
      // start voronoi teslation and Create its TreeStructure

  }

  $scope.startRun = function() {
    // Don't start a new Run if the Old is still active
    if ( angular.isDefined(stop) ) return;

      var dp = parseInt($scope.dividePercent);
      var fc = parseInt($scope.flipPercent);
      stop = $interval(function() {
        // To Do Each Step
        topology = computeTopology(voronoi(particles)); // for recreating the topology if cell realy should move some time
        VoronoiGeo = topojson.mesh(topology, topology.objects.voronoi, function(a, b) { return a !== b; });  // required ? not sure
        // Step Logic
        step(dp, fc);
        // Step Counter
        $scope.stepcounter = $scope.stepcounter + 1;

        if($scope.stepcounter % 100 == 0) {
          reDrawGraph();
          /* Statistics not iplemented yet
          var population = system.getPopulation()
          $scope.ds_line[0].push(population);
          $scope.lbl_line.push($scope.stepcounter / 100);
          $scope.ds_pie = [population, mapsize - population]; */
          }

      }, 0); // ms till next Step.

  }

  $scope.stopRun = function() {
    if (angular.isDefined(stop)) {
      $interval.cancel(stop);
      stop = undefined;
    }
  };

  function step(dividePercentCell, flipPercentCell) {
      let isRunning = true;
      let currentCell = _.random(0, parseInt($scope.initDensity) - 1);

      if(particles[currentCell].cellType == 'infected' || particles[currentCell].cellType == 'moved' || particles[currentCell].cellType == 'divided') {

        // Reset if Cell Moved or Infected previously
        if(!(particles[currentCell].cellType == 'infected')) {
          particles[currentCell].cellType = 'infected';
        }

        // Filter neightbors
        let neighbors = getValidNeighbors(currentCell);
        // Cell RuleSystem.
        if(neighbors.length > 0) {
          var ran = Math.random() * 100;
          var direction = _.random(0, neighbors.length - 1);
          if (ran <= dividePercentCell) {
                particles[neighbors[direction]].cellType = 'divided';
          }
          if(ran <= dividePercentCell + flipPercentCell && ran > dividePercentCell ) {
                particles[currentCell].cellType = 'healthy';
                particles[neighbors[direction]].cellType = 'moved';
          }
        }
        /*
        for (var i = 0; i < neighborOfCurrent.length; i++) {
          //  % chance for each desicion


          if (ran <= dividePercentCell) {
                neighbors[currentCell][i].cellType = 'divided';
                break;
          }
          if(ran <= divicePercentCell + flipPercentCell) {
                var tempCell = neighbors[currentCell][i].cellType;
                currentCell.type = CellType.Free;
                neighbor.type = CellType.Goal;
                break;

          }

        }  */
      }
      return isRunning;
  }


  function getValidNeighbors(currentCell) {
    let neighbor = topojson.neighbors(topology.objects.voronoi.geometries)[currentCell];
    var validNeigbors = [];
    for (var i = 0; i < neighbor.length; i++) {
      if (particles[neighbor[i]].cellType == 'healthy') {
        validNeigbors.push(neighbor[i]);
      }
    }
    return validNeigbors;
  }

  $scope.refreshGraph = function() {
    reDrawGraph();
  }

  function reDrawGraph() {
    context.clearRect(0, 0, width, height);

    // VORONOI
    if ($scope.algorithm.voronoi) {
      // Draw whole Voronoi
      context.beginPath();
      renderMultiLineString(context, VoronoiGeo);
      context.strokeStyle = "rgba(0,0,0,0.4)";
      context.lineWidth = 0.5;
      context.stroke();


      // Colorize Infected Cells.
      context.beginPath();
      renderMultiPolygon(context, topojson.merge(topology, topology.objects.voronoi.geometries.filter(
        function(d) { return (d.data.cellType === 'infected' || d.data.cellType === 'moved' || d.data.cellType === 'divided'); })));
      context.fillStyle = "rgba(255,0,0,0.1)";
      context.fill();
      context.lineWidth = 1.5;
      context.lineJoin = "round";
      context.strokeStyle = "rgba(255,0,0,1)";
      context.stroke();
    }

    // POINTS
    if ($scope.algorithm.pointers) {
      particles.forEach(function(p, i) {
        context.beginPath();
        context.arc(p[0], p[1], 2.5, 0, 2 * Math.PI);
        if (p.cellType == 'healthy') {
          context.fillStyle = "rgba(0,0,0,0)";
        } else if (p.cellType == 'moved') {
          context.fillStyle = "rgba(63, 127, 191, 1)";
        } else if (p.cellType == 'divided') {
          context.fillStyle = "rgba(63, 127, 191, 1)";
        } else {
          context.fillStyle = "rgba(255,0,0,1)";
        }
        context.fill();
      });
    }

    // DELAUNAY
    if ($scope.algorithm.delaunay) {
      context.beginPath();
      var delaunay = d3.geom.delaunay(particles);
      context.setLineDash([5, 15]);
      renderDelaunay(context, delaunay);
      context.strokeStyle = "rgba(0,0,0,1)";
      context.lineWidth = 0.5;
      context.stroke();
      context.setLineDash([1]);
    }

    // calc Area all given Poligons and return its size
    // not sure if correct.
    // calcPolygonArea(topojson.mesh(topology, topology.objects.voronoi));
    // console.log(area);

}


// Drawing Functions.
  function renderMultiLineString(context, line) {
    line.coordinates.forEach(function(line) {
      line.forEach(function(point, i) {
        if (i) context.lineTo(point[0], point[1]);
        else context.moveTo(point[0], point[1]);
      });
    });
  }

  function renderMultiPolygon(context, polygon) {
    polygon.coordinates.forEach(function(polygon) {
      polygon.forEach(function(ring) {
        ring.forEach(function(point, i) {
          if (i) context.lineTo(point[0], point[1]);
          else context.moveTo(point[0], point[1]);
        });
      });
    });
  }

  function renderDelaunay(contect, line) {
    for (var i = 0; i < line.length; i++) {
      context.moveTo(line[i][0][0],line[i][0][1]);
      context.lineTo(line[i][1][0],line[i][1][1]);
      context.lineTo(line[i][2][0],line[i][2][1]);
    }
  }


 });
