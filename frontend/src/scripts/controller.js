/**
 * Sift Ocado. Frontend controller.
 */
'use strict';

import { createSiftController } from '@redsift/sift-sdk-web';

var SiftOcadoController = createSiftController({
  init: function () {
    console.log('sift-ocado: controller: init');
    // This is how you subscribe to the storage  (to use class variables and functions don't
    // forget to bind the 'this' pointer!):
    this.storage.subscribe(['count'], this.onStorageUpdate.bind(this));
  },

  /**
   * Sift lifecycle method 'loadView'
   * Invoked when a Sift has transitioned to a final size class or when its storage has been updated
   */
  loadView: function (value) {
    console.log('sift-ocado: controller: loadView: ', value);
    return {
      html: 'view.html',
      data: this.storage.getAll({ bucket: 'count' })
    };
  },

  /**
   * Custom methods defined by the developer
   */

  onStorageUpdate: function (value) {
    console.log('sift-ocado: controller: onStorageUpdate: ', value);
    this.storage.getAll({ bucket: 'count' }).then(function (values) {
      this.publish('storageupdated', values);
    });
  }
});
