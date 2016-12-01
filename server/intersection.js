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
  const set = inData.data
  .map(d => JSON.parse(d.value).items || [])
  .reduce((a, b) => {
    return b.map((d, i) => parseInt(d) + (a[i] || 0));
  }, [])

  let families = {}
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

  Object.keys(families)
    .filter(k => families[k].found.length > 0)
    .forEach(k => {
      const max = families[k].found.reduce((a, b) => Math.max(a, b.score), 0);
      families[k].suggestions = families[k].suggestions.filter(d => d.score > max);
      console.log(families[k].suggestions);
    })

  console.log('found and suggestions:', families);
  return {
    key: 'families',
    value: families
  }
};
