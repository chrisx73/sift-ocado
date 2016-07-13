/**
 * Sift Ocado. View callbacks.
 */

'use strict';

/* globals document, Sift */
var ldButton;
var ncButton;
var ncCount = 0;

/**
 * Called by the framework when the loadView callback in frontend/controller.js calls the resolve function or returns a value
 *
 * Parameters:
 * @value: {
 *  sizeClass: {
 *      previous: {width: 'compact'|'full', height: 'compact'|'full'},
 *      current: {width: 'compact'|'full', height: 'compact'|'full'}
 *    },
 *    type: 'email-thread'|'email-compose'|'summary',
 *    data: {object} (data object returned by the load or resolve methods in the controller)
 *  }
 */
Sift.View.presentView = function (value) {
  console.log('sift-ocado: presentView: ', value);

   'use strict';

   let counts = value.data;

   // convert counts keys to epoch  
   let parseTime = d3.utcParse('%Y%m');
   counts = counts.map(e => ({
     l: parseTime(e.key).getTime(),
     v: [e.value]
   }));

   console.log(d3.select);

   let format = d3.format('.2f');

   let stacks = d3_rs_lines.html()
     .width(700) // scale it up
     .tickCountIndex('utcMonth') // want monthly ticks
     .labelTime('multi') // use the smart formatter
     .curve('curveStep')
     .tipHtml((d, i) => '£' + format(d[1][1]))
     .tickFormatValue('($.0f');

   d3.select('#chart')
     .datum(counts)
     .call(stacks);

};

/**
 * Called when a sift starts to transition between size classes
 *
 * Parameters:
 * @value: {
 *  sizeClass: {
 *    previous: {width: 'compact'|'full', height: 'compact'|'full'},
 *    current: {width: 'compact'|'full', height: 'compact'|'full'}
 *  },
 *  type: 'email-thread'|'email-compose'|'summary'
 * }
 */
Sift.View.willPresentView = function (value) {
  console.log('sift-ocado: willPresentView: ', value);

  /*
  * Example code below can be removed
  */
  // Depict how often this event is fired while transitions take place
  showTransitions('width', value.sizeClass);
  showTransitions('height', value.sizeClass);

  var m = document.getElementById('message');
  if(!m){
    console.info('Missing dom element for example:', m);
    return;
  }
  m.textContent = 'will present view';
  m.style.color = '#ED1651';
};

/**
 * Listens for 'count' events from the Controller
 */
Sift.Controller.addEventListener('count', function (value) {
  console.log('sift-ocado: oncount', value);
    document.getElementById('data').textContent = 'New data: ' + value + ' emails from \'gmail.com\' in your inbox';
});

function updateDOM(elem, value){
  var e = document.getElementById(elem);
  if(!e){
    console.info('Missing dom element for example:', elem);
    return;
  }
  if(parent){
    e.textContent = value;
    e.style.color = '#231F20';
  }
}

function showTransitions(aspect, parent){
  if(!parent || !parent.current || !parent.previous){
    console.error('No data for this transition');
    return;
  }
  var current = parent.current[aspect];
  var previous = parent.previous[aspect];
  var e = document.getElementById(aspect);
  if(!e){
    console.info('Missing dom element for example:', aspect);
    return;
  }

  if(current !== previous){
    e.textContent = previous + ' > ' + current;
    e.style.color = '#ED1651';
  }
}
