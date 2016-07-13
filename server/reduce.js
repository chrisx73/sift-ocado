/**
 * Sift Ocado. DAG's 'Reduce' node implementation
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

  console.log('sift-ocado: reduce.js: running...');
  
  var total = 0;
  inData.data.map(function(){ total++; });

  // Return the total count of emails from @gmail.com
  return ({name: 'count', key: 'TOTAL', value: total});

  // Possible return values are: undefined, null, promises, single or an array of objects
  // return objects should have the following structure
  // {
  //   name: '<name of node output>',
  //   key: 'key1',
  //   value: '1'
  // };
};
