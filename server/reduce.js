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
  
  //inData.data.map(function(){ orderCount++; });
  var total = 0;
  for (var d of inData.data) {
    console.log('REDUCE: key: ', d.key);
    var val = JSON.parse(d.value);
    var tot = parseFloat(val.total);
    console.log('REDUCE: total: ', tot);
    total = total + tot;
  }

  var month = query[0];
  console.log('REDUCE: month: ', month);

  // Return the total count of emails from @gmail.com
  return ({name: 'count', key: month, value: total});

  // Possible return values are: undefined, null, promises, single or an array of objects
  // return objects should have the following structure
  // {
  //   name: '<name of node output>',
  //   key: 'key1',
  //   value: '1'
  // };
};
