/**
 * Sift Ocado. Frontend controller.
 */

'use strict';
/* globals document, Redsift, Sift */

// Function: loadView
// Description: Invoked by the Redsift client when a Sift has transitioned to its final size class
//
// Parameters:
// @value: {
//          sizeClass: {
//            previous: {width: 'compact'|'full', height: 'compact'|'full'},
//            current:  {width: 'compact'|'full', height: 'compact'|'full'}
//          },
//          type: 'email-compose'|'email-thread'|'summary',
//          data: {<object>}
//        }
//
// return: null or {html:'<string>', data: {<object>}}
// @resolve: function ({html:'<string>', data: {<object>})
// @reject: function (error)
Sift.Controller.loadView = function (value, resolve, reject) {
  console.log('sift-ocado: loadView', value);

  /*
  * Replace example code with your sift logic
  */
  var height = value.sizeClass.current.height,
    response = { data: {}};

  var msg = 'returned synchronously';
  if(height === 'full') {
    // Asynchronous return
    msg = 'waiting for async response...';
    fullAsyncHandler(resolve, reject);
  }

  // Synchronous return
  response.html = 'frontend/view.html';
  response.data = {
      message: msg
  };

  return response;
};

// Function: loadData
// Description: Invoked by the Sift view to load more data
//
// Parameters:
// @value: <object>
//
// return: <object>
// @resolve: function (<object>)
// @reject: function (error)
Sift.Controller.loadData = function (value) {
  console.log('sift-ocado: loadData', value);
  return Sift.Storage.get({
      bucket: 'count',
      keys: [value.key]
  }).then(function (values) {
    console.log('sift-ocado: storage returned: ', values);
    return values[0].value;
  });
};

// Function: loadLabel
// Description: Invoked when the Redsift client requires a textual representation for the sift
//
// Parameters:
// @value: {}
//
// return: null or {data: 'label string'}
// @resolve: function ({data: 'label string'})
// @reject: function (error)
Sift.Controller.loadLabel = function(value, resolve, reject) {
  console.log('sift-ocado: loadLabel');
  return {data: 'Sift Ocado'};
};

// Event: storage update
// Description: fired whenever anything changes in the Sift's storage
//              you can replace '*' by the name of a specific bucket
Sift.Storage.addUpdateListener('*', function (value) {
  console.log('sift-ocado: storage updated: ', value);
  // Storage has been updated, fetch the new count
  Sift.Storage.get({
      bucket: 'count',
      keys: ['TOTAL']
  }).then(function (values) {
    console.log('sift-ocado: storage returned: ', values);
    Sift.Controller.notifyListeners('count', values[0].value);
  });
});

// Register for specific UI events
Sift.View.addEventListener('ncButton-pressed', function (value) {
  console.log('sift-ocado: ncButton-pressed received: ', value);
  Sift.Storage.putUser({
    kvs: [{key: 'NCBUTTONPRESSED', value: value}]
  }).then(function () {
    console.log('sift-ocado: stored in user database');
  }).catch(function (err) {
    console.error('sift-ocado: error storing in user database', err);
  });
});

function fullAsyncHandler(resolve, reject){
  setTimeout(function () {
    // Asynchronous resolve
    resolve ({
        html: 'frontend/view.html',
        data: {
          message: 'resolved asynchronously'
        }
      });
    }, 1500);
}

/**
 * Sift Ocado. Client event handlers.
 */

// Event: emailread
// Description: Triggered when the user finishes reading an email
//
// Parameters:
// @event:
// {
//   threadID: the ID of the thread
//   time: time reading email (in ms)
// }
Redsift.Client.addEventListener('emailread', function (event) {
  console.log('sift-ocado: emailread: ', event);
});

// Event: emailsent
// Description: Triggered when the user finishes sending an email
//
// Parameters:
// @event:
// {
//   threadID: the ID of the thread
//   time: time writing email (in ms)
// }
Redsift.Client.addEventListener('emailsent', function (event) {
  console.log('sift-ocado: emailsent: ', event);
});

// Event: emaildiscarded
// Description: Triggered when the user discards an email that they were composing
//
// Parameters:
// @event:
// {
//   messageID: the ID of the message (as it was discarded, it is not part of a thread)
//   time: time writing email (in ms)
// }
Redsift.Client.addEventListener('emaildiscarded', function (event) {
  console.log('sift-ocado: emaildiscarded: ', event);
});

// Function: loadMessageListView
// Description: Invoked to allow the Sift to customise the presentation of a given message list view
//
// Parameters:
// @listInfo: the object emitted by your dag into the _email.id export bucket
// @supportedTemplates: the list of the templates supported by the invoking Redsift client
//
// @return: <object> containing one of the supported templates' information
Redsift.Client.loadMessageListView = function (listInfo, supportedTemplates) {
  console.log('sift-ocado: loadMessageListView: ', listInfo);
};

// Function: loadThreadListView
// Description: Invoked to allow the Sift to customise the presentation of a given thread list view
//
// Parameters:
// @listInfo: the object emitted by your dag into the _email.tid export bucket
// @supportedTemplates: the list of the templates supported by the invoking Redsift client
//
// @return: <object> containing one of the supported templates' information
Redsift.Client.loadThreadListView = function (listInfo, supportedTemplates) {
  console.log('sift-ocado: loadThreadListView: ', listInfo);
};
