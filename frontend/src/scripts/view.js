/**
 * Sift Ocado. Frontend view entry point.
 */
'use strict';

import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';
import { html as bars } from '@redsift/d3-rs-bars';
import { select } from 'd3-selection';
import { utcParse } from 'd3-time-format';
import '@redsift/ui-rs-hero';
import {cardCreator} from './lib/card-creator';
import ingredients from './ingredients.json';

var PFV_LINK = 'https://www.cdc.gov/pcd/issues/2014/13_0390.htm';
var GOOGLE_SEARCH_TEMPLATE = 'https://www.google.co.uk/search?q=';

export default class CreateView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();
    console.log('sift-ocado: view: init');

    // We subscribe to 'storageupdate' updates from the Controller
    this.controller.subscribe('countupdated', this.countUpdated.bind(this));
    this.controller.subscribe('suggestionsupdated', this.suggestionsUpdated.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  /**
   * Sift lifecycle method 'presentView'
   * Called by the framework when the loadView callback in frontend/controller.js calls the resolve function or returns a value
   */
  presentView (value) {
    console.log('sift-ocado: view: presentView: ', value);
    this.renderTotalSection(value.data.count);
    this.renderCardsSection(value.data.suggestions);
  }


  renderTotalSection(data){
    const parseTime = utcParse('%Y%m');
    moment.utc();
    let months = {};
    for(var i = 0; i < 12; i++){
      const a = moment().subtract(i, 'months').format('YYYYMM');
      months[a] = null;
    }
    // find the earliest date we have data for the last year
    let min = Infinity;
    data.forEach(d => {
      min = Math.min(min, d.key);
      months[d.key] = +d.value;
    });

    this._counts = Object.keys(months)
      .filter(k => k >= min)
      .map(d => ({
        l: parseTime(d).getTime(),
        v: months[d] ? [months[d]] : []
      }))


    if(!this._expense) {
      this._expense = bars('monthly')
        .tickCountIndex('utcMonth') // want monthly ticks
        .tickDisplayValue(d => `£${d}`) // Force to £ for now
        .labelTime('%b') // use the smart formatter
        .orientation('bottom')
        .height(200)
        .tickFormatValue('($.0f');
    }
    this.onResize();
  }

  onResize() {
    const content = document.querySelector('.content__container--expand');
    const e = this._counts || [];
    const w = content.clientWidth * 0.8;
    let dat = e.slice(-12);
    let barSize = 6;
    let barSizeCoefficient = 0.7;
    if(w < 230){
      dat = e.slice(-2);
      barSizeCoefficient = 0.2
      barSize = Math.floor(w / (dat.length + 1) * barSizeCoefficient);
    }else if(w < 480){
      dat = e.slice(-8);
      barSizeCoefficient = 0.5;
      barSize = Math.floor(w / (dat.length + 1) * barSizeCoefficient);
    }else{
      barSize = Math.floor(w / (dat.length + 1) * barSizeCoefficient);
    }
    select('#expense')
      .datum(dat)
      .call(this._expense.width(w).barSize(barSize));
  }

  /**
   * Sift lifecycle method 'willPresentView'
   * Called when a sift starts to transition between size classes
   */
  willPresentView (value) {
    console.log('sift-ocado: view: willPresentView: ', value);
  }

  renderCardsSection(data){
    if (data.length === 0){
      return;
    }
    this.removeEmptyState();
    this.recipeSuggestion();
    cardCreator(data);
  }

  removeEmptyState(){
    document.querySelector('.scoresinfo').classList.remove('hide');
  }

  recipeSuggestion(){
    const fArray = Object.keys(ingredients);
    const randomF = Math.floor(Math.random() * fArray.length);
    const pickedF = ingredients[fArray[randomF]];
    const node = document.querySelector('#hero-message');
    node.innerHTML = `Next time try a <a target="_blank" href="http://www.bbc.co.uk/food/${pickedF.query}">recipe</a> with ${pickedF.plural}...`;
  }

  /**
   * Custom methods defined by the developer
   */
  countUpdated (data) {
    console.log('sift-ocado: view: countUpdated: ', data);
    this.renderTotalSection(data);
  }

  suggestionsUpdated(data){
    this.renderCardsSection(data);
  }
}

registerSiftView(new CreateView(window));
