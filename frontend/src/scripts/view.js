/**
 * Sift Ocado. Frontend view entry point.
 */
'use strict';

import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';
import { html as bars } from '@redsift/d3-rs-bars';
import { select } from 'd3-selection';
import { utcParse } from 'd3-time-format';
import '@redsift/ui-rs-hero';

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
    this._counts = data.map(function (e) {
      return {
        l: parseTime(e.key).getTime(),
        v: [e.value]
      };
    });

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
    select('#expense')
      .datum(this._counts)
      .call(this._expense.width(content.clientWidth * 0.8));
  }

  /**
   * Sift lifecycle method 'willPresentView'
   * Called when a sift starts to transition between size classes
   */
  willPresentView (value) {
    console.log('sift-ocado: view: willPresentView: ', value);
  }

  renderCardsSection(data){
    console.log('the data', data);
    const parent = document.querySelector('#nscore');
    parent.innerHTML = '';
    const ct = document.querySelector('#card-template');
    const recBox = ct.content.querySelector('.card__box--recommend .card__box__items');
    const boughtBox = ct.content.querySelector('.card__box--bought .card__box__items');
    Object.keys(data).forEach(k => {
      const parentCard = ct.content.querySelector('.card');
      parentCard.className = '';
      parentCard.classList.add('card', 'card--' + k.toLowerCase().replace(/\/|\s/, '-'));
      ct.content.querySelector('.card__family').innerHTML = k;
      recBox.innerHTML = '';
      boughtBox.innerHTML = '';
      const s = data[k].suggestions;
      let name = 'Keep it Up!';
      let score = null;
      if(s.length > 0){
        const e = Math.floor(Math.random() * s.length);
        name = s[e].name;
        score = s[e].score;
        recBox.appendChild(this.createItem(s[e].name, s[e].score));
      }
      const f = data[k].found;
      if(f.length > 0){
        f.map(d => boughtBox.appendChild(this.createItem(d.name, d.score, score)))
      }else{

      }

      parent.appendChild(document.importNode(ct.content, true));
    });
  }

  createItem(name, score, max){
    const t = document.querySelector('#item-template');
    t.content.querySelector('.item__name .item__name__label').innerHTML = name;
    t.content.querySelector('.item__score').innerHTML = score;
    t.content.querySelector('.item__name').style.flex = `0 1 ${score}%`;
    return document.importNode(t.content, true)
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
