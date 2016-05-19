angular.module('app')
    .factory('sigma', ['$rootScope', function($rootScope) {
    var sigmaExport = {};
    var sigmaInstance;
    var defaults = {
        drawEdges: false,
        drawLabels: true,
        defaultNodeColor: '#339933',
        defaultEdgeColor: '#0033FF',
        defaultLabelColor: '#eee',
        hoverFontStyle: 'bold',
        edgeColor: 'source',
        hideEdgesOnMove: true,
        labelSize: 'proportional',
        labelSizeRatio: 1.5,
       /* labelThreshold: resolutionMode ? 10 : 5,
        minEdgeSize: resolutionMode ? 1 : 0.1,
        maxEdgeSize: resolutionMode ? 4 : 5,
        minNodeSize: resolutionMode ? 15 : 5,
        maxNodeSize: resolutionMode ? 60 : 15 */
        };
    var force = {
            linLogMode: false,
            outboundAttractionDistribution: false,
            adjustSizes: true,
            edgeWeightInfluence: 0,
            scalingRatio: 3,
            strongGravityMode: true,
            gravity: 0.1,
            jitterTolerance: 1.9,
            barnesHutOptimize: false,
            barnesHutTheta: 0,
            speed: 10,
            outboundAttCompensation: 5.8,
            totalSwinging: 0,
            totalEffectiveTraction: 1,
            complexIntervals: 500,
            simpleIntervals: 1000
        };
     /*
            @data: determine what kind of node should be active
            @description: active company and category concerned data
        */
     var activeNodes = function(data) {};
	 
     var initalizeSigmaInstance = function() {
		 sigmaInstance = new sigma('graph-container');
            /* sigmaInstance = new sigma({
                container: 'graph-container',
				graph: g,
                 renderer: {
                    container: document.getElementById('graph-container'),
                    type: 'canvas'
                },
                settings: defaults
            });*/
            sigmaExport.s = sigmaInstance;
        };
		
     var defineConnectFunction = function() {
            sigma.classes.graph.addMethod('connects', function(nodeId) {
                var k,
                connects = {},
                index = this.outNeighborsIndex[nodeId] || {};

                for (k in index) {
                    connects[k] = this.nodesIndex[k];
                };
                return connects;
            });

        };
		
	var drawGraph = function() {
		
		sigmaExport.s.refresh();
	}
		
	var graphData = function() {
				sigma.classes.graph.read({
			  nodes: [
				{ id: 'n0' },
				{ id: 'n1' }
			  ],
			  edges: [
				{
				  id: 'e0',
				  source: 'n0',
				  target: 'n1'
				}
			  ]
			});
	}
		
     // sigma methond would be used in controllers and directives, only provide methods that necessary
        sigmaExport.s = sigmaInstance;
        sigmaExport.force = force;
        sigmaExport.defaults =defaults;
        sigmaExport.activeNodes = activeNodes;
		sigmaExport.graphData = graphData;
		//sigmaExport.addNode = addNode;
        sigmaExport.draw = drawGraph;
        //sigmaExport.redraw = redrawGraph;
        //sigmaExport.placeAround = placeAround;
        //sigmaExport.recoverGraph = recoverGraph;
		//sigmaExport.resolutionMode = resolutionMode;

        return sigmaExport;
    }]);