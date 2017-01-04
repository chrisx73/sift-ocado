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

  let orders = {};
  inData.data.forEach(d => {
    console.log('REDUCE: key: ', d.key);
    let val = JSON.parse(d.value);
    let order = val.orderRef;
    let temp = {
      date: new Date(val.date),
      total: parseFloat(val.total)
    }
    if(orders.hasOwnProperty(order)){
      if(orders[order].date < temp.date ){
        orders[order] = temp;
      }
    }else{
      orders[order] = temp;
    }
  })
  console.log('REDUCE: list of orders', orders);
  let total = Object.keys(orders).reduce((a, b) => a + orders[b].total, 0);
  let month = query[0];
  console.log('REDUCE: month: ', month);

  return ({name: 'count', key: month, value: total});
};
