/**
 * Sift Ocado. DAG's 'Map' node implementation
 */

'use strict';

const OrderRegExp = {
  TOTAL: /(Total \(estimated\))\D*(\d+\.\d+)/
};

// Converts a Date into YYYY<s>MM format
function yyyymm(d, separator) {
  if (!separator) {
    separator = '';
  }
  var yyyy = d.getFullYear().toString();
  var mm = (d.getMonth() + 1).toString();
  return yyyy + separator + (mm[1] ? mm : '0' + mm[0]);
}

// Entry point for DAG node
module.exports = function(got) {
  // inData contains the key/value pairs that match the given query
  const inData = got['in'];

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

  console.log('MAP: ret: ', ret);
  return ret;
};