/**
 * Sift Ocado. Frontend controller.
 */
'use strict';

import { SiftController, registerSiftController } from '@redsift/sift-sdk-web';

export default class MyController extends SiftController {
  constructor() {
    console.log('sift-ocado: controller: init');
    // You have to call the super() method to initialize the base class.
    super();
  }

  loadView (value) {
    console.log('sift-ocado: controller: loadView: ', value);
    this.storage.subscribe(['count'], this.onCountUpdate.bind(this));
    this.storage.subscribe(['suggestions'], this.onSuggestionsUpdate.bind(this));
    let detail = [];
    try{
      detail = value.params.detail;
    }catch(e){}

    switch (value.type) {
      case 'email-thread':
        return {
          html: 'detail.html',
          data: detail
        };
      case 'summary':
        return {
          html: 'view.html',
          data: this.startupFetch()
        };
      default:
        console.error('sift-ocado: unknown Sift type: ', value.type);
    }
  }

  fetchCount(){
    return this.storage.getAll({ bucket: 'count' });
  }

  onCountUpdate (value) {
    console.log('sift-ocado: controller: onCountUpdate: ', value);
    this.fetchCount().then(v => {
      this.publish('countupdated', v);
    });
  }

  fetchSuggestions(){
    return this.storage.get({
      keys: ['families'],
      bucket: 'suggestions'
    }).then(d => {
      let r = [];
      try{
        r = JSON.parse(d[0].value);
      }catch(e){
        console.warn('no data for suggestions');
      }
      return r;
    });
  }
  onSuggestionsUpdate (value) {
    console.log('sift-ocado: controller: onSuggestionsUpdate: ', value);
    this.fetchSuggestions().then(v => {
      this.publish('suggestionsupdated', v);
    });
  }

  startupFetch(){
    return Promise.all([this.fetchCount(), this.fetchSuggestions()])
    .then(d => ({count: d[0], suggestions: d[1]}))
  }
}

registerSiftController(new MyController());
