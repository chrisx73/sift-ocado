(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/**
 * Observable pattern implementation.
 * Supports topics as String or Array.
 */
var Observable = function Observable() {
  this.observers = [];
};

Observable.prototype.subscribe = function subscribe (topic, observer) {
  this._op('_sub', topic, observer);
};

Observable.prototype.unsubscribe = function unsubscribe (topic, observer) {
  this._op('_unsub', topic, observer);
};

Observable.prototype.unsubscribeAll = function unsubscribeAll (topic) {
  if (!this.observers[topic]) {
    return;
  }
  delete this.observers[topic];
};

Observable.prototype.publish = function publish (topic, message) {
  this._op('_pub', topic, message);
};

Observable.prototype._op = function _op (op, topic, value) {
    var this$1 = this;

  if(Array.isArray(topic)) {
    topic.forEach(function (t) {
      this$1[op](t, value);
    });
  }
  else {
    this[op](topic, value);
  }
};

Observable.prototype._sub = function _sub (topic, observer) {
  this.observers[topic] || (this.observers[topic] = []);
  this.observers[topic].push(observer);
};

Observable.prototype._unsub = function _unsub (topic, observer) {
  if (!this.observers[topic]) {
    return;
  }
  var index = this.observers[topic].indexOf(observer);
  if (~index) {
    this.observers[topic].splice(index, 1);
  }
};

Observable.prototype._pub = function _pub (topic, message) {
    var this$1 = this;

  if (!this.observers[topic]) {
    return;
  }
  for (var i = this.observers[topic].length - 1; i >= 0; i--) {
    this$1.observers[topic][i](message)
  }
};

var EmailClient = (function (Observable) {
  function EmailClient(proxy) {
    Observable.call(this);
    this._proxy = proxy;
  }

  if ( Observable ) EmailClient.__proto__ = Observable;
  EmailClient.prototype = Object.create( Observable && Observable.prototype );
  EmailClient.prototype.constructor = EmailClient;

  EmailClient.prototype.goto = function goto (params) {
    this._postMessage('goto', params);
  };

  EmailClient.prototype.close = function close () {
    this._postMessage('close');
  };

  EmailClient.prototype._postMessage = function _postMessage (topic, value) {
    this._proxy.postMessage({
      method: 'notifyClient',
      params: {
        topic: topic,
        value: value
      }
    });
  };

  return EmailClient;
}(Observable));

var SiftStorage = (function (Observable) {
  function SiftStorage() {
    Observable.call(this);
  }

  if ( Observable ) SiftStorage.__proto__ = Observable;
  SiftStorage.prototype = Object.create( Observable && Observable.prototype );
  SiftStorage.prototype.constructor = SiftStorage;

  SiftStorage.prototype.init = function init (treo) {
    var this$1 = this;

    Object.keys(treo).forEach(function (method) {
      this$1[method] = treo[method];
    });
  };

  return SiftStorage;
}(Observable));

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var index$2 = createCommonjsModule(function (module) {
'use strict';
var toString = Object.prototype.toString;

module.exports = function (x) {
	var prototype;
	return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};
});

var require$$0$3 = (index$2 && typeof index$2 === 'object' && 'default' in index$2 ? index$2['default'] : index$2);

var index$1 = createCommonjsModule(function (module, exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = range;

var _isPlainObj = require$$0$3;

var _isPlainObj2 = _interopRequireDefault(_isPlainObj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Parse `opts` to valid IDBKeyRange.
 * https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange
 *
 * @param {Object} opts
 * @return {IDBKeyRange}
 */

function range(opts) {
  var IDBKeyRange = commonjsGlobal.IDBKeyRange || commonjsGlobal.webkitIDBKeyRange;
  if (opts instanceof IDBKeyRange) return opts;
  if (typeof opts === 'undefined' || opts === null) return null;
  if (!(0, _isPlainObj2.default)(opts)) return IDBKeyRange.only(opts);
  var keys = Object.keys(opts).sort();

  if (keys.length === 1) {
    var key = keys[0];
    var val = opts[key];

    switch (key) {
      case 'eq':
        return IDBKeyRange.only(val);
      case 'gt':
        return IDBKeyRange.lowerBound(val, true);
      case 'lt':
        return IDBKeyRange.upperBound(val, true);
      case 'gte':
        return IDBKeyRange.lowerBound(val);
      case 'lte':
        return IDBKeyRange.upperBound(val);
      default:
        throw new TypeError('"' + key + '" is not valid key');
    }
  } else {
    var x = opts[keys[0]];
    var y = opts[keys[1]];
    var pattern = keys.join('-');

    switch (pattern) {
      case 'gt-lt':
        return IDBKeyRange.bound(x, y, true, true);
      case 'gt-lte':
        return IDBKeyRange.bound(x, y, true, false);
      case 'gte-lt':
        return IDBKeyRange.bound(x, y, false, true);
      case 'gte-lte':
        return IDBKeyRange.bound(x, y, false, false);
      default:
        throw new TypeError('"' + pattern + '" are conflicted keys');
    }
  }
}
module.exports = exports['default'];
});

var require$$0$2 = (index$1 && typeof index$1 === 'object' && 'default' in index$1 ? index$1['default'] : index$1);

var idbIndex = createCommonjsModule(function (module) {
var parseRange = require$$0$2;

/**
 * Expose `Index`.
 */

module.exports = Index;

/**
 * Initialize new `Index`.
 *
 * @param {Store} store
 * @param {String} name
 * @param {String|Array} field
 * @param {Object} opts { unique: false, multi: false }
 */

function Index(store, name, field, opts) {
  this.store = store;
  this.name = name;
  this.field = field;
  this.opts = opts;
  this.multi = opts.multi || opts.multiEntry || false;
  this.unique = opts.unique || false;
}

/**
 * Get `key`.
 *
 * @param {Object|IDBKeyRange} key
 * @param {Function} cb
 */

Index.prototype.get = function(key, cb) {
  var result = [];
  var isUnique = this.unique;
  var opts = { range: key, iterator: iterator };

  this.cursor(opts, function(err) {
    if (err) return cb(err);
    isUnique ? cb(null, result[0]) : cb(null, result);
  });

  function iterator(cursor) {
    result.push(cursor.value);
    cursor.continue();
  }
};

/**
 * Count records by `key`.
 *
 * @param {String|IDBKeyRange} key
 * @param {Function} cb
 */

Index.prototype.count = function(key, cb) {
  var name = this.store.name;
  var indexName = this.name;

  this.store.db.transaction('readonly', [name], function(err, tr) {
    if (err) return cb(err);
    var index = tr.objectStore(name).index(indexName);
    var req = index.count(parseRange(key));
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Create cursor.
 * Proxy to `this.store` for convinience.
 *
 * @param {Object} opts
 * @param {Function} cb
 */

Index.prototype.cursor = function(opts, cb) {
  opts.index = this.name;
  this.store.cursor(opts, cb);
};
});

var require$$0$1 = (idbIndex && typeof idbIndex === 'object' && 'default' in idbIndex ? idbIndex['default'] : idbIndex);

var index$3 = createCommonjsModule(function (module) {
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};
});

var require$$2 = (index$3 && typeof index$3 === 'object' && 'default' in index$3 ? index$3['default'] : index$3);

var idbStore = createCommonjsModule(function (module) {
var type = require$$2;
var parseRange = require$$0$2;

/**
 * Expose `Store`.
 */

module.exports = Store;

/**
 * Initialize new `Store`.
 *
 * @param {String} name
 * @param {Object} opts
 */

function Store(name, opts) {
  this.db = null;
  this.name = name;
  this.indexes = {};
  this.opts = opts;
  this.key = opts.key || opts.keyPath || undefined;
  this.increment = opts.increment || opts.autoIncretement || undefined;
}

/**
 * Get index by `name`.
 *
 * @param {String} name
 * @return {Index}
 */

Store.prototype.index = function(name) {
  return this.indexes[name];
};

/**
 * Put (create or replace) `key` to `val`.
 *
 * @param {String|Object} [key] is optional when store.key exists.
 * @param {Any} val
 * @param {Function} cb
 */

Store.prototype.put = function(key, val, cb) {
  var name = this.name;
  var keyPath = this.key;
  if (keyPath) {
    if (type(key) == 'object') {
      cb = val;
      val = key;
      key = null;
    } else {
      val[keyPath] = key;
    }
  }

  this.db.transaction('readwrite', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = keyPath ? objectStore.put(val) : objectStore.put(val, key);
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb(null, req.result) };
  });
};

/**
 * Get `key`.
 *
 * @param {String} key
 * @param {Function} cb
 */

Store.prototype.get = function(key, cb) {
  var name = this.name;
  this.db.transaction('readonly', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.get(key);
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Del `key`.
 *
 * @param {String} key
 * @param {Function} cb
 */

Store.prototype.del = function(key, cb) {
  var name = this.name;
  this.db.transaction('readwrite', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.delete(key);
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb() };
  });
};

/**
 * Count.
 *
 * @param {Function} cb
 */

Store.prototype.count = function(cb) {
  var name = this.name;
  this.db.transaction('readonly', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.count();
    req.onerror = cb;
    req.onsuccess = function onsuccess(e) { cb(null, e.target.result) };
  });
};

/**
 * Clear.
 *
 * @param {Function} cb
 */

Store.prototype.clear = function(cb) {
  var name = this.name;
  this.db.transaction('readwrite', [name], function(err, tr) {
    if (err) return cb(err);
    var objectStore = tr.objectStore(name);
    var req = objectStore.clear();
    tr.onerror = tr.onabort = req.onerror = cb;
    tr.oncomplete = function oncomplete() { cb() };
  });
};

/**
 * Perform batch operation.
 *
 * @param {Object} vals
 * @param {Function} cb
 */

Store.prototype.batch = function(vals, cb) {
  var name = this.name;
  var keyPath = this.key;
  var keys = Object.keys(vals);

  this.db.transaction('readwrite', [name], function(err, tr) {
    if (err) return cb(err);
    var store = tr.objectStore(name);
    var current = 0;
    tr.onerror = tr.onabort = cb;
    tr.oncomplete = function oncomplete() { cb() };
    next();

    function next() {
      if (current >= keys.length) return;
      var currentKey = keys[current];
      var currentVal = vals[currentKey];
      var req;

      if (currentVal === null) {
        req = store.delete(currentKey);
      } else if (keyPath) {
        if (!currentVal[keyPath]) currentVal[keyPath] = currentKey;
        req = store.put(currentVal);
      } else {
        req = store.put(currentVal, currentKey);
      }

      req.onerror = cb;
      req.onsuccess = next;
      current += 1;
    }
  });
};

/**
 * Get all.
 *
 * @param {Function} cb
 */

Store.prototype.all = function(cb) {
  var result = [];

  this.cursor({ iterator: iterator }, function(err) {
    err ? cb(err) : cb(null, result);
  });

  function iterator(cursor) {
    result.push(cursor.value);
    cursor.continue();
  }
};

/**
 * Create read cursor for specific `range`,
 * and pass IDBCursor to `iterator` function.
 * https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor
 *
 * @param {Object} opts:
 *   {IDBRange|Object} range - passes to .openCursor()
 *   {Function} iterator - function to call with IDBCursor
 *   {String} [index] - name of index to start cursor by index
 * @param {Function} cb - calls on end or error
 */

Store.prototype.cursor = function(opts, cb) {
  var name = this.name;
  this.db.transaction('readonly', [name], function(err, tr) {
    if (err) return cb(err);
    var store = opts.index
      ? tr.objectStore(name).index(opts.index)
      : tr.objectStore(name);
    var req = store.openCursor(parseRange(opts.range));

    req.onerror = cb;
    req.onsuccess = function onsuccess(e) {
      var cursor = e.target.result;
      cursor ? opts.iterator(cursor) : cb();
    };
  });
};
});

var require$$1 = (idbStore && typeof idbStore === 'object' && 'default' in idbStore ? idbStore['default'] : idbStore);

var schema$1 = createCommonjsModule(function (module) {
var type = require$$2;
var Store = require$$1;
var Index = require$$0$1;

/**
 * Expose `Schema`.
 */

module.exports = Schema;

/**
 * Initialize new `Schema`.
 */

function Schema() {
  if (!(this instanceof Schema)) return new Schema();
  this._stores = {};
  this._current = {};
  this._versions = {};
}

/**
 * Set new version.
 *
 * @param {Number} version
 * @return {Schema}
 */

Schema.prototype.version = function(version) {
  if (type(version) != 'number' || version < 1 || version < this.getVersion())
    throw new TypeError('not valid version');

  this._current = { version: version, store: null };
  this._versions[version] = {
    stores: [],      // db.createObjectStore
    dropStores: [],  // db.deleteObjectStore
    indexes: [],     // store.createIndex
    dropIndexes: [], // store.deleteIndex
    version: version // version
  };

  return this;
};

/**
 * Add store.
 *
 * @param {String} name
 * @param {Object} [opts] { key: false }
 * @return {Schema}
 */

Schema.prototype.addStore = function(name, opts) {
  if (type(name) != 'string') throw new TypeError('`name` is required');
  if (this._stores[name]) throw new TypeError('store is already defined');
  var store = new Store(name, opts || {});
  this._stores[name] = store;
  this._versions[this.getVersion()].stores.push(store);
  this._current.store = store;
  return this;
};

/**
 * Drop store.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.dropStore = function(name) {
  if (type(name) != 'string') throw new TypeError('`name` is required');
  var store = this._stores[name];
  if (!store) throw new TypeError('store is not defined');
  delete this._stores[name];
  this._versions[this.getVersion()].dropStores.push(store);
  return this;
};

/**
 * Add index.
 *
 * @param {String} name
 * @param {String|Array} field
 * @param {Object} [opts] { unique: false, multi: false }
 * @return {Schema}
 */

Schema.prototype.addIndex = function(name, field, opts) {
  if (type(name) != 'string') throw new TypeError('`name` is required');
  if (type(field) != 'string' && type(field) != 'array') throw new TypeError('`field` is required');
  var store = this._current.store;
  if (store.indexes[name]) throw new TypeError('index is already defined');
  var index = new Index(store, name, field, opts || {});
  store.indexes[name] = index;
  this._versions[this.getVersion()].indexes.push(index);
  return this;
};

/**
 * Drop index.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.dropIndex = function(name) {
  if (type(name) != 'string') throw new TypeError('`name` is required');
  var index = this._current.store.indexes[name];
  if (!index) throw new TypeError('index is not defined');
  delete this._current.store.indexes[name];
  this._versions[this.getVersion()].dropIndexes.push(index);
  return this;
};

/**
 * Change current store.
 *
 * @param {String} name
 * @return {Schema}
 */

Schema.prototype.getStore = function(name) {
  if (type(name) != 'string') throw new TypeError('`name` is required');
  if (!this._stores[name]) throw new TypeError('store is not defined');
  this._current.store = this._stores[name];
  return this;
};

/**
 * Get version.
 *
 * @return {Number}
 */

Schema.prototype.getVersion = function() {
  return this._current.version;
};

/**
 * Generate onupgradeneeded callback.
 *
 * @return {Function}
 */

Schema.prototype.callback = function() {
  var versions = Object.keys(this._versions)
    .map(function(v) { return this._versions[v] }, this)
    .sort(function(a, b) { return a.version - b.version });

  return function onupgradeneeded(e) {
    var db = e.target.result;
    var tr = e.target.transaction;

    versions.forEach(function(versionSchema) {
      if (e.oldVersion >= versionSchema.version) return;

      versionSchema.stores.forEach(function(s) {
        var options = {};

        // Only pass the options that are explicitly specified to createObjectStore() otherwise IE/Edge
        // can throw an InvalidAccessError - see https://msdn.microsoft.com/en-us/library/hh772493(v=vs.85).aspx
        if (typeof s.key !== 'undefined') options.keyPath = s.key;
        if (typeof s.increment !== 'undefined') options.autoIncrement = s.increment;

        db.createObjectStore(s.name, options);
      });

      versionSchema.dropStores.forEach(function(s) {
        db.deleteObjectStore(s.name);
      });

      versionSchema.indexes.forEach(function(i) {
        var store = tr.objectStore(i.store.name);
        store.createIndex(i.name, i.field, {
          unique: i.unique,
          multiEntry: i.multi
        });
      });

      versionSchema.dropIndexes.forEach(function(i) {
        var store = tr.objectStore(i.store.name);
        store.deleteIndex(i.name);
      });
    });
  };
};
});

var require$$2$1 = (schema$1 && typeof schema$1 === 'object' && 'default' in schema$1 ? schema$1['default'] : schema$1);

var index = createCommonjsModule(function (module, exports) {
var type = require$$2;
var Schema = require$$2$1;
var Store = require$$1;
var Index = require$$0$1;

/**
 * Expose `Treo`.
 */

exports = module.exports = Treo;

/**
 * Initialize new `Treo` instance.
 *
 * @param {String} name
 * @param {Schema} schema
 */

function Treo(name, schema) {
  if (!(this instanceof Treo)) return new Treo(name, schema);
  if (type(name) != 'string') throw new TypeError('`name` required');
  if (!(schema instanceof Schema)) throw new TypeError('not valid schema');

  this.name = name;
  this.status = 'close';
  this.origin = null;
  this.stores = schema._stores;
  this.version = schema.getVersion();
  this.onupgradeneeded = schema.callback();

  // assign db property to each store
  Object.keys(this.stores).forEach(function(storeName) {
    this.stores[storeName].db = this;
  }, this);
}

/**
 * Expose core classes.
 */

exports.schema = Schema;
exports.cmp = cmp;
exports.Treo = Treo;
exports.Schema = Schema;
exports.Store = Store;
exports.Index = Index;

/**
 * Use plugin `fn`.
 *
 * @param {Function} fn
 * @return {Treo}
 */

Treo.prototype.use = function(fn) {
  fn(this, exports);
  return this;
};

/**
 * Drop.
 *
 * @param {Function} cb
 */

Treo.prototype.drop = function(cb) {
  var name = this.name;
  this.close(function(err) {
    if (err) return cb(err);
    var req = indexedDB().deleteDatabase(name);
    req.onerror = cb;
    req.onsuccess = function onsuccess() { cb() };
  });
};

/**
 * Close.
 *
 * @param {Function} cb
 */

Treo.prototype.close = function(cb) {
  if (this.status == 'close') return cb();
  this.getInstance(function(err, db) {
    if (err) return cb(err);
    db.origin = null;
    db.status = 'close';
    db.close();
    cb();
  });
};

/**
 * Get store by `name`.
 *
 * @param {String} name
 * @return {Store}
 */

Treo.prototype.store = function(name) {
  return this.stores[name];
};

/**
 * Get db instance. It starts opening transaction only once,
 * another requests will be scheduled to queue.
 *
 * @param {Function} cb
 */

Treo.prototype.getInstance = function(cb) {
  if (this.status == 'open') return cb(null, this.origin);
  if (this.status == 'opening') return this.queue.push(cb);

  this.status = 'opening';
  this.queue = [cb]; // queue callbacks

  var that = this;
  var req = indexedDB().open(this.name, this.version);
  req.onupgradeneeded = this.onupgradeneeded;

  req.onerror = req.onblocked = function onerror(e) {
    that.status = 'error';
    that.queue.forEach(function(cb) { cb(e) });
    delete that.queue;
  };

  req.onsuccess = function onsuccess(e) {
    that.origin = e.target.result;
    that.status = 'open';
    that.origin.onversionchange = function onversionchange() {
      that.close(function() {});
    };
    that.queue.forEach(function(cb) { cb(null, that.origin) });
    delete that.queue;
  };
};

/**
 * Create new transaction for selected `stores`.
 *
 * @param {String} type (readwrite|readonly)
 * @param {Array} stores - follow indexeddb semantic
 * @param {Function} cb
 */

Treo.prototype.transaction = function(type, stores, cb) {
  this.getInstance(function(err, db) {
    err ? cb(err) : cb(null, db.transaction(stores, type));
  });
};

/**
 * Compare 2 values using IndexedDB comparision algotihm.
 *
 * @param {Mixed} value1
 * @param {Mixed} value2
 * @return {Number} -1|0|1
 */

function cmp() {
  return indexedDB().cmp.apply(indexedDB(), arguments);
}

/**
 * Dynamic link to `global.indexedDB` for polyfills support.
 *
 * @return {IDBDatabase}
 */

function indexedDB() {
  return commonjsGlobal._indexedDB
    || commonjsGlobal.indexedDB
    || commonjsGlobal.msIndexedDB
    || commonjsGlobal.mozIndexedDB
    || commonjsGlobal.webkitIndexedDB;
}
});

var require$$0 = (index && typeof index === 'object' && 'default' in index ? index['default'] : index);

var treoStorage = createCommonjsModule(function (module) {
/**
 * Redsift SDK. Storage module.
 * Based on APIs from https://github.com/CrowdProcess/riak-pb
 *
 * Copyright (c) 2015 Redsift Limited. All rights reserved.
 */
'use strict';
/*****************************************************************
 * Module
 *****************************************************************/
/* globals window, IDBKeyRange, Promise, define */
var TreoStorage = function (dbInfo, internalUse) {

  // dbInfo: {type: 'SYNC' | 'MSG' | 'SIFT', siftGuid: guid, accountGuid: guid, schema: schema }

  // Email msg buckets
  var EMAIL_ID_BUCKET = '_email.id';
  var EMAIL_TID_BUCKET = '_email.tid';

  var SPECIAL_BUCKETS = ['_id.list', '_tid.list', EMAIL_ID_BUCKET, EMAIL_TID_BUCKET];

  var SYNC_DB_PREFIX = 'rs_sync_log';
  var SYNC_DB_SCHEMA = [{ name: 'events', indexes: ['value.sift.guid']}, { name: 'admin' }];

  var MSG_DB_PREFIX = 'rs_msg_db';
  var MSG_DB_VERSIONED_SCHEMA = [
    // version 1
    [{name: '_id.list', indexes: ['sift.guid']}, {name: '_tid.list', indexes: ['sift.guid']}],
    // version 2
    [{name: EMAIL_ID_BUCKET, indexes: ['sift.guid']}, {name: EMAIL_TID_BUCKET, indexes: ['sift.guid']}, {name: '_id.list', drop: true}, {name: '_tid.list', drop: true}]
  ];

  // siftDb required buckets
  var USER_BUCKET = '_user.default';
  var REDSIFT_BUCKET = '_redsift';

  // Treo.js
  var treo = require$$0;
  // Main db
  var _db;
  // Msg db for _email.id and _email.tid (in case this is a sift db)
  var _msgDb;

  var _siftGuid;
  var _accountGuid;

  /*****************************************************************
   * Internal Operations
   *****************************************************************/
  // Batch deletion supports numeric keys
  function _batchDelete(db, bucket, vals) {
    // console.log('storage: _batchDelete: ', bucket, vals);
    return new Promise(function (resolve, reject) {
      var keys = vals;
      db.transaction('readwrite', [bucket], function(err, tr) {
        if (err) { return reject(err); }
        var store = tr.objectStore(bucket);
        var current = 0;
        tr.onerror = tr.onabort = reject;
        tr.oncomplete = function oncomplete() { resolve(); };
        next();

        function next() {
          if (current >= keys.length) { return; }
          var currentKey = keys[current];
          var req;
          req = store.delete(currentKey);
          req.onerror = reject;
          req.onsuccess = next;
          current += 1;
        }
      });
    });
  }

  function _batchPut(db, bucket, kvs) {
    // console.log('storage: _batchPut: ', db, bucket, kvs);
    return new Promise(function (resolve, reject) {
      var count = kvs.length;
      db.transaction('readwrite', [bucket], function(err, tr) {
        if (err) { return reject(err); }
        var store = tr.objectStore(bucket);
        var current = 0;
        tr.onerror = tr.onabort = reject;
        tr.oncomplete = function oncomplete() { resolve(); };
        next();

        function next() {
          if (current >= count) { return; }
          // console.log('storage: _batchPut: put: ', kvs[current]);
          var req;
          req = store.put(kvs[current].value, kvs[current].key);
          req.onerror = reject;
          req.onsuccess = next;
          current += 1;
        }
      });
    });
  }

  function _getWithIndexRange(db, bucket, keys, index, range) {
    // console.log('storage: _getWithIndexRange: ', bucket, keys);
    return new Promise(function (resolve, reject) {
      var store = db.store(bucket);
      var result = [];
      var found = 0;
      keys.forEach(function (k) {
        result.push({key: k, value: undefined});
      });
      store.cursor({ index: index, range: range, iterator: iterator }, done);

      function iterator(cursor) {
        var ki = keys.indexOf(cursor.primaryKey);
        if (ki !== -1) {
          // console.log('storage: found key: ', cursor.primaryKey);
          result[ki].value = cursor.value.value;
          found++;
        }
        if(found === keys.length) {
          return done();
        }
        cursor.continue();
      }

      function done(err) {
        // console.log('storage: _getWithIndexRange: result: ', result);
        err ? reject(err) : resolve(result);
      }
    });
  }


  function _findIn(db, bucket, keys) {
    // console.log('storage: findIn: ', bucket, keys);
    return new Promise(function (resolve, reject) {
      var store = db.store(bucket);
      var result = [];
      var current = 0;
      var sKeys = keys.slice();
      sKeys = sKeys.sort(treo.cmp);

      // console.log('storage: findIn: sorted keys: ', sKeys);
      keys.forEach(function (k) {
        result.push({key: k, value: undefined});
      });
      store.cursor({ iterator: iterator }, done);

      function iterator(cursor) {
        // console.log('storage: findIn: iterator: ', cursor);
        if (cursor.key > sKeys[current]) {
          // console.log('storage: cursor ahead: ', cursor.key, sKeys[current]);
          while(cursor.key > sKeys[current] && current < sKeys.length) {
            current += 1;
            // console.log('storage: moving to next key: ', cursor.key, sKeys[current]);
          }
          if(current > sKeys.length) {
            // console.log('storage: exhausted keys. done.');
            return done();
          }
        }
        if (cursor.key === sKeys[current]) {
          // console.log('storage: found key: ', cursor.key);
          result[keys.indexOf(sKeys[current])] = {key: cursor.key, value: cursor.value.value};
          current += 1;
          (current < sKeys.length)?cursor.continue(sKeys[current]):done();
        }
        else {
          // console.log('storage: continuing to next key: ', sKeys[current]);
          cursor.continue(sKeys[current]); // go to next key
        }
      }

      function done(err) {
        // console.log('storage: findIn: result: ', result);
        err ? reject(err) : resolve(result);
      }
    });
  }

  function _getAll(db, bucket, loadValue, index, range) {
    // console.log('storage: _getAll: ', bucket, loadValue, index, range);
    return new Promise(function (resolve, reject) {
      var result = [];
      var keys = [];
      var store = db.store(bucket);
      var opts = {iterator: iterator};
      if(index) {
        opts.index = index;
      }
      if(range) {
        opts.range = range;
      }
      store.cursor(opts, function(err) {
        if(err) {
          reject(err);
        }
        else {
          if(!index && !range && !loadValue) {
            resolve(keys);
          }
          else {
            resolve(result);
          }
        }
      });
      function iterator(cursor) {
        var kv = {key: cursor.primaryKey};
        if(loadValue) {
          kv.value = cursor.value.value;
        }
        if(index) {
          kv.index = cursor.key;
        }
        result.push(kv);
        keys.push(cursor.primaryKey);
        cursor.continue();
      }
    });
  }
  /*****************************************************************
   * External Operations
   *****************************************************************/
  var Private = {};
  var Public = {};

  Private.get =
  Public.get =
  function (params) {
    var db = _db;
    // console.log('storage: get: ', params);
    if (!params.bucket) {
      console.error('storage: get: undefined bucket');
      return Promise.reject('undefined bucket');
    }
    if (!params.keys || params.keys.length === 0) {
      return Promise.reject('no keys specified');
    }
    if(params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
      db = _msgDb;
      var keys = params.keys.map(function (k) {
        return _siftGuid + '/' + k;
      });
      return _findIn(db, params.bucket, keys).then(function (result) {
        return result.map(function (r) {
          return {key: r.key.split('/')[1], value: r.value};
        });
      });
    }
    return _findIn(db, params.bucket, params.keys);
  };

  Private.getIndexKeys =
  Public.getIndexKeys =
  function (params) {
    var db = _db;
    // console.log('storage: getIndexKeys: ', params);
    if(!params.bucket) {
      console.error('storage: getIndexKeys: undefined bucket');
      return Promise.reject('undefined bucket');
    }
    if(!params.index) {
      return Promise.reject('no index specified');
    }
    if(params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
      db = _msgDb;
      return _getAll(db, params.bucket, false, params.index, params.range).then(function (result) {
        return result.map(function (r) {
          return {key: r.key.split('/')[1], value: r.value};
        });
      });
    }
    return _getAll(db, params.bucket, false, params.index, params.range);
  };

  Private.getIndex =
  Public.getIndex =
  function (params) {
    var db = _db;
    // console.log('storage: getIndex: ', params);
    if(!params.bucket) {
      console.error('storage: getIndex: undefined bucket');
      return Promise.reject('undefined bucket');
    }
    if(!params.index) {
      return Promise.reject('no index specified');
    }
    if(params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
      db = _msgDb;
      return _getAll(db, params.bucket, true, params.index, params.range).then(function (result) {
        return result.map(function (r) {
          return {key: r.key.split('/')[1], value: r.value};
        });
      });
    }
    return _getAll(db, params.bucket, true, params.index, params.range);
  };

  Private.getWithIndex =
  Public.getWithIndex =
  function (params) {
    var db = _db;
    // console.log('storage: getWithIndex: ', params);
    if(!params.bucket) {
      console.error('storage: getWithIndex: undefined bucket');
      return Promise.reject('undefined bucket');
    }
    if(!params.keys) {
      console.error('storage: getWithIndex: undefined keys');
      return Promise.reject('no keys specified');
    }
    if(!params.index) {
      console.error('storage: getWithIndex: undefined index');
      return Promise.reject('no index specified');
    }
    if(!params.range) {
      console.error('storage: getWithIndex: undefined range');
      return Promise.reject('no range specified');
    }
    if(params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
      db = _msgDb;
      var keys = params.keys.map(function (k) {
        return _siftGuid + '/' + k;
      });
      return _getWithIndexRange(db, params.bucket, keys, params.index, params.range).then(function (result) {
        return result.map(function (r) {
          return {key: r.key.split('/')[1], value: r.value};
        });
      });
    }
    return _getWithIndexRange(db, params.bucket, params.keys, params.index, params.range);
  };

  Private.getAllKeys =
  Public.getAllKeys =
  function (params) {
    var db = _db;
    // console.log('storage: getAllKeys: ', params);
    if (!params.bucket) {
      console.error('storage: getAllKeys: undefined bucket');
      return Promise.reject('undefined bucket');
    }
    if(params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
      db = _msgDb;
      return _getAll(db, params.bucket, false).then(function (result) {
        return result.map(function (r) {
          return {key: r.key.split('/')[1], value: r.value};
        });
      });
    }
    return _getAll(db, params.bucket, false);
  };

  Private.getAll =
  Public.getAll =
  function (params) {
    var db = _db;
    if (!params.bucket) {
      console.error('storage: getAll: undefined bucket');
      return Promise.reject('undefined bucket');
    }
    if(params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
      db = _msgDb;
      return _getAll(db, params.bucket, true).then(function (result) {
        return result.map(function (r) {
          return {key: r.key.split('/')[1], value: r.value};
        });
      });
    }
    return _getAll(db, params.bucket, true);
  };

  Private.getUser =
  Public.getUser =
  function (params) {
    params.bucket = USER_BUCKET;
    return Private.get(params);
  };

  Private.put =
  function (params, raw) {
    // console.log('storage: put: ', params, raw);
    var db = _db;
    if (!params.bucket) {
      console.error('storage: put: undefined bucket');
      return Promise.reject('undefined bucket');
    }
    if (!params.kvs || params.kvs.length === 0) {
      console.warn('storage: put called with no/empty kvs');
      return Promise.resolve();
    }
    var kvs = params.kvs;
    if(!raw) {
      // Wrap value into a {value: object}
      kvs = kvs.map(function (kv) {
        return {key: kv.key, value: {value: kv.value}};
      });
    }
    if(params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
      db = _msgDb;
      kvs = kvs.map(function (kv) {
        return {key: _siftGuid + '/' + kv.key, value: kv.value};
      });
    }
    return _batchPut(db, params.bucket, kvs);
  };

  Private.putUser =
  Public.putUser =
  function (params) {
    params.bucket = USER_BUCKET;
    if(!params.kvs || params.kvs.length === 0) {
      return Promise.reject('no kvs provided');
    }
    return Private.put(params);
  };

  Private.del =
  function (params) {
    var db = _db;
    if (!params.bucket) {
      console.error('storage: del: undefined bucket');
      return Promise.reject('undefined bucket');
    }
    if (!params.keys || params.keys.length === 0) {
      // console.log('storage: del called with no/empty keys');
      return Promise.resolve();
    }
    var keys = params.keys;
    if(params.bucket === EMAIL_ID_BUCKET || params.bucket === EMAIL_TID_BUCKET) {
      db = _msgDb;
      keys = params.keys.map(function (k) {
        return _siftGuid + '/' + k;
      });
    }
    return _batchDelete(db, params.bucket, keys);
  };

  Public.delUser =
  function (params) {
    params.bucket = USER_BUCKET;
    return Private.del(params);
  };

  Private.deleteDatabase =
  function () {
    return new Promise(function(resolve, reject) {
      _db.drop(function(err) {
        if(!err) {
          resolve();
        }
        else {
          reject(err);
        }
      });
    });
  };

  Private.cursor =
  function (params, done) {
    if (!params.bucket) {
      console.error('storage: getCursor: undefined bucket');
      done('storage: getCursor: undefined bucket');
    }
    else {
      var bucket = _db.store(params.bucket);
      bucket.cursor({iterator: params.iterator}, done);
    }
  };

  Private.db =
  function () {
    return _db;
  };

  Private.msgDb =
  function () {
    return _msgDb;
  };

  Private.setSiftGuid =
  function (guid) {
    return _siftGuid = guid;
  };

  /*****************************************************************
   * Initialisation
   *****************************************************************/
  // define db schema
  function _getTreoSchema(stores, sift) {
    var schema = treo.schema().version(1);
    stores.forEach(function(os) {
      if(!(sift && (SPECIAL_BUCKETS.indexOf(os.name) !== -1))) {
        if(os.keypath) {
          schema = schema.addStore(os.name, {key: os.keypath});
        }
        else {
          schema = schema.addStore(os.name);
        }
        if(os.indexes) {
          os.indexes.forEach(function (idx) {
            schema = schema.addIndex(idx, idx, {unique: false});
          });
        }
      }
    });
    return schema;
  }

  function _getVersionedTreoSchema(versions, sift) {
    var schema = treo.schema();
    versions.forEach(function(stores, i) {
      schema = schema.version(i+1);
      stores.forEach(function(os) {
        if(!(sift && (SPECIAL_BUCKETS.indexOf(os.name) !== -1))) {
          if(os.drop) {
            // console.log('storage: _getVersionedTreoSchema: dropping store: ', os.name);
            schema = schema.dropStore(os.name);
          }
          else if(os.keypath) {
            schema = schema.addStore(os.name, {key: os.keypath});
          }
          else {
            schema = schema.addStore(os.name);
          }
          if(os.indexes) {
            os.indexes.forEach(function (idx) {
              if(os.drop) {
              // console.log('storage: _getVersionedTreoSchema: dropping store/index: ' + os.name + '/' + idx);
                schema = schema.dropIndex(idx);
              }
              else {
                schema = schema.addIndex(idx, idx, {unique: false});
              }
            });
          }
        }
      });
    });
    return schema;
  }

  if(!dbInfo.hasOwnProperty('accountGuid')) {
    console.error('storage: missing required property: dbInfo.accountGuid');
    return null;
  }
  else {
    _accountGuid = dbInfo.accountGuid;
  }
  // Create DBs
  switch(dbInfo.type) {
    case 'MSG':
      _msgDb = treo(MSG_DB_PREFIX + '-' + dbInfo.accountGuid, _getVersionedTreoSchema(MSG_DB_VERSIONED_SCHEMA));
      break;
    case 'SIFT':
      if(!dbInfo.hasOwnProperty('siftGuid')) {
        console.error('storage: missing required property: siftGuid');
        return null;
      }
      else {
        _siftGuid = dbInfo.siftGuid;
      }
      // console.log('storage: creating SIFT db.');
      var schema = _getTreoSchema(dbInfo.schema, true);
      schema = schema.addStore(USER_BUCKET).addStore(REDSIFT_BUCKET);
      _db = treo(_siftGuid + '-' + _accountGuid, schema);
      _msgDb = treo(MSG_DB_PREFIX + '-' + dbInfo.accountGuid, _getVersionedTreoSchema(MSG_DB_VERSIONED_SCHEMA));
      break;
    case 'SYNC':
      // console.log('storage: creating SYNC db.');
      _db = treo(SYNC_DB_PREFIX + '-' + dbInfo.accountGuid, _getTreoSchema(SYNC_DB_SCHEMA));
      break;
    default:
      console.error('storage: unknown db type: ', dbInfo.type);
      return null;
  }

  if(internalUse) {
    // console.log('storage: returning private methods');
    return Private;
  }
  else {
    // console.log('storage: public methods only');
    return Public;
  }
};

/*****************************************************************
 * Exports
 *****************************************************************/
if (typeof module !== 'undefined' && module.exports) { module.exports = TreoStorage; } // CommonJs export
if (typeof define === 'function' && define.amd) { define([], function () { return TreoStorage; }); } // AMD
});

var SiftView = function SiftView() {
  this._resizeHandler = null;
  this._proxy = parent;
  this.controller = new Observable();
  this._registerMessageListeners();
};

SiftView.prototype.publish = function publish (topic, value) {
 this._proxy.postMessage({
    method: 'notifyController',
    params: {
      topic: topic,
      value: value } },
    '*');
};

SiftView.prototype.registerOnLoadHandler = function registerOnLoadHandler (handler) {
  window.addEventListener('load', handler);
};

// TODO: should we really limit resize events to every 1 second?
SiftView.prototype.registerOnResizeHandler = function registerOnResizeHandler (handler, resizeTimeout) {
    var this$1 = this;
    if ( resizeTimeout === void 0 ) resizeTimeout = 1000;

  window.addEventListener('resize', function () {
    if (!this$1.resizeHandler) {
      this$1.resizeHandler = setTimeout(function () {
        this$1.resizeHandler = null;
        handler();
      }, resizeTimeout);
    }
  });
};

SiftView.prototype._registerMessageListeners = function _registerMessageListeners () {
    var this$1 = this;

  window.addEventListener('message', function (e) {
    var method = e.data.method;
    var params = e.data.params;
    if(method === 'notifyView') {
      this$1.controller.publish(params.topic, params.value);
    }
    else if(this$1[method]) {
      this$1[method](params);
    }
    else {
      console.warn('[SiftView]: method not implemented: ', method);
    }
  }, false);
};

function createSiftView(instanceMethods) {
  return _create(SiftView, instanceMethods);
}

/**
 * Local functions
 */
function _create(Base, methods) {
  var Creature = function() {
    Base.call(this);
    if(this.init && typeof this.init === 'function') {
      this.init();
    }
  };
  Creature.prototype = Object.create(Base.prototype);
  Creature.constructor = Creature;
  Object.keys(methods).forEach(function (method) {
    Creature.prototype[method] = methods[method];
  });
  return new Creature();
}

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
      .tipHtml(function (d, i) { return '£' + format(d[1][1]); })
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

})));