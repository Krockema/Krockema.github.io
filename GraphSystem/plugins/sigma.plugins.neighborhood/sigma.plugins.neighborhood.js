/**
 * This plugin provides a method to retrieve the neighborhood of a node.
 * Basically, it loads a graph and stores it in a headless sigma.classes.graph
 * instance, that you can query to retrieve neighborhoods.
 *
 * It is useful for people who want to provide a neighborhoods navigation
 * inside a big graph instead of just displaying it, and without having to
 * deploy an API or the list of every neighborhoods.
 *
 * This plugin also adds to the graph model a method called "neighborhood".
 * Check the code for more information.
 *
 * Here is how to use it:
 *
 *  > var db = new sigma.plugins.neighborhoods();
 *  > db.load('path/to/my/graph.json', function() {
 *  >   var nodeId = 'anyNodeID';
 *  >   mySigmaInstance
 *  >     .read(db.neighborhood(nodeId))
 *  >     .refresh();
 *  > });
 */
(function() {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  /**
   * This method takes the ID of node as argument and returns the graph of the
   * specified node, with every other nodes that are connected to it and every
   * edges that connect two of the previously cited nodes. It uses the built-in
   * indexes from sigma's graph model to search in the graph.
   *
   * @param  {string} centerId The ID of the center node.
   * @return {object}          The graph, as a simple descriptive object, in
   *                           the format required by the "read" graph method.
   */
  sigma.classes.graph.addMethod('neighbors', function(nodeId) {
    var k,
        neighbors = {},
        index = this.allNeighborsIndex[nodeId] || {};

    for (k in index)
      neighbors[k] = this.nodesIndex[k];

    return neighbors;
  });

}).call(window);
