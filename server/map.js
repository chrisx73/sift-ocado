/**
 * Sift Ocado. DAG's 'Map' node implementation
 */

'use strict';

// You can require dependencies following the node paradigm
// e.g. var moment = require('moment');

// Entry point for DAG node
module.exports = function(got) {
  // inData contains the key/value pairs that match the given query
  const inData = got['in'];
  // The query matched (array of elements based on the store's key and your selection criteria)
  const query = got['query'];
  // Joined information from your 'with' statement
  const withData = got['with'];

  console.log('sift-ocado: map.js: running...');
  
  var result = inData.data.map(function(datum){
    var jmapInfo = JSON.parse(datum.value);
    console.log('sift-ocado: map.js: inData: key', datum.key);
    console.log('sift-ocado: map.js: inData: value', jmapInfo);

    // Emit an empty object for each message so count can be calculated in the next node
    return {
      name: 'messages',
      key: datum.key,
      value: {}
    };
  });

  return result;
  // Possible return values are: undefined, null, promises, single or an array of objects
  // return objects should have the following structure
  // {
  //   name: '<name of node output>',
  //   key: 'key1',
  //   value: '1'
  // };
};
