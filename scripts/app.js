// Initiate angular
angular.module('CellSystem', ['ui.bootstrap']);
angular.module('CellSystem', ['chart.js']);
angular.module('CellSystem').config(['ChartJsProvider', function (ChartJsProvider) {
    // Configure all charts
    ChartJsProvider.setOptions({
//      colours: ['#FF5252', '#FF8A80'],
//      responsive: false
//        scaleShowLabels: false
      //scaleOverride: true,
      // Number - The number of steps in a hard coded scale
      //scaleSteps: 10,
    });
    // Configure all line charts
    ChartJsProvider.setOptions('Line', {

    });
  }]).controller('MapController', function ($attrs, $interval, $scope) {
    var map = this;
    map.name = "CellSystem";
    map.map = new Map($attrs.rows, $attrs.cols);
    // map.map.notifyOnChange(cell => console.log(cell.position.toString(), cell));
    // Map Preperation
    map.cellSize = 15;
    map.widthPx = map.map.cols * map.cellSize;
    map.heightPx = map.map.rows * map.cellSize;
    var stop;  // intervallbinding to stop
    var flipcounter;
    var dividecounter;
    var mapsize = $attrs.rows * $attrs.cols;
    var initialBlock = mapsize * 0.1;

    $scope.lbl_pie = ["Dead", "Alive"];
    $scope.ds_pie = [100, mapsize - 100];

    // chart Preperation
    $scope.initPercent = parseInt(10);
    $scope.dividePercent = parseInt(70);
    $scope.flipPercent = parseInt(30);
    $scope.stepcounter = 0;
    //$scope.onClick = function (points, evt) { console.log(points, evt); };
    //$scope.labels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    $scope.lbl_line = [0];
    // i know ... scarry....
    $scope.series = ['&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Population' ];
    $scope.ds_line = [[100]];


    $scope.runStepByStep = function() {
      // Don't start a new Run if the Old is still active
      if ( angular.isDefined(stop) ) return;

      let system = new CellSystem(map.map);
      var dp = parseInt($scope.dividePercent);
      var fc = parseInt($scope.flipPercent);
      stop = $interval(function() {
        // To Do Each Step
        system.step(dp, fc);
        $scope.stepcounter = $scope.stepcounter + 1;

        if($scope.stepcounter % 100 == 0) {
          var population = system.getPopulation()
          $scope.ds_line[0].push(population);
          $scope.lbl_line.push($scope.stepcounter / 100);
          $scope.ds_pie = [population, mapsize - population];
          }
      }, 10); // ms till next Step.
    };



    $scope.stopRun = function() {
      if (angular.isDefined(stop)) {
        $interval.cancel(stop);
        stop = undefined;
      }
    };

    $scope.resetMap = function() {
            map.map.reset();
    }

    map.addRandomObstacles = () => {
        map.map.reset();
        var value = parseInt($scope.initPercent)/100;
        map.map.addRandomObstacles((map.map.cols * map.map.rows) * value);
    };

    map.clickOnCell = (cell) => {
        switch (cell.type) {
        case CellType.Blocked:
            cell.type = CellType.Free;
            break;
        case CellType.Free:
            cell.type = CellType.Blocked;
            break;
        default:
        }
        this.map.updateCell(cell);
    };

    map.mouseOverCell = (cell, event) => {
        if (event.buttons == 1) {
            this.clickOnCell(cell)
        }
    };
});
