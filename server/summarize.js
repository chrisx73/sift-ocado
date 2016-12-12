/**
 * Sift Ocado. DAG's 'Reduce' node implementation
 */
'use strict';

// Entry point for DAG node
module.exports = function(got) {
  // inData contains the key/value pairs that match the given query
  const inData = got['in'];
  // The query matched (array of elements based on the store's key and your selection criteria)
  const query = got['query'];

  console.log('sift-ocado: reduce.js: running...');

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

  return ({name: 'count', key: month, value: total});
};
