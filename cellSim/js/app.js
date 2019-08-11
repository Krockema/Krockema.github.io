
var app = angular.module('app', ['ngRoute', 'chart.js']).config(['ChartJsProvider', function (ChartJsProvider) {
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
  }])

// var app = angular.module('app', ['ngRoute']);
app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
       .when('/', {
        templateUrl: 'templates/start.html',
        controller: 'startController'
      })
      .when('/graph', {
        templateUrl: 'templates/graph.html',
        controller: 'graphController'
      })
      .when('/ca', {
       templateUrl: 'templates/ca.html',
       controller: 'caController',
     });
});
