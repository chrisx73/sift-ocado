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
    this.storage.subscribe(['count'], this.onStorageUpdate.bind(this));
  }

  loadView (value) {
    console.log('sift-ocado: controller: loadView: ', value);
    return {
      html: 'view.html',
      data: this.storage.getAll({ bucket: 'count' })
    };
  }

  onStorageUpdate (value) {
    console.log('sift-ocado: controller: onStorageUpdate: ', value);
    this.storage.getAll({ bucket: 'count' }).then(function (values) {
      this.publish('storageupdated', values);
    });
  }
}

registerSiftController(new MyController());
