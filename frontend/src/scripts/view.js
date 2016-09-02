/**
 * Sift Ocado. Frontend view entry point.
 */
'use strict';

import { createSiftView } from '@redsift/sift-sdk-web';

var SiftOcadoView = createSiftView({
  init: function () {
    console.log('sift-ocado: view: init');
    // We subscribe to 'storageupdate' updates from the Controller
    this.controller.subscribe('storageupdate', this.onStorageUpdate.bind(this));
  },

  /**
   * Sift lifecycle method 'presentView'
   * Called by the framework when the loadView callback in frontend/controller.js calls the resolve function or returns a value
   */
  presentView: function (value) {
    console.log('sift-ocado: view: presentView: ', value);
    var counts = value.data;
/* DEBUG: stub data
    var counts = [
      {key: '201512', value: 100.00},
      {key: '201601', value: 10.00},
      {key: '201602', value: 150.00},
      {key: '201603', value: 20.00},
      {key: '201604', value: 50.00},
      {key: '201605', value: 200.00},
      {key: '201606', value: 1000.00},
      {key: '201607', value: 100.00}
    ];
*/
    // convert counts keys to epoch
    var parseTime = d3.utcParse('%Y%m');
    counts = counts.map(function (e) {
      return {
        l: parseTime(e.key).getTime(),
        v: [e.value]
      };
    });
    var format = d3.format('.2f');
    var stacks = d3_rs_lines.html()
      .width(700) // scale it up
      .tickCountIndex('utcMonth') // want monthly ticks
      .tickDisplayValue(function(d){return '£'+d;}) // Force to £ for now
      .labelTime('%b') // use the smart formatter
      .curve('curveStep')
      .tipHtml((d, i) => '£' + format(d[1][1]))
      .tickFormatValue('($.0f');
    d3.select('#chart')
      .datum(counts)
      .call(stacks);
  },

  /**
   * Sift lifecycle method 'willPresentView'
   * Called when a sift starts to transition between size classes
   */
  willPresentView: function (value) {
    console.log('sift-ocado: view: willPresentView: ', value);
  },

  /**
   * Custom methods defined by the developer
   */
  onStorageUpdate: function (data) {
    console.log('sift-ocado: view: onStorageUpdate: ', data);
    this.presentView({data: data});
  }
});
