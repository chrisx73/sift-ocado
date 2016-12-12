/**
 * Sift Ocado. DAG's 'Map' node implementation
 */

'use strict';
const pfvArray = require('./powerhouse-fv.json');
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

function extractTotal(msg){
  if(!msg){
    return null;
  }
  let tot = OrderRegExp.TOTAL.exec(msg.preview);
  if (!tot) {
    const msgBody = msg.strippedHtmlBody;
    // Try once again using the message body in case info not in preview
    tot = OrderRegExp.TOTAL.exec(msgBody);
  }
  //console.log('MAP: tot: ', tot);

  // if found total and managed to extract value from it
  if (tot && tot.length === 3) {
    const total = tot[2];
    console.log('MAP: total to add: ', total);

    const date = new Date(msg.date);
    return {
      name: 'messages',
      key: [yyyymm(date), date.getFullYear().toString(), msg.id].join('/'),
      value: {
        total: total,
        msgId: msg.id,
        threadId: msg.threadId,
        date: date
      }
    };
  }
  return null;
}

function checkItems(msg){
  if(!msg){
    return null;
  }
  const msgBody = msg.strippedHtmlBody;
  const found = pfvArray.map(d =>{
    const r = new RegExp(d.name, 'gi');
    return r.test(msgBody) ? 1 : 0;
  });

  console.log('checkItems found:', found);
  return {
    name: 'foodItems',
    key: msg.id,
    value: {
      items: found,
      msgId: msg.id,
      threadId: msg.threadId
    }
  }
}

// Entry point for DAG node
module.exports = function(got) {
  // inData contains the key/value pairs that match the given query
  const inData = got.in;

  console.log('sift-ocado: map.js: running...');

  let ret = [];
  inData.data.filter(d => d.value)
  .forEach(d =>{
    console.log('MAP: key: ', d.key);
    let msg = null;
    try {
      msg = JSON.parse(d.value);
      console.log('MAP: msg.ID: ', msg.id);
     }
    catch (ex) {
      console.error('MAP: Error parsing value for: ', d.key);
      console.error('MAP: Exception: ', ex);
    }

    const a = extractTotal(msg);
    if(a){
      ret.push(a);
    }

    const b = checkItems(msg);
    if(b){
      ret.push(b);
    }
  })

  console.log('MAP: ret: ', ret);
  return ret;
};

