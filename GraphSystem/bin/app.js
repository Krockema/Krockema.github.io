angular.module('app' , [])
.controller('HomeController', function ($attrs, $interval, $scope) {

      $scope.algorithm = {
        voronoi : true,
        delaunay : false
      }
      var canv = null;
      var colors = [];
      var map = new surface(600, 600);
      var stop;
      $scope.initDensity = parseInt(500);
      $scope.dividePercent = parseInt(70);
      $scope.flipPercent = parseInt(30);
      $scope.stepcounter = 0;


      $scope.generateMap =  function() {
          // initial node to make nodes smaller (nodesize is relativ)

          canv = document.getElementById("c");
  				c = canv.getContext("2d");
  				w = canv.width = 600;
  				h = canv.height = 600;
          points = [];
          map.cells = [];
          map.edges = [];
          v = new Voronoi();

  				for(i=0; i<parseInt($scope.initDensity); i++)
  				{
            p = new Point(roundToTwo(Math.random()*w), roundToTwo(Math.random()*h));
  					points.push(p);
            map.cells.push(new cell(p.x, p.y, 'free'));
  					// colors.push('#BDBDBD');
  				}
  				redraw();
      }

      $scope.reDrawGraph =  function() {
        redraw();
      }

      $scope.generateGraph = function() {
        var end = edges.length;
        for(i=0; i<end; i++)
        {
          var p1 = new Point(roundToTwo(edges[i].left.x), roundToTwo(edges[i].left.y));
          var p2 = new Point(roundToTwo(edges[i].right.x), roundToTwo(edges[i].right.y));
          map.addEdgeIfNotExist(p1,p2);
        }
        map.logEdges();
      }




      function redraw()
			{
				c.fillStyle = "#ffffff";
				c.fillRect (0, 0, w, h);

				v.Compute(points, w, h);
				edges = v.GetEdges();
				cells = v.GetCells();

        // colorizing
        /*
        for(var i=0; i<cells.length; i++)
				{
					var p = cells[i].vertices;
					if(p.length == 0) continue;
					if(p.length == 4)
					{
						console.log(cells[i].vs);
						console.log(p);
					}
					c.fillStyle = colors[i];
					c.beginPath();
					c.moveTo(p[0].x, p[0].y);
					for(var j=1; j<p.length; j++) c.lineTo(p[j].x, p[j].y);
					c.closePath();
					c.fill();
				}
        */
				if($scope.algorithm.delaunay)
				{
					c.lineWidth = 1;
					c.strokeStyle = "#888888";
					for(i=0; i<edges.length; i++)
					{
						var e = edges[i];
						c.beginPath();
						c.moveTo(e.left.x, e.left.y);
						c.lineTo(e.right.x, e.right.y);
						c.closePath();
						c.stroke();
					}
				}

				if($scope.algorithm.voronoi)
				{
					c.lineWidth = 2;
					c.strokeStyle = "#000";
					for(i=0; i<edges.length; i++)
					{
						var e = edges[i];
						c.beginPath();
						c.moveTo(e.start.x, e.start.y);
						c.lineTo(e.end.x, e.end.y);
						c.closePath();
						c.stroke();
					}
				}

				c.fillStyle = "rgb(255,0,0)";
				for(i=0; i<points.length; i++)
				{
					var p = points[i];
					c.beginPath();
					c.arc(p.x, p.y, 3, 0, Math.PI*2, true);
					c.closePath();
					c.fill();
				}
			}
      // Transform the Triangulation into Network based Graph.
 });
