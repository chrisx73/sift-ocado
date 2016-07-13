/**
 * Sift Ocado. DAG's 'Map' node implementation
 */

'use strict';

const OrderRegExp = {
  TOTAL: /(Total \(estimated\))\D*(\d+\.\d+)/
};

// Converts a Date into YYYY<s>MM<s>DD format
function yyyymmdd(d, separator) {
  if (!separator) {
    separator = '';
  }
  var yyyy = d.getFullYear().toString();
  var mm = (d.getMonth() + 1).toString();
  var dd = d.getDate().toString();
  return yyyy + separator + (mm[1] ? mm : '0' + mm[0]) + separator + (dd[1] ? dd : '0' + dd[0]);
}

// Converts a Date into YYYY<s>MM format
function yyyymm(d, separator) {
  if (!separator) {
    separator = '';
  }
  var yyyy = d.getFullYear().toString();
  var mm = (d.getMonth() + 1).toString();
  return yyyy + separator + (mm[1] ? mm : '0' + mm[0]);
}

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

  var ret = [];
  for (var d of inData.data) {
    console.log('MAP: key: ', d.key);
    if (d.value) {
      try {
        var msg = JSON.parse(d.value);
        console.log('MAP: msg.ID: ', msg.id);

        var tot = OrderRegExp.TOTAL.exec(msg.preview);
        if (!tot) {
          const msgBody = msg.strippedHtmlBody;

          // Try once again using the message body in case info not in preview
          tot = OrderRegExp.TOTAL.exec(msgBody);
        }
        //console.log('MAP: tot: ', tot);
       
        // if found total and managed to extract value from it
        if (tot && tot.length === 3) {
          var total = tot[2];

          console.log('MAP: total to add: ', total);

          var date = new Date(msg.date);
          ret.push({
            name: 'messages',
            //key: yyyymmdd(date, '-') + '/' + msg.id,
            key: yyyymm(date) + '/' + date.getFullYear().toString() + '/' + msg.id,
            value: {
              total: total,
              msgId: msg.id,
              threadId: msg.threadId,
              date: date
            },
            epoch: d.epoch
          });
        }
      }
      catch (ex) {
        console.error('MAP: Error parsing value for: ', d.key);
        console.error('MAP: Exception: ', ex);
        continue;
      }
    }
  }

/*
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
  */


  console.log('MAP: ret: ', ret);
  return ret;
  // Possible return values are: undefined, null, promises, single or an array of objects
  // return objects should have the following structure
  // {
  //   name: '<name of node output>',
  //   key: 'key1',
  //   value: '1'
  // };
};
