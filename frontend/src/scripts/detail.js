import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';
import { cardCreator} from './lib/card-creator';

export default class DetailView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();
    this.controller.subscribe('suggestionsupdated', this.recalc.bind(this));
  }

  presentView(got) {
    console.log('sift-ocado: detail got', got)
    this.updateView(got.data);
  }

  recalc(got) {
    console.log('sift-ocado: recalc got', got);
    this.updateView(got);
  }

  willPresentView() {}

  updateView(data){
    if(data) {
      const keys = Object.keys(data);
      const e = Math.floor(Math.random() * keys.length);
      const r = {};
      r[keys[e]] = data[keys[e]];
      cardCreator(r);
    }
  }
}

registerSiftView(new DetailView(window));
