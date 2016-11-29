/**
 * Sift Ocado. Frontend view entry point.
 */
'use strict';

import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';
import '@redsift/ui-rs-hero';
import { html as d3_rs_lines } from '@redsift/d3-rs-lines';
import { format} from 'd3-format';
import { utcParse} from 'd3-time-format';

export default class CreateView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();
    console.log('sift-ocado: view: init');
  }

  /**
   * Sift lifecycle method 'presentView'
   * Called by the framework when the loadView callback in frontend/controller.js calls the resolve function or returns a value
   */
  presentView (value) {
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
    let parseTime = utcParse('%Y%m');
    counts = counts.map(function (e) {
      return {
        l: parseTime(e.key).getTime(),
        v: [e.value]
      };
    });
    let _2f = format('.2f');
    let stacks = d3_rs_lines()
      .width(700) // scale it up
      .tickCountIndex('utcMonth') // want monthly ticks
      .tickDisplayValue(d => '£' + d) // Force to £ for now
      .labelTime('%b') // use the smart formatter
      .curve('curveStep')
      .tipHtml(d => '£' + _2f(d[1][1]))
      .tickFormatValue('($.0f');
    // d3.select('#chart')
    //   .datum(counts)
    //   .call(stacks);
  }

  /**
   * Sift lifecycle method 'willPresentView'
   * Called when a sift starts to transition between size classes
   */
  willPresentView (value) {
    console.log('sift-ocado: view: willPresentView: ', value);
  }

  /**
   * Custom methods defined by the developer
   */
  onStorageUpdate (data) {
    console.log('sift-ocado: view: onStorageUpdate: ', data);
    this.presentView({data: data});
  }
}

registerSiftView(new CreateView(window));
