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

var familyExamples = {
  Cruciferous: 'broccoli, kale, cauliflower',
  'Green leafy': 'lettuce, spinach, parsley',
  Allium: 'onion, garlic, leek',
  'Yellow/Orange': 'pumpkin, butternut squash',
  Citrus: 'orange, lemon, grapefruit',
  Berry: 'strawberries, blackberries'
}

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
    this.removeEmptyState();
    const parent = document.querySelector('#nscore');
    parent.innerHTML = '';
    Object.keys(data).forEach(k => {
      const ct = document.querySelector('#card-template').cloneNode(true);
      const recBox = ct.content.querySelector('.card__box--recommend');
      const recBoxItems = recBox.querySelector('.card__box__items');
      const boughtBoxItems = ct.content.querySelector('.card__box--bought .card__box__items');
      const parentCard = ct.content.querySelector('.card');
      parentCard.classList.add('card--' + k.toLowerCase().replace(/\/|\s/, '-'));
      ct.content.querySelector('.card__family__name').innerHTML = k;
      ct.content.querySelector('.card__family__examples').innerHTML = [familyExamples[k], '...'].join(', ');
      const s = data[k].suggestions;
      if(s.length > 0){
        const e = Math.floor(Math.random() * s.length);
        recBoxItems.appendChild(this.createItem(s[e].name, s[e].score));
      }else{
        const starTemp = document.querySelector('#item-star');
        recBox.innerHTML = '';
        recBox.appendChild(document.importNode(starTemp.content, true));
      }

      const f = data[k].found;
      if(f.length > 0){
        f.map(d => boughtBoxItems.appendChild(this.createItem(d.name, d.score)))
      }

      parent.appendChild(document.importNode(ct.content, true));
    });
  }

  createItem(name, score){
    const t = document.querySelector('#item-template').cloneNode(true);
    t.content.querySelector('.item__name .item__name__label').innerHTML = name;
    t.content.querySelector('.item__score').innerHTML = `${score}%`;
    // 230px - 45px(number) = 185px / 100 = 1.9
    t.content.querySelector('.item__name').style.flex = `0 1 ${1.85 * score}px`;
    return document.importNode(t.content, true)
  }

  removeEmptyState(){
    document.querySelector('.scoresinfo').classList.remove('hide');
    document.querySelector('#hero-message').style.display = 'none';
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
