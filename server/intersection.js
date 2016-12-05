/**
 * Sift Ocado. DAG's 'Reduce' node implementation
 */
'use strict';

// Entry point for DAG node
const pfvArray = require('./powerhouse-fv.json');
module.exports = function(got) {
  // inData contains the key/value pairs that match the given query
  const inData = got.in;
  console.log('sift-ocado: intersection.js: running...', inData);
  const parsed = inData.data
    .map(d => JSON.parse(d.value))

  const allSet = parsed
    .map(d => d.items || [])
    .reduce((a, b) => {
      return b.map((d, i) => parseInt(d) + (a[i] || 0));
    }, [])

  const families = splitFandS(allSet);
  let result = [
    {
      name: 'suggestions',
      key: 'families',
      value: filterOnFound(families)
    }
  ]

  // now add the thread suggestions
  parsed.map(d =>{
    const items = d.items || [];
    const fthread = splitFandS(items);
    result.push({
      name: 'idList',
      key: d.msgId,
      value: {
        detail: filterOnFound(fthread)
      }
    })
  })
  console.log('found and suggestions:', families);
  return result;
};

function splitFandS(set){
  let families = {};
  pfvArray.forEach((d, i) =>{
    if(!families.hasOwnProperty(d.family)){
      families[d.family] = {
        suggestions: [],
        found: []
      };
    }
    if(set[i] > 0){
      families[d.family].found.push(d)
    }else{
      families[d.family].suggestions.push(d);
    }
  })
  return families;
}

function filterOnFound(f){
  let fCopy = JSON.parse(JSON.stringify(f));
  Object.keys(fCopy)
    .filter(k => fCopy[k].found.length > 0)
    .forEach(k => {
      const max = fCopy[k].found.reduce((a, b) => Math.max(a, b.score), 0);
      fCopy[k].suggestions = fCopy[k].suggestions.filter(d => d.score > max);
    })
  return fCopy;
}
