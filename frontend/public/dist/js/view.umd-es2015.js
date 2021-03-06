(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
   typeof define === 'function' && define.amd ? define(factory) :
   (global.SiftOcado = factory());
}(this, (function () {

/**
 * Observable pattern implementation.
 * Supports topics as String or an Array.
 */
var Observable = function Observable() {
  this._observers = [];
};

Observable.prototype.subscribe = function subscribe (topic, observer) {
  this._op('_sub', topic, observer);
};

Observable.prototype.unsubscribe = function unsubscribe (topic, observer) {
  this._op('_unsub', topic, observer);
};

Observable.prototype.unsubscribeAll = function unsubscribeAll (topic) {
  if (!this._observers[topic]) {
    return;
  }
  delete this._observers[topic];
};

Observable.prototype.publish = function publish (topic, message) {
  this._op('_pub', topic, message);
};

/**
 * Internal methods
 */
Observable.prototype._op = function _op (op, topic, value) {
    var this$1 = this;

  if (Array.isArray(topic)) {
    topic.forEach(function (t) {
      this$1[op](t, value);
    });
  }
  else {
    this[op](topic, value);
  }
};

Observable.prototype._sub = function _sub (topic, observer) {
  this._observers[topic] || (this._observers[topic] = []);
  if(observer && this._observers[topic].indexOf(observer) === -1) {
    this._observers[topic].push(observer);
  }
};

Observable.prototype._unsub = function _unsub (topic, observer) {
  if (!this._observers[topic]) {
    return;
  }
  var index = this._observers[topic].indexOf(observer);
  if (~index) {
    this._observers[topic].splice(index, 1);
  }
};

Observable.prototype._pub = function _pub (topic, message) {
    var this$1 = this;

  if (!this._observers[topic]) {
    return;
  }
  for (var i = this._observers[topic].length - 1; i >= 0; i--) {
    this$1._observers[topic][i](message)
  }
};

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
    this._storage = null;
  }

  if ( Observable ) SiftStorage.__proto__ = Observable;
  SiftStorage.prototype = Object.create( Observable && Observable.prototype );
  SiftStorage.prototype.constructor = SiftStorage;

  SiftStorage.prototype.init = function init (storage) {
    this._storage = storage;
  };

  SiftStorage.prototype.get = function get (d) { return this._storage.get(d) };
  SiftStorage.prototype.getIndexKeys = function getIndexKeys (d) { return this._storage.getIndexKeys(d) };
  SiftStorage.prototype.getIndex = function getIndex (d) { return this._storage.getIndex(d) };
  SiftStorage.prototype.getWithIndex = function getWithIndex (d) { return this._storage.getWithIndex(d) };
  SiftStorage.prototype.getAllKeys = function getAllKeys (d) { return this._storage.getAllKeys(d) };
  SiftStorage.prototype.getAll = function getAll (d) { return this._storage.getAll(d) };
  SiftStorage.prototype.getUser = function getUser (d) { return this._storage.getUser(d) };
  SiftStorage.prototype.putUser = function putUser (d) { return this._storage.putUser(d) };
  SiftStorage.prototype.delUser = function delUser (d) { return this._storage.delUser(d) };

  return SiftStorage;
}(Observable));

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var loglevel = createCommonjsModule(function (module) {
/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/
(function (root, definition) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(definition);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        root.log = definition();
    }
}(commonjsGlobal, function () {
    "use strict";
    var noop = function() {};
    var undefinedType = "undefined";

    function realMethod(methodName) {
        if (typeof console === undefinedType) {
            return false; // We can't build a real method without a console to log to
        } else if (console[methodName] !== undefined) {
            return bindMethod(console, methodName);
        } else if (console.log !== undefined) {
            return bindMethod(console, 'log');
        } else {
            return noop;
        }
    }

    function bindMethod(obj, methodName) {
        var method = obj[methodName];
        if (typeof method.bind === 'function') {
            return method.bind(obj);
        } else {
            try {
                return Function.prototype.bind.call(method, obj);
            } catch (e) {
                // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                return function() {
                    return Function.prototype.apply.apply(method, [obj, arguments]);
                };
            }
        }
    }

    // these private functions always need `this` to be set properly

    function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
        return function () {
            if (typeof console !== undefinedType) {
                replaceLoggingMethods.call(this, level, loggerName);
                this[methodName].apply(this, arguments);
            }
        };
    }

    function replaceLoggingMethods(level, loggerName) {
        var this$1 = this;

        /*jshint validthis:true */
        for (var i = 0; i < logMethods.length; i++) {
            var methodName = logMethods[i];
            this$1[methodName] = (i < level) ?
                noop :
                this$1.methodFactory(methodName, level, loggerName);
        }
    }

    function defaultMethodFactory(methodName, level, loggerName) {
        /*jshint validthis:true */
        return realMethod(methodName) ||
               enableLoggingWhenConsoleArrives.apply(this, arguments);
    }

    var logMethods = [
        "trace",
        "debug",
        "info",
        "warn",
        "error"
    ];

    function Logger(name, defaultLevel, factory) {
      var self = this;
      var currentLevel;
      var storageKey = "loglevel";
      if (name) {
        storageKey += ":" + name;
      }

      function persistLevelIfPossible(levelNum) {
          var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

          // Use localStorage if available
          try {
              window.localStorage[storageKey] = levelName;
              return;
          } catch (ignore) {}

          // Use session cookie as fallback
          try {
              window.document.cookie =
                encodeURIComponent(storageKey) + "=" + levelName + ";";
          } catch (ignore) {}
      }

      function getPersistedLevel() {
          var storedLevel;

          try {
              storedLevel = window.localStorage[storageKey];
          } catch (ignore) {}

          if (typeof storedLevel === undefinedType) {
              try {
                  var cookie = window.document.cookie;
                  var location = cookie.indexOf(
                      encodeURIComponent(storageKey) + "=");
                  if (location) {
                      storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
                  }
              } catch (ignore) {}
          }

          // If the stored level is not valid, treat it as if nothing was stored.
          if (self.levels[storedLevel] === undefined) {
              storedLevel = undefined;
          }

          return storedLevel;
      }

      /*
       *
       * Public API
       *
       */

      self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
          "ERROR": 4, "SILENT": 5};

      self.methodFactory = factory || defaultMethodFactory;

      self.getLevel = function () {
          return currentLevel;
      };

      self.setLevel = function (level, persist) {
          if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
              level = self.levels[level.toUpperCase()];
          }
          if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
              currentLevel = level;
              if (persist !== false) {  // defaults to true
                  persistLevelIfPossible(level);
              }
              replaceLoggingMethods.call(self, level, name);
              if (typeof console === undefinedType && level < self.levels.SILENT) {
                  return "No console available for logging";
              }
          } else {
              throw "log.setLevel() called with invalid level: " + level;
          }
      };

      self.setDefaultLevel = function (level) {
          if (!getPersistedLevel()) {
              self.setLevel(level, false);
          }
      };

      self.enableAll = function(persist) {
          self.setLevel(self.levels.TRACE, persist);
      };

      self.disableAll = function(persist) {
          self.setLevel(self.levels.SILENT, persist);
      };

      // Initialize with the right level
      var initialLevel = getPersistedLevel();
      if (initialLevel == null) {
          initialLevel = defaultLevel == null ? "WARN" : defaultLevel;
      }
      self.setLevel(initialLevel, false);
    }

    /*
     *
     * Package-level API
     *
     */

    var defaultLogger = new Logger();

    var _loggersByName = {};
    defaultLogger.getLogger = function getLogger(name) {
        if (typeof name !== "string" || name === "") {
          throw new TypeError("You must supply a name when creating a logger.");
        }

        var logger = _loggersByName[name];
        if (!logger) {
          logger = _loggersByName[name] = new Logger(
            name, defaultLogger.getLevel(), defaultLogger.methodFactory);
        }
        return logger;
    };

    // Grab the current global log variable in case of overwrite
    var _log = (typeof window !== undefinedType) ? window.log : undefined;
    defaultLogger.noConflict = function() {
        if (typeof window !== undefinedType &&
               window.log === defaultLogger) {
            window.log = _log;
        }

        return defaultLogger;
    };

    return defaultLogger;
}));
});

var loglevel$1 = (loglevel && typeof loglevel === 'object' && 'default' in loglevel ? loglevel['default'] : loglevel);

var index$2 = createCommonjsModule(function (module) {
'use strict';
var toString = Object.prototype.toString;

module.exports = function (x) {
	var prototype;
	return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};
});

var require$$0$2 = (index$2 && typeof index$2 === 'object' && 'default' in index$2 ? index$2['default'] : index$2);

var index$1 = createCommonjsModule(function (module, exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = range;

var _isPlainObj = require$$0$2;

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

var require$$0$1 = (index$1 && typeof index$1 === 'object' && 'default' in index$1 ? index$1['default'] : index$1);

var idbIndex = createCommonjsModule(function (module) {
var parseRange = require$$0$1;

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

var require$$0 = (idbIndex && typeof idbIndex === 'object' && 'default' in idbIndex ? idbIndex['default'] : idbIndex);

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
var parseRange = require$$0$1;

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
var Index = require$$0;

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
var Index = require$$0;

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

var logger = loglevel$1.getLogger('RSStorage:operations');
logger.setLevel('warn');

/**
 * Redsift SDK. Sift Storage module.
 * Based on APIs from https://github.com/CrowdProcess/riak-pb
 *
 * Copyright (c) 2016 Redsift Limited. All rights reserved.
 */

/**
 * SiftView
 */
function registerSiftView(siftView) {
  console.log('[Redsift::registerSiftView]: registered');
}

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

function namespace(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
}

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

function creator(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
}

var matcher = function(selector) {
  return function() {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element = document.documentElement;
  if (!element.matches) {
    var vendorMatches = element.webkitMatchesSelector
        || element.msMatchesSelector
        || element.mozMatchesSelector
        || element.oMatchesSelector;
    matcher = function(selector) {
      return function() {
        return vendorMatches.call(this, selector);
      };
    };
  }
}

var matcher$1 = matcher;

var filterEvents = {};

var event = null;

if (typeof document !== "undefined") {
  var element$1 = document.documentElement;
  if (!("onmouseenter" in element$1)) {
    filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
  }
}

function filterContextListener(listener, index, group) {
  listener = contextListener(listener, index, group);
  return function(event) {
    var related = event.relatedTarget;
    if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
      listener.call(this, event);
    }
  };
}

function contextListener(listener, index, group) {
  return function(event1) {
    var event0 = event; // Events can be reentrant (e.g., focus).
    event = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      event = event0;
    }
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var this$1 = this;

    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this$1.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, capture) {
  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
  return function(d, i, group) {
    var this$1 = this;

    var on = this.__on, o, listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this$1.removeEventListener(o.type, o.listener, o.capture);
        this$1.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

function selection_on(typename, value, capture) {
  var this$1 = this;

  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) this$1.each(on(typenames[i], value, capture));
  return this;
}

function none() {}

function selector(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}

function selection_select(select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection(subgroups, this._parents);
}

function empty() {
  return [];
}

function selectorAll(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}

function selection_selectAll(select) {
  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection(subgroups, parents);
}

function selection_filter(match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection(subgroups, this._parents);
}

function sparse(update) {
  return new Array(update.length);
}

function selection_enter() {
  return new Selection(this._enter || this._groups.map(sparse), this._parents);
}

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

function constant(x) {
  return function() {
    return x;
  };
}

var keyPrefix = "$"; // Protect against keys like “__proto__”.

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
      exit[i] = node;
    }
  }
}

function selection_data(value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function(d) { data[++j] = d; });
    return data;
  }

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

function selection_exit() {
  return new Selection(this._exit || this._groups.map(sparse), this._parents);
}

function selection_merge(selection) {

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection(merges, this._parents);
}

function selection_order() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
}

function selection_sort(compare) {
  if (!compare) compare = ascending;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection(sortgroups, this._parents).order();
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function selection_call() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

function selection_nodes() {
  var nodes = new Array(this.size()), i = -1;
  this.each(function() { nodes[++i] = this; });
  return nodes;
}

function selection_node() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
}

function selection_size() {
  var size = 0;
  this.each(function() { ++size; });
  return size;
}

function selection_empty() {
  return !this.node();
}

function selection_each(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
}

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

function selection_attr(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)
      : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
}

function window$1(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
}

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

function selection_style(name, value, priority) {
  var node;
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove : typeof value === "function"
            ? styleFunction
            : styleConstant)(name, value, priority == null ? "" : priority))
      : window$1(node = this.node())
          .getComputedStyle(node, null)
          .getPropertyValue(name);
}

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

function selection_property(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
}

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

function selection_classed(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
}

function textRemove() {
  this.textContent = "";
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

function selection_text(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction
          : textConstant)(value))
      : this.node().textContent;
}

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

function selection_html(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
}

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

function selection_raise() {
  return this.each(raise);
}

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

function selection_lower() {
  return this.each(lower);
}

function selection_append(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}

function constantNull() {
  return null;
}

function selection_insert(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

function selection_remove() {
  return this.each(remove);
}

function selection_datum(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
}

function dispatchEvent(node, type, params) {
  var window = window$1(node),
      event = window.CustomEvent;

  if (event) {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

function selection_dispatch(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
}

var root = [null];

function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection([[document.documentElement]], root);
}

Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  merge: selection_merge,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch
};

function select(selector) {
  return typeof selector === "string"
      ? new Selection([[document.querySelector(selector)]], [document.documentElement])
      : new Selection([[selector]], root);
}

function ascending$1(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function bisector(compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

function ascendingComparator(f) {
  return function(d, x) {
    return ascending$1(f(d), x);
  };
}

var ascendingBisect = bisector(ascending$1);
var bisectRight = ascendingBisect.right;

function sequence(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
}

var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);
function ticks(start, stop, count) {
  var step = tickStep(start, stop, count);
  return sequence(
    Math.ceil(start / step) * step,
    Math.floor(stop / step) * step + step / 2, // inclusive
    step
  );
}

function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
  if (error >= e10) step1 *= 10;
  else if (error >= e5) step1 *= 5;
  else if (error >= e2) step1 *= 2;
  return stop < start ? -step1 : step1;
}

function max(array, f) {
  var i = -1,
      n = array.length,
      a,
      b;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = array[i]) != null && b > a) a = b;
  }

  else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = f(array[i], i, array)) != null && b > a) a = b;
  }

  return a;
}

function min(array, f) {
  var i = -1,
      n = array.length,
      a,
      b;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = array[i]) != null && a > b) a = b;
  }

  else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = f(array[i], i, array)) != null && a > b) a = b;
  }

  return a;
}

var array$1 = Array.prototype;

var map$2 = array$1.map;
var slice$1 = array$1.slice;

function define$1(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3 = /^#([0-9a-f]{3})$/;
var reHex6 = /^#([0-9a-f]{6})$/;
var reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$");
var reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$");
var reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$");
var reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$");
var reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$");
var reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");
var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define$1(Color, color, {
  displayable: function() {
    return this.rgb().displayable();
  },
  toString: function() {
    return this.rgb() + "";
  }
});

function color(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
      : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format])
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function colorRgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define$1(Rgb, colorRgb, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function() {
    return this;
  },
  displayable: function() {
    return (0 <= this.r && this.r <= 255)
        && (0 <= this.g && this.g <= 255)
        && (0 <= this.b && this.b <= 255)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  toString: function() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(")
        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
        + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function colorHsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$1(Hsl, colorHsl, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  displayable: function() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var deg2rad = Math.PI / 180;
var rad2deg = 180 / Math.PI;

var Kn = 18;
var Xn = 0.950470;
var Yn = 1;
var Zn = 1.088830;
var t0 = 4 / 29;
var t1 = 6 / 29;
var t2 = 3 * t1 * t1;
var t3 = t1 * t1 * t1;
function labConvert(o) {
  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl) {
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var b = rgb2xyz(o.r),
      a = rgb2xyz(o.g),
      l = rgb2xyz(o.b),
      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
}

function Lab(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define$1(Lab, lab, extend(Color, {
  brighter: function(k) {
    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function(k) {
    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Rgb(
      xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
      xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
      xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
      this.opacity
    );
  }
}));

function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}

function xyz2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert(o) {
  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab)) o = labConvert(o);
  var h = Math.atan2(o.b, o.a) * rad2deg;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function colorHcl(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define$1(Hcl, colorHcl, extend(Color, {
  brighter: function(k) {
    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
  },
  darker: function(k) {
    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
  },
  rgb: function() {
    return labConvert(this).rgb();
  }
}));

var A = -0.14861;
var B = +1.78277;
var C = -0.29227;
var D = -0.90649;
var E = +1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C - D * A;
function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
      bl = b - l,
      k = (E * (g - l) - C * bl) / D,
      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
      h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$1(Cubehelix, cubehelix, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb(
      255 * (l + a * (A * cosh + B * sinh)),
      255 * (l + a * (C * cosh + D * sinh)),
      255 * (l + a * (E * cosh)),
      this.opacity
    );
  }
}));

function constant$2(x) {
  return function() {
    return x;
  };
}

function linear$1(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function hue(a, b) {
  var d = b - a;
  return d ? linear$1(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$2(isNaN(a) ? b : a);
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear$1(a, d) : constant$2(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color = gamma(y);

  function rgb(start, end) {
    var r = color((start = colorRgb(start)).r, (end = colorRgb(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = color(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb.gamma = rgbGamma;

  return rgb;
})(1);

function array$2(a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) x[i] = interpolateValue(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];

  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
}

function date(a, b) {
  var d = new Date;
  return a = +a, b -= a, function(t) {
    return d.setTime(a + b * t), d;
  };
}

function interpolateNumber(a, b) {
  return a = +a, b -= a, function(t) {
    return a + b * t;
  };
}

function object(a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolateValue(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

function interpolateString(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

function interpolateValue(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant$2(b)
      : (t === "number" ? interpolateNumber
      : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
      : b instanceof color ? interpolateRgb
      : b instanceof Date ? date
      : Array.isArray(b) ? array$2
      : isNaN(b) ? object
      : interpolateNumber)(a, b);
}

function interpolateRound(a, b) {
  return a = +a, b -= a, function(t) {
    return Math.round(a + b * t);
  };
}

var degrees = 180 / Math.PI;

var identity$2 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

function decompose(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
}

var cssNode;
var cssRoot;
var cssView;
var svgNode;
function parseCss(value) {
  if (value === "none") return identity$2;
  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
  cssNode.style.transform = value;
  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
  cssRoot.removeChild(cssNode);
  value = value.slice(7, -1).split(",");
  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
}

function parseSvg(value) {
  if (value == null) return identity$2;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$2;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function(a, b) {
    var s = [], // string constants and placeholders
        q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}

var interpolateTransform$1 = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransform$2 = interpolateTransform(parseSvg, ", ", ")", ")");

function cubehelix$1(hue) {
  return (function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$(start, end) {
      var h = hue((start = cubehelix(start)).h, (end = cubehelix(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$.gamma = cubehelixGamma;

    return cubehelix$$;
  })(1);
}

cubehelix$1(hue);
var interpolateCubehelixLong = cubehelix$1(nogamma);

function constant$3(x) {
  return function() {
    return x;
  };
}

function number$1(x) {
  return +x;
}

var unit = [0, 1];

function deinterpolate(a, b) {
  return (b -= (a = +a))
      ? function(x) { return (x - a) / b; }
      : constant$3(b);
}

function deinterpolateClamp(deinterpolate) {
  return function(a, b) {
    var d = deinterpolate(a = +a, b = +b);
    return function(x) { return x <= a ? 0 : x >= b ? 1 : d(x); };
  };
}

function reinterpolateClamp(reinterpolate) {
  return function(a, b) {
    var r = reinterpolate(a = +a, b = +b);
    return function(t) { return t <= 0 ? a : t >= 1 ? b : r(t); };
  };
}

function bimap(domain, range, deinterpolate, reinterpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0);
  else d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1);
  return function(x) { return r0(d0(x)); };
}

function polymap(domain, range, deinterpolate, reinterpolate) {
  var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++i < j) {
    d[i] = deinterpolate(domain[i], domain[i + 1]);
    r[i] = reinterpolate(range[i], range[i + 1]);
  }

  return function(x) {
    var i = bisectRight(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy(source, target) {
  return target
      .domain(source.domain())
      .range(source.range())
      .interpolate(source.interpolate())
      .clamp(source.clamp());
}

// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
function continuous(deinterpolate$$, reinterpolate) {
  var domain = unit,
      range = unit,
      interpolate = interpolateValue,
      clamp = false,
      piecewise,
      output,
      input;

  function rescale() {
    piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return (output || (output = piecewise(domain, range, clamp ? deinterpolateClamp(deinterpolate$$) : deinterpolate$$, interpolate)))(+x);
  }

  scale.invert = function(y) {
    return (input || (input = piecewise(range, domain, deinterpolate, clamp ? reinterpolateClamp(reinterpolate) : reinterpolate)))(+y);
  };

  scale.domain = function(_) {
    return arguments.length ? (domain = map$2.call(_, number$1), rescale()) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = slice$1.call(_), interpolate = interpolateRound, rescale();
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = !!_, rescale()) : clamp;
  };

  scale.interpolate = function(_) {
    return arguments.length ? (interpolate = _, rescale()) : interpolate;
  };

  return rescale();
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimal(1.23) returns ["123", 0].
function formatDecimal(x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i, coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
}

function exponent(x) {
  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
}

function formatGroup(grouping, thousands) {
  return function(value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
}

function formatDefault(x, p) {
  x = x.toPrecision(p);

  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (x[i]) {
      case ".": i0 = i1 = i; break;
      case "0": if (i0 === 0) i0 = i; i1 = i; break;
      case "e": break out;
      default: if (i0 > 0) i0 = 0; break;
    }
  }

  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
}

var prefixExponent;

function formatPrefixAuto(x, p) {
  var d = formatDecimal(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
      n = coefficient.length;
  return i === n ? coefficient
      : i > n ? coefficient + new Array(i - n + 1).join("0")
      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
}

function formatRounded(x, p) {
  var d = formatDecimal(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

var formatTypes = {
  "": formatDefault,
  "%": function(x, p) { return (x * 100).toFixed(p); },
  "b": function(x) { return Math.round(x).toString(2); },
  "c": function(x) { return x + ""; },
  "d": function(x) { return Math.round(x).toString(10); },
  "e": function(x, p) { return x.toExponential(p); },
  "f": function(x, p) { return x.toFixed(p); },
  "g": function(x, p) { return x.toPrecision(p); },
  "o": function(x) { return Math.round(x).toString(8); },
  "p": function(x, p) { return formatRounded(x * 100, p); },
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
  "x": function(x) { return Math.round(x).toString(16); }
};

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

function formatSpecifier(specifier) {
  return new FormatSpecifier(specifier);
}

function FormatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

  var match,
      fill = match[1] || " ",
      align = match[2] || ">",
      sign = match[3] || "-",
      symbol = match[4] || "",
      zero = !!match[5],
      width = match[6] && +match[6],
      comma = !!match[7],
      precision = match[8] && +match[8].slice(1),
      type = match[9] || "";

  // The "n" type is an alias for ",g".
  if (type === "n") comma = true, type = "g";

  // Map invalid types to the default format.
  else if (!formatTypes[type]) type = "";

  // If zero fill is specified, padding goes after sign and before digits.
  if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

  this.fill = fill;
  this.align = align;
  this.sign = sign;
  this.symbol = symbol;
  this.zero = zero;
  this.width = width;
  this.comma = comma;
  this.precision = precision;
  this.type = type;
}

FormatSpecifier.prototype.toString = function() {
  return this.fill
      + this.align
      + this.sign
      + this.symbol
      + (this.zero ? "0" : "")
      + (this.width == null ? "" : Math.max(1, this.width | 0))
      + (this.comma ? "," : "")
      + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
      + this.type;
};

var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

function identity$3(x) {
  return x;
}

function formatLocale(locale) {
  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$3,
      currency = locale.currency,
      decimal = locale.decimal;

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        type = specifier.type;

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = !type || /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision == null ? (type ? 6 : 12)
        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i, n, c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Convert negative to positive, and compute the prefix.
        // Note that -0 is not less than 0, but 1 / -0 is!
        var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

        // Perform the initial formatting.
        value = formatType(value, precision);

        // If the original value was negative, it may be rounded to zero during
        // formatting; treat this as (positive) zero.
        if (valueNegative) {
          i = -1, n = value.length;
          valueNegative = false;
          while (++i < n) {
            if (c = value.charCodeAt(i), (48 < c && c < 58)
                || (type === "x" && 96 < c && c < 103)
                || (type === "X" && 64 < c && c < 71)) {
              valueNegative = true;
              break;
            }
          }
        }

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<": return valuePrefix + value + valueSuffix + padding;
        case "=": return valuePrefix + padding + value + valueSuffix;
        case "^": return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
      }
      return padding + valuePrefix + value + valueSuffix;
    }

    format.toString = function() {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function(value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
}

var locale;
var format;
var formatPrefix;

defaultLocale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale(definition) {
  locale = formatLocale(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}

function precisionFixed(step) {
  return Math.max(0, -exponent(Math.abs(step)));
}

function precisionPrefix(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
}

function precisionRound(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent(max) - exponent(step)) + 1;
}

function tickFormat(domain, count, specifier) {
  var start = domain[0],
      stop = domain[domain.length - 1],
      step = tickStep(start, stop, count == null ? 10 : count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function(count, specifier) {
    return tickFormat(domain(), count, specifier);
  };

  scale.nice = function(count) {
    var d = domain(),
        i = d.length - 1,
        n = count == null ? 10 : count,
        start = d[0],
        stop = d[i],
        step = tickStep(start, stop, n);

    if (step) {
      step = tickStep(Math.floor(start / step) * step, Math.ceil(stop / step) * step, n);
      d[0] = Math.floor(start / step) * step;
      d[i] = Math.ceil(stop / step) * step;
      domain(d);
    }

    return scale;
  };

  return scale;
}

function linear() {
  var scale = continuous(deinterpolate, interpolateNumber);

  scale.copy = function() {
    return copy(scale, linear());
  };

  return linearish(scale);
}

function nice(domain, interval) {
  domain = domain.slice();

  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      t;

  if (x1 < x0) {
    t = i0, i0 = i1, i1 = t;
    t = x0, x0 = x1, x1 = t;
  }

  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
}

function deinterpolate$1(a, b) {
  return (b = Math.log(b / a))
      ? function(x) { return Math.log(x / a) / b; }
      : constant$3(b);
}

function reinterpolate(a, b) {
  return a < 0
      ? function(t) { return -Math.pow(-b, t) * Math.pow(-a, 1 - t); }
      : function(t) { return Math.pow(b, t) * Math.pow(a, 1 - t); };
}

function pow10(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
}

function powp(base) {
  return base === 10 ? pow10
      : base === Math.E ? Math.exp
      : function(x) { return Math.pow(base, x); };
}

function logp(base) {
  return base === Math.E ? Math.log
      : base === 10 && Math.log10
      || base === 2 && Math.log2
      || (base = Math.log(base), function(x) { return Math.log(x) / base; });
}

function reflect(f) {
  return function(x) {
    return -f(-x);
  };
}

function log() {
  var scale = continuous(deinterpolate$1, reinterpolate).domain([1, 10]),
      domain = scale.domain,
      base = 10,
      logs = logp(10),
      pows = powp(10);

  function rescale() {
    logs = logp(base), pows = powp(base);
    if (domain()[0] < 0) logs = reflect(logs), pows = reflect(pows);
    return scale;
  }

  scale.base = function(_) {
    return arguments.length ? (base = +_, rescale()) : base;
  };

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.ticks = function(count) {
    var d = domain(),
        u = d[0],
        v = d[d.length - 1],
        r;

    if (r = v < u) i = u, u = v, v = i;

    var i = logs(u),
        j = logs(v),
        p,
        k,
        t,
        n = count == null ? 10 : +count,
        z = [];

    if (!(base % 1) && j - i < n) {
      i = Math.round(i) - 1, j = Math.round(j) + 1;
      if (u > 0) for (; i < j; ++i) {
        for (k = 1, p = pows(i); k < base; ++k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      } else for (; i < j; ++i) {
        for (k = base - 1, p = pows(i); k >= 1; --k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      }
    } else {
      z = ticks(i, j, Math.min(j - i, n)).map(pows);
    }

    return r ? z.reverse() : z;
  };

  scale.tickFormat = function(count, specifier) {
    if (specifier == null) specifier = base === 10 ? ".0e" : ",";
    if (typeof specifier !== "function") specifier = format(specifier);
    if (count === Infinity) return specifier;
    if (count == null) count = 10;
    var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
    return function(d) {
      var i = d / pows(Math.round(logs(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k ? specifier(d) : "";
    };
  };

  scale.nice = function() {
    return domain(nice(domain(), {
      floor: function(x) { return pows(Math.floor(logs(x))); },
      ceil: function(x) { return pows(Math.ceil(logs(x))); }
    }));
  };

  scale.copy = function() {
    return copy(scale, log().base(base));
  };

  return scale;
}

var t0$1 = new Date;
var t1$1 = new Date;
function newInterval(floori, offseti, count, field) {

  function interval(date) {
    return floori(date = new Date(+date)), date;
  }

  interval.floor = interval;

  interval.ceil = function(date) {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };

  interval.round = function(date) {
    var d0 = interval(date),
        d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };

  interval.offset = function(date, step) {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };

  interval.range = function(start, stop, step) {
    var range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    do range.push(new Date(+start)); while (offseti(start, step), floori(start), start < stop)
    return range;
  };

  interval.filter = function(test) {
    return newInterval(function(date) {
      if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
    }, function(date, step) {
      if (date >= date) while (--step >= 0) while (offseti(date, 1), !test(date)) {} // eslint-disable-line no-empty
    });
  };

  if (count) {
    interval.count = function(start, end) {
      t0$1.setTime(+start), t1$1.setTime(+end);
      floori(t0$1), floori(t1$1);
      return Math.floor(count(t0$1, t1$1));
    };

    interval.every = function(step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null
          : !(step > 1) ? interval
          : interval.filter(field
              ? function(d) { return field(d) % step === 0; }
              : function(d) { return interval.count(0, d) % step === 0; });
    };
  }

  return interval;
}

var millisecond = newInterval(function() {
  // noop
}, function(date, step) {
  date.setTime(+date + step);
}, function(start, end) {
  return end - start;
});

// An optimized implementation for this simple case.
millisecond.every = function(k) {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) return null;
  if (!(k > 1)) return millisecond;
  return newInterval(function(date) {
    date.setTime(Math.floor(date / k) * k);
  }, function(date, step) {
    date.setTime(+date + step * k);
  }, function(start, end) {
    return (end - start) / k;
  });
};

var durationSecond$1 = 1e3;
var durationMinute$1 = 6e4;
var durationHour$1 = 36e5;
var durationDay$1 = 864e5;
var durationWeek$1 = 6048e5;

var second = newInterval(function(date) {
  date.setTime(Math.floor(date / durationSecond$1) * durationSecond$1);
}, function(date, step) {
  date.setTime(+date + step * durationSecond$1);
}, function(start, end) {
  return (end - start) / durationSecond$1;
}, function(date) {
  return date.getUTCSeconds();
});

var minute = newInterval(function(date) {
  date.setTime(Math.floor(date / durationMinute$1) * durationMinute$1);
}, function(date, step) {
  date.setTime(+date + step * durationMinute$1);
}, function(start, end) {
  return (end - start) / durationMinute$1;
}, function(date) {
  return date.getMinutes();
});

var hour = newInterval(function(date) {
  var offset = date.getTimezoneOffset() * durationMinute$1 % durationHour$1;
  if (offset < 0) offset += durationHour$1;
  date.setTime(Math.floor((+date - offset) / durationHour$1) * durationHour$1 + offset);
}, function(date, step) {
  date.setTime(+date + step * durationHour$1);
}, function(start, end) {
  return (end - start) / durationHour$1;
}, function(date) {
  return date.getHours();
});

var day = newInterval(function(date) {
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setDate(date.getDate() + step);
}, function(start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationDay$1;
}, function(date) {
  return date.getDate() - 1;
});

function weekday(i) {
  return newInterval(function(date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationWeek$1;
  });
}

var timeSunday = weekday(0);
var timeMonday = weekday(1);

var month = newInterval(function(date) {
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setMonth(date.getMonth() + step);
}, function(start, end) {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, function(date) {
  return date.getMonth();
});

var year = newInterval(function(date) {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setFullYear(date.getFullYear() + step);
}, function(start, end) {
  return end.getFullYear() - start.getFullYear();
}, function(date) {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
year.every = function(k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step * k);
  });
};

var utcMinute = newInterval(function(date) {
  date.setUTCSeconds(0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationMinute$1);
}, function(start, end) {
  return (end - start) / durationMinute$1;
}, function(date) {
  return date.getUTCMinutes();
});

var utcHour = newInterval(function(date) {
  date.setUTCMinutes(0, 0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationHour$1);
}, function(start, end) {
  return (end - start) / durationHour$1;
}, function(date) {
  return date.getUTCHours();
});

var utcDay = newInterval(function(date) {
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function(start, end) {
  return (end - start) / durationDay$1;
}, function(date) {
  return date.getUTCDate() - 1;
});

function utcWeekday(i) {
  return newInterval(function(date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function(start, end) {
    return (end - start) / durationWeek$1;
  });
}

var utcWeek = utcWeekday(0);
var utcMonday = utcWeekday(1);

var utcMonth = newInterval(function(date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function(start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function(date) {
  return date.getUTCMonth();
});

var utcYear = newInterval(function(date) {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, function(start, end) {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, function(date) {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
utcYear.every = function(k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};

function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}

function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}

function newYear(y) {
  return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
}

function formatLocale$1(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  var periodRe = formatRe(locale_periods),
      periodLookup = formatLookup(locale_periods),
      weekdayRe = formatRe(locale_weekdays),
      weekdayLookup = formatLookup(locale_weekdays),
      shortWeekdayRe = formatRe(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
      monthRe = formatRe(locale_months),
      monthLookup = formatLookup(locale_months),
      shortMonthRe = formatRe(locale_shortMonths),
      shortMonthLookup = formatLookup(locale_shortMonths);

  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "S": formatSeconds,
    "U": formatWeekNumberSunday,
    "w": formatWeekdayNumber,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };

  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "S": formatUTCSeconds,
    "U": formatUTCWeekNumberSunday,
    "w": formatUTCWeekdayNumber,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };

  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "S": parseSeconds,
    "U": parseWeekNumberSunday,
    "w": parseWeekdayNumber,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);

  function newFormat(specifier, formats) {
    return function(date) {
      var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

      if (!(date instanceof Date)) date = new Date(+date);

      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
          else pad = c === "e" ? " " : "0";
          if (format = formats[c]) c = format(date, pad);
          string.push(c);
          j = i + 1;
        }
      }

      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }

  function newParse(specifier, newDate) {
    return function(string) {
      var d = newYear(1900),
          i = parseSpecifier(d, specifier, string += "", 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // Convert day-of-week and week-of-year to day-of-year.
      if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "W" in d ? 1 : 0;
        var day = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }

      // Otherwise, all fields are in local time.
      return newDate(d);
    };
  }

  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

    while (i < n) {
      if (j >= m) return -1;
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads ? specifier.charAt(i++) : c];
        if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }

    return j;
  }

  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }

  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }

  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }

  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }

  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }

  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }

  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }

  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }

  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }

  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }

  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }

  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }

  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }

  return {
    format: function(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function() { return specifier; };
      return f;
    },
    parse: function(specifier) {
      var p = newParse(specifier += "", localDate);
      p.toString = function() { return specifier; };
      return p;
    },
    utcFormat: function(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function() { return specifier; };
      return f;
    },
    utcParse: function(specifier) {
      var p = newParse(specifier, utcDate);
      p.toString = function() { return specifier; };
      return p;
    }
  };
}

var pads = {"-": "", "_": " ", "0": "0"};
var numberRe = /^\s*\d+/;
var percentRe = /^%/;
var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
function pad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function requote(s) {
  return s.replace(requoteRe, "\\$&");
}

function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}

function formatLookup(names) {
  var map = {}, i = -1, n = names.length;
  while (++i < n) map[names[i].toLowerCase()] = i;
  return map;
}

function parseWeekdayNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}

function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}

function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}

function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}

function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}

function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}

function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}

function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}

function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}

function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}

function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}

function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function formatDayOfMonth(d, p) {
  return pad(d.getDate(), p, 2);
}

function formatHour24(d, p) {
  return pad(d.getHours(), p, 2);
}

function formatHour12(d, p) {
  return pad(d.getHours() % 12 || 12, p, 2);
}

function formatDayOfYear(d, p) {
  return pad(1 + day.count(year(d), d), p, 3);
}

function formatMilliseconds(d, p) {
  return pad(d.getMilliseconds(), p, 3);
}

function formatMonthNumber(d, p) {
  return pad(d.getMonth() + 1, p, 2);
}

function formatMinutes(d, p) {
  return pad(d.getMinutes(), p, 2);
}

function formatSeconds(d, p) {
  return pad(d.getSeconds(), p, 2);
}

function formatWeekNumberSunday(d, p) {
  return pad(timeSunday.count(year(d), d), p, 2);
}

function formatWeekdayNumber(d) {
  return d.getDay();
}

function formatWeekNumberMonday(d, p) {
  return pad(timeMonday.count(year(d), d), p, 2);
}

function formatYear(d, p) {
  return pad(d.getFullYear() % 100, p, 2);
}

function formatFullYear(d, p) {
  return pad(d.getFullYear() % 10000, p, 4);
}

function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+"))
      + pad(z / 60 | 0, "0", 2)
      + pad(z % 60, "0", 2);
}

function formatUTCDayOfMonth(d, p) {
  return pad(d.getUTCDate(), p, 2);
}

function formatUTCHour24(d, p) {
  return pad(d.getUTCHours(), p, 2);
}

function formatUTCHour12(d, p) {
  return pad(d.getUTCHours() % 12 || 12, p, 2);
}

function formatUTCDayOfYear(d, p) {
  return pad(1 + utcDay.count(utcYear(d), d), p, 3);
}

function formatUTCMilliseconds(d, p) {
  return pad(d.getUTCMilliseconds(), p, 3);
}

function formatUTCMonthNumber(d, p) {
  return pad(d.getUTCMonth() + 1, p, 2);
}

function formatUTCMinutes(d, p) {
  return pad(d.getUTCMinutes(), p, 2);
}

function formatUTCSeconds(d, p) {
  return pad(d.getUTCSeconds(), p, 2);
}

function formatUTCWeekNumberSunday(d, p) {
  return pad(utcWeek.count(utcYear(d), d), p, 2);
}

function formatUTCWeekdayNumber(d) {
  return d.getUTCDay();
}

function formatUTCWeekNumberMonday(d, p) {
  return pad(utcMonday.count(utcYear(d), d), p, 2);
}

function formatUTCYear(d, p) {
  return pad(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCFullYear(d, p) {
  return pad(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCZone() {
  return "+0000";
}

function formatLiteralPercent() {
  return "%";
}

var locale$1;
var timeFormat;
var timeParse;
var utcFormat;
var utcParse;

defaultLocale$1({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale$1(definition) {
  locale$1 = formatLocale$1(definition);
  timeFormat = locale$1.format;
  timeParse = locale$1.parse;
  utcFormat = locale$1.utcFormat;
  utcParse = locale$1.utcParse;
  return locale$1;
}

var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

function formatIsoNative(date) {
  return date.toISOString();
}

var formatIso = Date.prototype.toISOString
    ? formatIsoNative
    : utcFormat(isoSpecifier);

function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}

var parseIso = +new Date("2000-01-01T00:00:00.000Z")
    ? parseIsoNative
    : utcParse(isoSpecifier);

function colors$1(s) {
  return s.match(/.{6}/g).map(function(x) {
    return "#" + x;
  });
}

colors$1("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

colors$1("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

colors$1("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

colors$1("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

interpolateCubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

var warm = interpolateCubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var cool = interpolateCubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var rainbow = cubehelix();

function ramp(range) {
  var n = range.length;
  return function(t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

ramp(colors$1("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

var magma = ramp(colors$1("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

var inferno = ramp(colors$1("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

var plasma = ramp(colors$1("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

var slice$2 = Array.prototype.slice;

function identity$4(x) {
  return x;
}

var top = 1;
var right = 2;
var bottom = 3;
var left = 4;
var epsilon = 1e-6;
function translateX(scale0, scale1, d) {
  var x = scale0(d);
  return "translate(" + (isFinite(x) ? x : scale1(d)) + ",0)";
}

function translateY(scale0, scale1, d) {
  var y = scale0(d);
  return "translate(0," + (isFinite(y) ? y : scale1(d)) + ")";
}

function center(scale) {
  var offset = scale.bandwidth() / 2;
  if (scale.round()) offset = Math.round(offset);
  return function(d) {
    return scale(d) + offset;
  };
}

function entering() {
  return !this.__axis;
}

function axis(orient, scale) {
  var tickArguments = [],
      tickValues = null,
      tickFormat = null,
      tickSizeInner = 6,
      tickSizeOuter = 6,
      tickPadding = 3;

  function axis(context) {
    var values = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) : tickValues,
        format = tickFormat == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity$4) : tickFormat,
        spacing = Math.max(tickSizeInner, 0) + tickPadding,
        transform = orient === top || orient === bottom ? translateX : translateY,
        range = scale.range(),
        range0 = range[0] + 0.5,
        range1 = range[range.length - 1] + 0.5,
        position = (scale.bandwidth ? center : identity$4)(scale.copy()),
        selection = context.selection ? context.selection() : context,
        path = selection.selectAll(".domain").data([null]),
        tick = selection.selectAll(".tick").data(values, scale).order(),
        tickExit = tick.exit(),
        tickEnter = tick.enter().append("g").attr("class", "tick"),
        line = tick.select("line"),
        text = tick.select("text"),
        k = orient === top || orient === left ? -1 : 1,
        x, y = orient === left || orient === right ? (x = "x", "y") : (x = "y", "x");

    path = path.merge(path.enter().insert("path", ".tick")
        .attr("class", "domain")
        .attr("stroke", "#000"));

    tick = tick.merge(tickEnter);

    line = line.merge(tickEnter.append("line")
        .attr("stroke", "#000")
        .attr(x + "2", k * tickSizeInner)
        .attr(y + "1", 0.5)
        .attr(y + "2", 0.5));

    text = text.merge(tickEnter.append("text")
        .attr("fill", "#000")
        .attr(x, k * spacing)
        .attr(y, 0.5)
        .attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));

    if (context !== selection) {
      path = path.transition(context);
      tick = tick.transition(context);
      line = line.transition(context);
      text = text.transition(context);

      tickExit = tickExit.transition(context)
          .attr("opacity", epsilon)
          .attr("transform", function(d) { return transform(position, this.parentNode.__axis || position, d); });

      tickEnter
          .attr("opacity", epsilon)
          .attr("transform", function(d) { return transform(this.parentNode.__axis || position, position, d); });
    }

    tickExit.remove();

    path
        .attr("d", orient === left || orient == right
            ? "M" + k * tickSizeOuter + "," + range0 + "H0.5V" + range1 + "H" + k * tickSizeOuter
            : "M" + range0 + "," + k * tickSizeOuter + "V0.5H" + range1 + "V" + k * tickSizeOuter);

    tick
        .attr("opacity", 1)
        .attr("transform", function(d) { return transform(position, position, d); });

    line
        .attr(x + "2", k * tickSizeInner);

    text
        .attr(x, k * spacing)
        .text(format);

    selection.filter(entering)
        .attr("fill", "none")
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");

    selection
        .each(function() { this.__axis = position; });
  }

  axis.scale = function(_) {
    return arguments.length ? (scale = _, axis) : scale;
  };

  axis.ticks = function() {
    return tickArguments = slice$2.call(arguments), axis;
  };

  axis.tickArguments = function(_) {
    return arguments.length ? (tickArguments = _ == null ? [] : slice$2.call(_), axis) : tickArguments.slice();
  };

  axis.tickValues = function(_) {
    return arguments.length ? (tickValues = _ == null ? null : slice$2.call(_), axis) : tickValues && tickValues.slice();
  };

  axis.tickFormat = function(_) {
    return arguments.length ? (tickFormat = _, axis) : tickFormat;
  };

  axis.tickSize = function(_) {
    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
  };

  axis.tickSizeInner = function(_) {
    return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
  };

  axis.tickSizeOuter = function(_) {
    return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
  };

  axis.tickPadding = function(_) {
    return arguments.length ? (tickPadding = +_, axis) : tickPadding;
  };

  return axis;
}

function axisTop(scale) {
  return axis(top, scale);
}

function axisRight(scale) {
  return axis(right, scale);
}

function axisBottom(scale) {
  return axis(bottom, scale);
}

function axisLeft(scale) {
  return axis(left, scale);
}

function svg(id) {
  
  var width = 300,
      height = 150,
      top = 16,
      right = 16,
      bottom = 16,
      left = 16,
      scale = 1,
      inner = 'g.svg-child',
      innerWidth = -1,
      innerHeight = -1,
      style = null,
      background = null,
      title = null,
      desc = null,
      role = 'img',
      classed = 'svg-svg';

  function _updateInnerWidth() {
      innerWidth = width - left - right;
  }    
  
  function _updateInnerHeight() {
      innerHeight = height - top - bottom;
  }   
  
  _updateInnerWidth();
  _updateInnerHeight();
        
  function _impl(context) {
    var selection = context.selection ? context.selection() : context,
        transition = (context.selection !== undefined);

    selection.each(function() {
      var parent = select(this);

      var el = parent.select(_impl.self());
      if (el.empty()) {
        var ariaTitle = (id == null ? '' : id + '-') + 'title';
        var ariaDesc = (id == null ? '' : id + '-') + 'desc';   
        el = parent.append('svg')
                    .attr('version', '1.1')
                    .attr('xmlns', 'http://www.w3.org/2000/svg')
                    .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink') // d3 work around for xlink not required as per D3 4.0
                    .attr('preserveAspectRatio', 'xMidYMid meet')
                    .attr('aria-labelledby', ariaTitle)
                    .attr('aria-describedby', ariaDesc)
                    .attr('id', id);
                    
        el.append('title').attr('id', ariaTitle);        
        el.append('desc').attr('id', ariaDesc);      
        el.append('defs');
        el.append('rect').attr('class', 'background');
        el.append('g').attr('class', 'svg-child');
      }
      
      var defsEl = el.select('defs');
      
      var styleEl = defsEl.selectAll('style').data(style ? [ style ] : []);
      styleEl.exit().remove();
      styleEl = styleEl.enter().append('style').attr('type', 'text/css').merge(styleEl);
      styleEl.text(style);
      
      el.attr('role', role);
      
      el.select('title').text(title);
      el.select('desc').text(desc);
            
      var rect = el.select('rect.background')
                  .attr('width', background != null ? width * scale : null)
                  .attr('height', background != null ? height * scale : null);      
            
      // Never transition
      el.attr('class', classed)

      var g = el.select(_impl.child());
            
      if (transition === true) {
        el = el.transition(context);
        g = g.transition(context);
        rect = rect.transition(context);
      }     

      // Transition if enabled
      el.attr('width', width * scale)
        .attr('height', height * scale)
        .attr('viewBox', '0 0 ' + width + ' ' + height);
    
      g.attr('transform', 'translate(' + left + ',' + top + ')');

      rect.attr('fill', background);

    });
  }

  _impl.self = function() { return 'svg' + (id ?  '#' + id : ''); }
  _impl.child = function() { return inner; }
  _impl.childDefs = function() { return 'defs'; }
  _impl.childWidth = function() { return innerWidth; }
  _impl.childHeight = function() { return innerHeight; }

  _impl.id = function() {
    return id;
  };
    
  _impl.classed = function(value) {
    return arguments.length ? (classed = value, _impl) : classed;
  };

  _impl.style = function(value) {
    return arguments.length ? (style = value, _impl) : style;
  };

  _impl.background = function(value) {
    return arguments.length ? (background = value, _impl) : background;
  };
    
  _impl.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    _updateInnerWidth();
    return _impl;
  };

  _impl.height = function(value) {
    if (!arguments.length) return width;
    height = value;
    _updateInnerHeight();
    return _impl;
  };
  
  _impl.scale = function(value) {
    return arguments.length ? (scale = value, _impl) : scale;
  };

  _impl.title = function(value) {
    return arguments.length ? (title = value, _impl) : title;
  };  

  _impl.desc = function(value) {
    return arguments.length ? (desc = value, _impl) : desc;
  };   
  
  _impl.role = function(value) {
    return arguments.length ? (role = value, _impl) : role;
  };  
   
  _impl.margin = function(value) {
    if (!arguments.length) return {
      top: top,
      right: right,
      bottom: bottom,
      left: left
    };
    if (value.top !== undefined) {
      top = value.top;
      right = value.right;
      bottom = value.bottom;
      left = value.left; 
    } else {
      top = value;
      right = value;
      bottom = value;
      left = value;
    }     
    _updateInnerWidth();
    _updateInnerHeight();
    return _impl;
  };
    
  return _impl;
}

// Informed by the Cagatay Demiralp paper, grey is moved around to break
// brown and red in this color scheme

var presentation10dark = [ 
    '#00ce5c', // Green
    '#d800a2', // Pink          
    '#00d9d2', // Aqua     
    '#AF5100', // Brown         
    '#bfbfbf', // Grey   
    '#DE0000', // Red     
    '#F0DE00', // Yellow           
    '#9200ff', // Purple      
    '#ED9200', // Orange     
    '#00aeff' // Blue 
];

var presentation10std = [ 
   
    '#56d58e', // Green
    '#d95cba', // Pink          
    '#63eae4', // Aqua     
    '#C78348', // Brown         
    '#d6d6d6', // Grey 
    '#E06363', // Red     
    '#FFF741', // Yellow           
    '#965ede', // Purple      
    '#FCBB54', // Orange  
    '#73c5eb' // Blue 
];

var presentation10light = [ 
    '#a5e6c3', // Green
    '#eda3da', // Pink          
    '#9af8f4', // Aqua     
    '#EDC19C', // Brown         
    '#e5e5e5', // Grey 
    '#F5AAAA', // Red     
    '#F7EFC3', // Yellow           
    '#c6a8ef', // Purple      
    '#F8D296', // Orange     
    '#addbf0' // Blue 
];

var names10 = {
    green:  0,
    pink:   1,
    aqua:   2,        
    brown:  3,
    grey:   4,
    red:    5,
    yellow: 6,
    purple: 7,
    orange: 8,
    blue:   9
}

var presentation10 = {
    standard: presentation10std,
    darker: presentation10dark,
    lighter: presentation10light,
    names: names10    
}

var display = { 
    light : {
        background: '#ffffff',
        text: '#262626',
        axis: '#262626',
        grid: '#e0e0e0',
        highlight: 'rgba(225,16,16,0.5)',
        lowlight: 'rgba(127,127,127,0.3)',
        shadow: 'rgba(127,127,127,0.4)',
        fillOpacity: 0.33
    },
    dark : {
        background: '#333333',    
        text: '#ffffff',
        axis: '#ffffff',
        grid: '#6d6d6d',
        highlight: 'rgba(225,16,16,0.5)',
        lowlight: 'rgba(127,127,127,0.5)',
        shadow: 'rgba(255,255,255,0.4)',
        fillOpacity: 0.33      
    }
};

var index$4 = createCommonjsModule(function (module) {
/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */

// These values are established by empiricism with tests (tradeoff: performance VS precision)
var NEWTON_ITERATIONS = 4;
var NEWTON_MIN_SLOPE = 0.001;
var SUBDIVISION_PRECISION = 0.0000001;
var SUBDIVISION_MAX_ITERATIONS = 10;

var kSplineTableSize = 11;
var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

var float32ArraySupported = typeof Float32Array === 'function';

function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
function C (aA1)      { return 3.0 * aA1; }

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

function binarySubdivide (aX, aA, aB, mX1, mX2) {
  var currentX, currentT, i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}

function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
 for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
   var currentSlope = getSlope(aGuessT, mX1, mX2);
   if (currentSlope === 0.0) {
     return aGuessT;
   }
   var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
   aGuessT -= currentX / currentSlope;
 }
 return aGuessT;
}

module.exports = function bezier (mX1, mY1, mX2, mY2) {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }

  // Precompute samples table
  var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
  if (mX1 !== mY1 || mX2 !== mY2) {
    for (var i = 0; i < kSplineTableSize; ++i) {
      sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }
  }

  function getTForX (aX) {
    var intervalStart = 0.0;
    var currentSample = 1;
    var lastSample = kSplineTableSize - 1;

    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    // Interpolate to provide an initial guess for t
    var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    var guessForT = intervalStart + dist * kSampleStepSize;

    var initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
    }
  }

  return function BezierEasing (x) {
    if (mX1 === mY1 && mX2 === mY2) {
      return x; // linear
    }
    // Because JavaScript number are imprecise, we should guarantee the extremes are right.
    if (x === 0) {
      return 0;
    }
    if (x === 1) {
      return 1;
    }
    return calcBezier(getTForX(x), mY1, mY2);
  };
};
});

// Fallback here chooses system fonts first
var systemFontFallback = "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\"";

function sizeForWidth(width) {
    if (width < 414) {
        return '12px';
    }
    return '14px';
}

var fonts = {
    fixed: {
        cssImport: "@import url(https://fonts.googleapis.com/css?family=Source+Code+Pro:300,500);",
        weightMonochrome: 300,
        weightColor: 500,
        sizeForWidth: sizeForWidth,
        family: "\"Source Code Pro\", Consolas, \"Liberation Mono\", Menlo, Courier, monospace" // Font fallback chosen to keep presentation on places like GitHub where Content Security Policy prevents inline SRC
    },
    variable: {
        cssImport: "@import url(https://fonts.googleapis.com/css?family=Raleway:400,500);",
        weightMonochrome: 400,
        weightColor: 500,
        sizeForWidth: sizeForWidth,
        family: ("\"Raleway\", \"Trebuchet MS\", " + systemFontFallback)
    },
    brand: {
        cssImport: "@import url(https://fonts.googleapis.com/css?family=Electrolize);",
        weightMonochrome: 400,
        weightColor: 400,
        sizeForWidth: sizeForWidth,
        family: ("\"Electrolize\", " + systemFontFallback)
    }
}

var DEFAULT_SIZE$1 = 270;
var DEFAULT_ASPECT$1 = 0.5;
var DEFAULT_MARGIN$1 = 12;  // white space
var DEFAULT_INSET$1 = 8;   // scale space
var DEFAULT_LEGEND_SIZE = 14;
var DEFAULT_LEGEND_RADIUS = 2;
var DEFAULT_LEGEND_TEXT_SCALE = 8.39; // hack value to do fast estimation of length of string
// TODO: estimate the M, m = 7.19 = 12
// m = 8.39  = 14
// m = 9.59 = 20

function _legends(id, makeSVG) {
  var classed = 'chart-legends', 
      theme = 'light',
      background = undefined,
      width = DEFAULT_SIZE$1,
      height = null,
      margin = DEFAULT_MARGIN$1,
      inset = DEFAULT_INSET$1,
      padding = DEFAULT_INSET$1,
      textPadding = DEFAULT_INSET$1,
      style = undefined,
      legendSize = DEFAULT_LEGEND_SIZE,
      radius = DEFAULT_LEGEND_RADIUS,
      msize = DEFAULT_LEGEND_TEXT_SCALE,
      fontSize = undefined,
      fontFill = undefined,
      orientation = 'bottom',
      fill = null,
      scale = 1.0;
 
  function _makeFillFn() {
    var colors = function () { return fill; };
    if (fill == null) {
      var c = presentation10.standard;
      colors = function (d, i) { return (c[i % c.length]); };
    } else if (typeof fill === 'function') {
      colors = fill;
    } else if (Array.isArray(fill)) {
      colors = function (d, i) { return fill[ i % fill.length ]; };
    }
    return colors;  
  }  

  function _impl(context) {
    var selection = context.selection ? context.selection() : context,
        transition = (context.selection !== undefined);
      
    var _inset = _impl.canonicalInset();
    var _style = style;
    if (_style === undefined) {
      _style = _impl.defaultStyle();
    }       
    selection.each(function() {
      var node = select(this);  
      var _height = height || Math.round(width * DEFAULT_ASPECT$1);
      
      var elmS = node,
          w = width,
          h = _height;
          
      if (makeSVG === true) {
        var _background = background;
        if (_background === undefined) {
          _background = display[theme].background;
        }
        // SVG element
        var sid = null;
        if (id) sid = 'svg-' + id;
        var root = svg(sid).width(w).height(h).margin(margin).scale(scale).style(_style).background(_background);
        var tnode = node;
        if (transition === true) {
          tnode = node.transition(context);
        }
        tnode.call(root);
        
        elmS = node.select(root.self()).select(root.child());
        w = root.childWidth();
        h = root.childHeight();
      }
      
      // Create required elements
      var g = elmS.select(_impl.self())
      if (g.empty()) {
        g = elmS.append('g').attr('class', classed).attr('id', id);
      }

      var legend = node.datum() || [];
      
      var lg = g.selectAll('g').data(legend);
      lg.exit().remove();
      var newlg = lg.enter().append('g');
      
      newlg.append('rect');
      newlg.append('text')
        .attr('dominant-baseline', 'central');
            
      var rect = g.selectAll('g rect').data(legend);
      var text = g.selectAll('g text').data(legend).text(function (d) { return d; });

      var lens = legend.map(function (d) { return d == null ?  0 : d.length * msize + legendSize + textPadding + padding; });
      
      if (orientation === 'left' || orientation === 'right') {
        var groups = g.selectAll('g').data(lens);
        groups = transition === true ? groups.transition(context) : groups;

        var idx = -1;
        var remap = legend.map(function (d) { return (d == null ? idx : ++idx); });
        groups.attr('transform', function (d, i) { return 'translate(' + 0 + ',' + (remap[i] * (legendSize + padding)) + ')'; });
      } else {
        var clens = []
        var total = lens.reduce(function (p, c) { return (clens.push(p) , p + c); }, 0) - padding; // trim the last padding
        var offset = -total / 2;
        var groups$1 = g.selectAll('g').data(clens);
        
        groups$1 = transition === true ? groups$1.transition(context) : groups$1;
        groups$1.attr('transform', function (d) { return 'translate(' + (offset + d) + ',0)'; });
      }
            
      if (transition === true) {
          g = g.transition(context);
          rect = rect.transition(context);
          text = text.transition(context);
      }      
      
      if (orientation === 'top') {
        g.attr('transform', 'translate(' + (w/2) + ',' + (_inset.top) + ')');
      } else if (orientation === 'left') {
        g.attr('transform', 'translate(' + _inset.left + ',' + ((h - legend.length * (legendSize + padding) + padding)/2) + ')');
      } else if (orientation === 'right') {
        g.attr('transform', 'translate(' + (w - _inset.right - legendSize) + ',' + ((h - legend.length * (legendSize + padding) + padding)/2) + ')');
      } else {
        g.attr('transform', 'translate(' + (w/2) + ',' + (h - _inset.bottom - legendSize) + ')');
      }

      var colors = _makeFillFn();
      
      rect.attr('rx', radius)
            .attr('ry', radius)
            .attr('width', function (d) { return d != null ? legendSize : 0; })
            .attr('height', function (d) { return d != null ? legendSize : 0; })
            .attr('fill', colors);

      text.attr('y', legendSize / 2)
          .attr('fill', fontFill === undefined ? display[theme].text : fontFill)
          .attr('font-size', fontSize === undefined ? fonts.fixed.sizeForWidth(w) : fontSize);
      if (orientation === 'right') {
        text.attr('x', function () { return -textPadding; }).attr('text-anchor', 'end');
      } else {
        text.attr('x', function () { return legendSize + textPadding; }).attr('text-anchor', 'start');
      }
      


    });
    
  }
  
  _impl.self = function() { return 'g' + (id ?  '#' + id : '.' + classed); }

  _impl.id = function() {
    return id;
  };
  
  _impl.defaultStyle = function () { return ((fonts.fixed.cssImport) + "\n                              " + (_impl.self()) + " text { \n                                font-family: " + (fonts.fixed.family) + "; \n                                font-weight: " + (fonts.fixed.weightMonochrome) + "; }\n  "); };
      
  _impl.childWidth = function() {
    var _inset = _impl.canonicalInset();
    return _inset.left + _inset.right + legendSize;
  };
  
  _impl.childHeight = function() {
    var _inset = _impl.canonicalInset();
    return _inset.top + _inset.bottom + legendSize;
  };
  
  _impl.childInset = function(inset) {
    if (inset == null) inset = 0;
    
    if (typeof inset !== 'object') {
      inset = { top: inset, left: inset, right: inset, bottom: inset };
    } else {
      inset = { top: inset.top, left: inset.left, right: inset.right, bottom: inset.bottom };
    }
    var legendOrientation = _impl.orientation();
    if (legendOrientation === 'top') {
      inset.top = inset.top + _impl.childHeight();
    } else if (legendOrientation === 'left') {
      inset.left = inset.left + _impl.childWidth();
    } else if (legendOrientation === 'right') { 
      inset.right = inset.right + _impl.childWidth();
    } else {
      inset.bottom = inset.bottom + _impl.childHeight();
    }   
    return inset;
  };        

  _impl.canonicalMargin = function() {
    var _margin = margin;
    if (_margin == null) _margin = 0;
    if (typeof _margin === 'object') {
      _margin = { top: _margin.top, bottom: _margin.bottom, left: _margin.left, right: _margin.right };
    } else {
      _margin = { top: _margin, bottom: _margin, left: _margin, right: _margin };
    }
    
    return _margin;    
  };  

  _impl.canonicalInset = function() {
    var _inset = inset;
    if (_inset == null) _inset = 0;
    if (typeof _inset === 'object') {
      _inset = { top: _inset.top, bottom: _inset.bottom, left: _inset.left, right: _inset.right };
    } else {
      _inset = { top: _inset, bottom: _inset, left: _inset, right: _inset };
    }
    
    return _inset;    
  };  
    
  _impl.classed = function(value) {
    return arguments.length ? (classed = value, _impl) : classed;
  };
    
  _impl.background = function(value) {
    return arguments.length ? (background = value, _impl) : background;
  };

  _impl.theme = function(value) {
    return arguments.length ? (theme = value, _impl) : theme;
  };  

  _impl.size = function(value) {
    return arguments.length ? (width = value, height = null, _impl) : width;
  };
    
  _impl.width = function(value) {
    return arguments.length ? (width = value, _impl) : width;
  };  

  _impl.height = function(value) {
    return arguments.length ? (height = value, _impl) : height;
  }; 

  _impl.scale = function(value) {
    return arguments.length ? (scale = value, _impl) : scale;
  }; 

  _impl.margin = function(value) {
    return arguments.length ? (margin = value, _impl) : margin;
  };   

  _impl.inset = function(value) {
    return arguments.length ? (inset = value, _impl) : inset;
  };  

  _impl.style = function(value) {
    return arguments.length ? (style = value, _impl) : style;
  }; 
  
  _impl.padding = function(value) {
    return arguments.length ? (padding = value, _impl) : padding;
  };   
  
  _impl.fill = function(value) {
    return arguments.length ? (fill = value, _impl) : fill;
  };    

  _impl.textPadding = function(value) {
    return arguments.length ? (textPadding = value, _impl) : textPadding;
  };  

  _impl.msize = function(value) {
    return arguments.length ? (msize = value, _impl) : msize;
  };   

  _impl.legendSize = function(value) {
    return arguments.length ? (legendSize = value, _impl) : legendSize;
  };  
      
  _impl.radius = function(value) {
    return arguments.length ? (radius = value, _impl) : radius;
  };    
  
  _impl.inset = function(value) {
    return arguments.length ? (inset = value, _impl) : inset;
  }; 
  
  _impl.orientation = function(value) {
    return arguments.length ? (orientation = value, _impl) : orientation;
  };     
              
  _impl.fontSize = function(value) {
    return arguments.length ? (fontSize = value, _impl) : fontSize;
  };                 

  _impl.fontFill = function(value) {
    return arguments.length ? (fontFill = value, _impl) : fontFill;
  };  

              
  return _impl;
}

function svg$1(id) {
  return _legends(id, false);
}

// Exported from Wikipedia
var isoLangsNames = {
    "ab":{
        "name":"Abkhaz",
        "nativeName":"аҧсуа"
    },
    "aa":{
        "name":"Afar",
        "nativeName":"Afaraf"
    },
    "af":{
        "name":"Afrikaans",
        "nativeName":"Afrikaans"
    },
    "ak":{
        "name":"Akan",
        "nativeName":"Akan"
    },
    "sq":{
        "name":"Albanian",
        "nativeName":"Shqip"
    },
    "am":{
        "name":"Amharic",
        "nativeName":"አማርኛ"
    },
    "ar":{
        "name":"Arabic",
        "nativeName":"العربية"
    },
    "an":{
        "name":"Aragonese",
        "nativeName":"Aragonés"
    },
    "hy":{
        "name":"Armenian",
        "nativeName":"Հայերեն"
    },
    "as":{
        "name":"Assamese",
        "nativeName":"অসমীয়া"
    },
    "av":{
        "name":"Avaric",
        "nativeName":"авар мацӀ, магӀарул мацӀ"
    },
    "ae":{
        "name":"Avestan",
        "nativeName":"avesta"
    },
    "ay":{
        "name":"Aymara",
        "nativeName":"aymar aru"
    },
    "az":{
        "name":"Azerbaijani",
        "nativeName":"azərbaycan dili"
    },
    "bm":{
        "name":"Bambara",
        "nativeName":"bamanankan"
    },
    "ba":{
        "name":"Bashkir",
        "nativeName":"башҡорт теле"
    },
    "eu":{
        "name":"Basque",
        "nativeName":"euskara, euskera"
    },
    "be":{
        "name":"Belarusian",
        "nativeName":"Беларуская"
    },
    "bn":{
        "name":"Bengali",
        "nativeName":"বাংলা"
    },
    "bh":{
        "name":"Bihari",
        "nativeName":"भोजपुरी"
    },
    "bi":{
        "name":"Bislama",
        "nativeName":"Bislama"
    },
    "bs":{
        "name":"Bosnian",
        "nativeName":"bosanski jezik"
    },
    "br":{
        "name":"Breton",
        "nativeName":"brezhoneg"
    },
    "bg":{
        "name":"Bulgarian",
        "nativeName":"български език"
    },
    "my":{
        "name":"Burmese",
        "nativeName":"ဗမာစာ"
    },
    "ca":{
        "name":"Catalan; Valencian",
        "nativeName":"Català"
    },
    "ch":{
        "name":"Chamorro",
        "nativeName":"Chamoru"
    },
    "ce":{
        "name":"Chechen",
        "nativeName":"нохчийн мотт"
    },
    "ny":{
        "name":"Chichewa; Chewa; Nyanja",
        "nativeName":"chiCheŵa, chinyanja"
    },
    "zh":{
        "name":"Chinese",
        "nativeName":"中文 (Zhōngwén), 汉语, 漢語"
    },
    "cv":{
        "name":"Chuvash",
        "nativeName":"чӑваш чӗлхи"
    },
    "kw":{
        "name":"Cornish",
        "nativeName":"Kernewek"
    },
    "co":{
        "name":"Corsican",
        "nativeName":"corsu, lingua corsa"
    },
    "cr":{
        "name":"Cree",
        "nativeName":"ᓀᐦᐃᔭᐍᐏᐣ"
    },
    "hr":{
        "name":"Croatian",
        "nativeName":"hrvatski"
    },
    "cs":{
        "name":"Czech",
        "nativeName":"česky, čeština"
    },
    "da":{
        "name":"Danish",
        "nativeName":"dansk"
    },
    "dv":{
        "name":"Divehi; Dhivehi; Maldivian;",
        "nativeName":"ދިވެހި"
    },
    "nl":{
        "name":"Dutch",
        "nativeName":"Nederlands, Vlaams"
    },
    "en":{
        "name":"English",
        "nativeName":"English"
    },
    "eo":{
        "name":"Esperanto",
        "nativeName":"Esperanto"
    },
    "et":{
        "name":"Estonian",
        "nativeName":"eesti, eesti keel"
    },
    "ee":{
        "name":"Ewe",
        "nativeName":"Eʋegbe"
    },
    "fo":{
        "name":"Faroese",
        "nativeName":"føroyskt"
    },
    "fj":{
        "name":"Fijian",
        "nativeName":"vosa Vakaviti"
    },
    "fi":{
        "name":"Finnish",
        "nativeName":"suomi, suomen kieli"
    },
    "fr":{
        "name":"French",
        "nativeName":"français, langue française"
    },
    "ff":{
        "name":"Fula; Fulah; Pulaar; Pular",
        "nativeName":"Fulfulde, Pulaar, Pular"
    },
    "gl":{
        "name":"Galician",
        "nativeName":"Galego"
    },
    "ka":{
        "name":"Georgian",
        "nativeName":"ქართული"
    },
    "de":{
        "name":"German",
        "nativeName":"Deutsch"
    },
    "el":{
        "name":"Greek, Modern",
        "nativeName":"Ελληνικά"
    },
    "gn":{
        "name":"Guaraní",
        "nativeName":"Avañeẽ"
    },
    "gu":{
        "name":"Gujarati",
        "nativeName":"ગુજરાતી"
    },
    "ht":{
        "name":"Haitian; Haitian Creole",
        "nativeName":"Kreyòl ayisyen"
    },
    "ha":{
        "name":"Hausa",
        "nativeName":"Hausa, هَوُسَ"
    },
    "he":{
        "name":"Hebrew (modern)",
        "nativeName":"עברית"
    },
    "hz":{
        "name":"Herero",
        "nativeName":"Otjiherero"
    },
    "hi":{
        "name":"Hindi",
        "nativeName":"हिन्दी, हिंदी"
    },
    "ho":{
        "name":"Hiri Motu",
        "nativeName":"Hiri Motu"
    },
    "hu":{
        "name":"Hungarian",
        "nativeName":"Magyar"
    },
    "ia":{
        "name":"Interlingua",
        "nativeName":"Interlingua"
    },
    "id":{
        "name":"Indonesian",
        "nativeName":"Bahasa Indonesia"
    },
    "ie":{
        "name":"Interlingue",
        "nativeName":"Originally called Occidental; then Interlingue after WWII"
    },
    "ga":{
        "name":"Irish",
        "nativeName":"Gaeilge"
    },
    "ig":{
        "name":"Igbo",
        "nativeName":"Asụsụ Igbo"
    },
    "ik":{
        "name":"Inupiaq",
        "nativeName":"Iñupiaq, Iñupiatun"
    },
    "io":{
        "name":"Ido",
        "nativeName":"Ido"
    },
    "is":{
        "name":"Icelandic",
        "nativeName":"Íslenska"
    },
    "it":{
        "name":"Italian",
        "nativeName":"Italiano"
    },
    "iu":{
        "name":"Inuktitut",
        "nativeName":"ᐃᓄᒃᑎᑐᑦ"
    },
    "ja":{
        "name":"Japanese",
        "nativeName":"日本語 (にほんご／にっぽんご)"
    },
    "jv":{
        "name":"Javanese",
        "nativeName":"basa Jawa"
    },
    "kl":{
        "name":"Kalaallisut, Greenlandic",
        "nativeName":"kalaallisut, kalaallit oqaasii"
    },
    "kn":{
        "name":"Kannada",
        "nativeName":"ಕನ್ನಡ"
    },
    "kr":{
        "name":"Kanuri",
        "nativeName":"Kanuri"
    },
    "ks":{
        "name":"Kashmiri",
        "nativeName":"कश्मीरी, كشميري‎"
    },
    "kk":{
        "name":"Kazakh",
        "nativeName":"Қазақ тілі"
    },
    "km":{
        "name":"Khmer",
        "nativeName":"ភាសាខ្មែរ"
    },
    "ki":{
        "name":"Kikuyu, Gikuyu",
        "nativeName":"Gĩkũyũ"
    },
    "rw":{
        "name":"Kinyarwanda",
        "nativeName":"Ikinyarwanda"
    },
    "ky":{
        "name":"Kirghiz, Kyrgyz",
        "nativeName":"кыргыз тили"
    },
    "kv":{
        "name":"Komi",
        "nativeName":"коми кыв"
    },
    "kg":{
        "name":"Kongo",
        "nativeName":"KiKongo"
    },
    "ko":{
        "name":"Korean",
        "nativeName":"한국어 (韓國語), 조선말 (朝鮮語)"
    },
    "ku":{
        "name":"Kurdish",
        "nativeName":"Kurdî, كوردی‎"
    },
    "kj":{
        "name":"Kwanyama, Kuanyama",
        "nativeName":"Kuanyama"
    },
    "la":{
        "name":"Latin",
        "nativeName":"latine, lingua latina"
    },
    "lb":{
        "name":"Luxembourgish, Letzeburgesch",
        "nativeName":"Lëtzebuergesch"
    },
    "lg":{
        "name":"Luganda",
        "nativeName":"Luganda"
    },
    "li":{
        "name":"Limburgish, Limburgan, Limburger",
        "nativeName":"Limburgs"
    },
    "ln":{
        "name":"Lingala",
        "nativeName":"Lingála"
    },
    "lo":{
        "name":"Lao",
        "nativeName":"ພາສາລາວ"
    },
    "lt":{
        "name":"Lithuanian",
        "nativeName":"lietuvių kalba"
    },
    "lu":{
        "name":"Luba-Katanga",
        "nativeName":""
    },
    "lv":{
        "name":"Latvian",
        "nativeName":"latviešu valoda"
    },
    "gv":{
        "name":"Manx",
        "nativeName":"Gaelg, Gailck"
    },
    "mk":{
        "name":"Macedonian",
        "nativeName":"македонски јазик"
    },
    "mg":{
        "name":"Malagasy",
        "nativeName":"Malagasy fiteny"
    },
    "ms":{
        "name":"Malay",
        "nativeName":"bahasa Melayu, بهاس ملايو‎"
    },
    "ml":{
        "name":"Malayalam",
        "nativeName":"മലയാളം"
    },
    "mt":{
        "name":"Maltese",
        "nativeName":"Malti"
    },
    "mi":{
        "name":"Māori",
        "nativeName":"te reo Māori"
    },
    "mr":{
        "name":"Marathi (Marāṭhī)",
        "nativeName":"मराठी"
    },
    "mh":{
        "name":"Marshallese",
        "nativeName":"Kajin M̧ajeļ"
    },
    "mn":{
        "name":"Mongolian",
        "nativeName":"монгол"
    },
    "na":{
        "name":"Nauru",
        "nativeName":"Ekakairũ Naoero"
    },
    "nv":{
        "name":"Navajo, Navaho",
        "nativeName":"Diné bizaad, Dinékʼehǰí"
    },
    "nb":{
        "name":"Norwegian Bokmål",
        "nativeName":"Norsk bokmål"
    },
    "nd":{
        "name":"North Ndebele",
        "nativeName":"isiNdebele"
    },
    "ne":{
        "name":"Nepali",
        "nativeName":"नेपाली"
    },
    "ng":{
        "name":"Ndonga",
        "nativeName":"Owambo"
    },
    "nn":{
        "name":"Norwegian Nynorsk",
        "nativeName":"Norsk nynorsk"
    },
    "no":{
        "name":"Norwegian",
        "nativeName":"Norsk"
    },
    "ii":{
        "name":"Nuosu",
        "nativeName":"ꆈꌠ꒿ Nuosuhxop"
    },
    "nr":{
        "name":"South Ndebele",
        "nativeName":"isiNdebele"
    },
    "oc":{
        "name":"Occitan",
        "nativeName":"Occitan"
    },
    "oj":{
        "name":"Ojibwe, Ojibwa",
        "nativeName":"ᐊᓂᔑᓈᐯᒧᐎᓐ"
    },
    "cu":{
        "name":"Old Church Slavonic, Church Slavic, Church Slavonic, Old Bulgarian, Old Slavonic",
        "nativeName":"ѩзыкъ словѣньскъ"
    },
    "om":{
        "name":"Oromo",
        "nativeName":"Afaan Oromoo"
    },
    "or":{
        "name":"Oriya",
        "nativeName":"ଓଡ଼ିଆ"
    },
    "os":{
        "name":"Ossetian, Ossetic",
        "nativeName":"ирон æвзаг"
    },
    "pa":{
        "name":"Panjabi, Punjabi",
        "nativeName":"ਪੰਜਾਬੀ, پنجابی‎"
    },
    "pi":{
        "name":"Pāli",
        "nativeName":"पाऴि"
    },
    "fa":{
        "name":"Persian",
        "nativeName":"فارسی"
    },
    "pl":{
        "name":"Polish",
        "nativeName":"polski"
    },
    "ps":{
        "name":"Pashto, Pushto",
        "nativeName":"پښتو"
    },
    "pt":{
        "name":"Portuguese",
        "nativeName":"Português"
    },
    "qu":{
        "name":"Quechua",
        "nativeName":"Runa Simi, Kichwa"
    },
    "rm":{
        "name":"Romansh",
        "nativeName":"rumantsch grischun"
    },
    "rn":{
        "name":"Kirundi",
        "nativeName":"kiRundi"
    },
    "ro":{
        "name":"Romanian, Moldavian, Moldovan",
        "nativeName":"română"
    },
    "ru":{
        "name":"Russian",
        "nativeName":"русский язык"
    },
    "sa":{
        "name":"Sanskrit (Saṁskṛta)",
        "nativeName":"संस्कृतम्"
    },
    "sc":{
        "name":"Sardinian",
        "nativeName":"sardu"
    },
    "sd":{
        "name":"Sindhi",
        "nativeName":"सिन्धी, سنڌي، سندھی‎"
    },
    "se":{
        "name":"Northern Sami",
        "nativeName":"Davvisámegiella"
    },
    "sm":{
        "name":"Samoan",
        "nativeName":"gagana faa Samoa"
    },
    "sg":{
        "name":"Sango",
        "nativeName":"yângâ tî sängö"
    },
    "sr":{
        "name":"Serbian",
        "nativeName":"српски језик"
    },
    "gd":{
        "name":"Scottish Gaelic; Gaelic",
        "nativeName":"Gàidhlig"
    },
    "sn":{
        "name":"Shona",
        "nativeName":"chiShona"
    },
    "si":{
        "name":"Sinhala, Sinhalese",
        "nativeName":"සිංහල"
    },
    "sk":{
        "name":"Slovak",
        "nativeName":"slovenčina"
    },
    "sl":{
        "name":"Slovene",
        "nativeName":"slovenščina"
    },
    "so":{
        "name":"Somali",
        "nativeName":"Soomaaliga, af Soomaali"
    },
    "st":{
        "name":"Southern Sotho",
        "nativeName":"Sesotho"
    },
    "es":{
        "name":"Spanish; Castilian",
        "nativeName":"español, castellano"
    },
    "su":{
        "name":"Sundanese",
        "nativeName":"Basa Sunda"
    },
    "sw":{
        "name":"Swahili",
        "nativeName":"Kiswahili"
    },
    "ss":{
        "name":"Swati",
        "nativeName":"SiSwati"
    },
    "sv":{
        "name":"Swedish",
        "nativeName":"svenska"
    },
    "ta":{
        "name":"Tamil",
        "nativeName":"தமிழ்"
    },
    "te":{
        "name":"Telugu",
        "nativeName":"తెలుగు"
    },
    "tg":{
        "name":"Tajik",
        "nativeName":"тоҷикӣ, toğikī, تاجیکی‎"
    },
    "th":{
        "name":"Thai",
        "nativeName":"ไทย"
    },
    "ti":{
        "name":"Tigrinya",
        "nativeName":"ትግርኛ"
    },
    "bo":{
        "name":"Tibetan Standard, Tibetan, Central",
        "nativeName":"བོད་ཡིག"
    },
    "tk":{
        "name":"Turkmen",
        "nativeName":"Türkmen, Түркмен"
    },
    "tl":{
        "name":"Tagalog",
        "nativeName":"Wikang Tagalog, ᜏᜒᜃᜅ᜔ ᜆᜄᜎᜓᜄ᜔"
    },
    "tn":{
        "name":"Tswana",
        "nativeName":"Setswana"
    },
    "to":{
        "name":"Tonga (Tonga Islands)",
        "nativeName":"faka Tonga"
    },
    "tr":{
        "name":"Turkish",
        "nativeName":"Türkçe"
    },
    "ts":{
        "name":"Tsonga",
        "nativeName":"Xitsonga"
    },
    "tt":{
        "name":"Tatar",
        "nativeName":"татарча, tatarça, تاتارچا‎"
    },
    "tw":{
        "name":"Twi",
        "nativeName":"Twi"
    },
    "ty":{
        "name":"Tahitian",
        "nativeName":"Reo Tahiti"
    },
    "ug":{
        "name":"Uighur, Uyghur",
        "nativeName":"Uyƣurqə, ئۇيغۇرچە‎"
    },
    "uk":{
        "name":"Ukrainian",
        "nativeName":"українська"
    },
    "ur":{
        "name":"Urdu",
        "nativeName":"اردو"
    },
    "uz":{
        "name":"Uzbek",
        "nativeName":"zbek, Ўзбек, أۇزبېك‎"
    },
    "ve":{
        "name":"Venda",
        "nativeName":"Tshivenḓa"
    },
    "vi":{
        "name":"Vietnamese",
        "nativeName":"Tiếng Việt"
    },
    "vo":{
        "name":"Volapük",
        "nativeName":"Volapük"
    },
    "wa":{
        "name":"Walloon",
        "nativeName":"Walon"
    },
    "cy":{
        "name":"Welsh",
        "nativeName":"Cymraeg"
    },
    "wo":{
        "name":"Wolof",
        "nativeName":"Wollof"
    },
    "fy":{
        "name":"Western Frisian",
        "nativeName":"Frysk"
    },
    "xh":{
        "name":"Xhosa",
        "nativeName":"isiXhosa"
    },
    "yi":{
        "name":"Yiddish",
        "nativeName":"ייִדיש"
    },
    "yo":{
        "name":"Yoruba",
        "nativeName":"Yorùbá"
    },
    "za":{
        "name":"Zhuang, Chuang",
        "nativeName":"Saɯ cueŋƅ, Saw cuengh"
    }
}

var search = Object.keys(isoLangsNames).map(function (k) { return [k, isoLangsNames[k].name.toLowerCase()]; });

// Manual fllaback mapping from language to language_LOCALE
var fallbacks = {
    ca: 'ca_ES',
    cs: 'cs_CZ',
    en: 'en_US',
    he: 'he_IL',
    ja: 'ja_JP',
    ko: 'ko_KR',
    pt: 'pt_BR', // is this the right one?
    sv: 'sv_SE',
    zh: 'zh_CN'
}

// take the language_LOCALE and generate fallbacks
function fillFallbacks(config) {
    var result = {};
    Object.keys(config).forEach(function(k) {
        var lalo = k.split('_');
        // languages-locale is the same, assume it is the best fallback
        if (lalo[0] === lalo[1].toLowerCase()) {
            result[lalo[0]] = config[k];
        }
        result[k] = config[k];
    });
    
    Object.keys(fallbacks).forEach(function(k) {
        result[k] = config[fallbacks[k]];
    });
    
    return result;
}

function languages(iso) {
    var lang = iso;
    
    if (lang == null) {
        if (typeof navigator !== 'undefined') {
            lang = navigator.languages; // HTML 5.1 proposed
            if (lang == null) {
                lang = [ navigator.userLanguage || navigator.language ]
            }
        } else {
            lang = [ 'en' ]
        }
    } else if (!Array.isArray(lang)) {
        lang = [ lang ];
    }
    
    return lang.map(function (s) { return s.replace('-', '_'); });
}

var dateTime = "%A, %e de %B de %Y, %X";
var date$2 = "%d/%m/%Y";
var time$2 = "%H:%M:%S";
var periods = ["AM","PM"];
var days$1 = ["diumenge","dilluns","dimarts","dimecres","dijous","divendres","dissabte"];
var shortDays = ["dg.","dl.","dt.","dc.","dj.","dv.","ds."];
var months$1 = ["gener","febrer","març","abril","maig","juny","juliol","agost","setembre","octubre","novembre","desembre"];
var shortMonths = ["gen.","febr.","març","abr.","maig","juny","jul.","ag.","set.","oct.","nov.","des."];
var caES = {
	dateTime: dateTime,
	date: date$2,
	time: time$2,
	periods: periods,
	days: days$1,
	shortDays: shortDays,
	months: months$1,
	shortMonths: shortMonths
};

var ca_ES = Object.freeze({
	dateTime: dateTime,
	date: date$2,
	time: time$2,
	periods: periods,
	days: days$1,
	shortDays: shortDays,
	months: months$1,
	shortMonths: shortMonths,
	default: caES
});

var dateTime$1 = "%A, der %e. %B %Y, %X";
var date$3 = "%d.%m.%Y";
var time$3 = "%H:%M:%S";
var periods$1 = ["AM","PM"];
var days$2 = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
var shortDays$1 = ["So","Mo","Di","Mi","Do","Fr","Sa"];
var months$2 = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
var shortMonths$1 = ["Jan","Feb","Mrz","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
var deCH = {
	dateTime: dateTime$1,
	date: date$3,
	time: time$3,
	periods: periods$1,
	days: days$2,
	shortDays: shortDays$1,
	months: months$2,
	shortMonths: shortMonths$1
};

var de_CH = Object.freeze({
	dateTime: dateTime$1,
	date: date$3,
	time: time$3,
	periods: periods$1,
	days: days$2,
	shortDays: shortDays$1,
	months: months$2,
	shortMonths: shortMonths$1,
	default: deCH
});

var dateTime$2 = "%A, der %e. %B %Y, %X";
var date$4 = "%d.%m.%Y";
var time$4 = "%H:%M:%S";
var periods$2 = ["AM","PM"];
var days$3 = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
var shortDays$2 = ["So","Mo","Di","Mi","Do","Fr","Sa"];
var months$3 = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
var shortMonths$2 = ["Jan","Feb","Mrz","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
var deDE = {
	dateTime: dateTime$2,
	date: date$4,
	time: time$4,
	periods: periods$2,
	days: days$3,
	shortDays: shortDays$2,
	months: months$3,
	shortMonths: shortMonths$2
};

var de_DE = Object.freeze({
	dateTime: dateTime$2,
	date: date$4,
	time: time$4,
	periods: periods$2,
	days: days$3,
	shortDays: shortDays$2,
	months: months$3,
	shortMonths: shortMonths$2,
	default: deDE
});

var dateTime$3 = "%a %b %e %X %Y";
var date$5 = "%Y-%m-%d";
var time$5 = "%H:%M:%S";
var periods$3 = ["AM","PM"];
var days$4 = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var shortDays$3 = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var months$4 = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var shortMonths$3 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var enCA = {
	dateTime: dateTime$3,
	date: date$5,
	time: time$5,
	periods: periods$3,
	days: days$4,
	shortDays: shortDays$3,
	months: months$4,
	shortMonths: shortMonths$3
};

var en_CA = Object.freeze({
	dateTime: dateTime$3,
	date: date$5,
	time: time$5,
	periods: periods$3,
	days: days$4,
	shortDays: shortDays$3,
	months: months$4,
	shortMonths: shortMonths$3,
	default: enCA
});

var dateTime$4 = "%a %e %b %X %Y";
var date$6 = "%d/%m/%Y";
var time$6 = "%H:%M:%S";
var periods$4 = ["AM","PM"];
var days$5 = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var shortDays$4 = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var months$5 = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var shortMonths$4 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var enGB = {
	dateTime: dateTime$4,
	date: date$6,
	time: time$6,
	periods: periods$4,
	days: days$5,
	shortDays: shortDays$4,
	months: months$5,
	shortMonths: shortMonths$4
};

var en_GB = Object.freeze({
	dateTime: dateTime$4,
	date: date$6,
	time: time$6,
	periods: periods$4,
	days: days$5,
	shortDays: shortDays$4,
	months: months$5,
	shortMonths: shortMonths$4,
	default: enGB
});

var dateTime$5 = "%a %b %e %X %Y";
var date$7 = "%m/%d/%Y";
var time$7 = "%H:%M:%S";
var periods$5 = ["AM","PM"];
var days$6 = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var shortDays$5 = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var months$6 = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var shortMonths$5 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var enUS = {
	dateTime: dateTime$5,
	date: date$7,
	time: time$7,
	periods: periods$5,
	days: days$6,
	shortDays: shortDays$5,
	months: months$6,
	shortMonths: shortMonths$5
};

var en_US = Object.freeze({
	dateTime: dateTime$5,
	date: date$7,
	time: time$7,
	periods: periods$5,
	days: days$6,
	shortDays: shortDays$5,
	months: months$6,
	shortMonths: shortMonths$5,
	default: enUS
});

var dateTime$6 = "%A, %e de %B de %Y, %X";
var date$8 = "%d/%m/%Y";
var time$8 = "%H:%M:%S";
var periods$6 = ["AM","PM"];
var days$7 = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
var shortDays$6 = ["dom","lun","mar","mié","jue","vie","sáb"];
var months$7 = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
var shortMonths$6 = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
var esES = {
	dateTime: dateTime$6,
	date: date$8,
	time: time$8,
	periods: periods$6,
	days: days$7,
	shortDays: shortDays$6,
	months: months$7,
	shortMonths: shortMonths$6
};

var es_ES = Object.freeze({
	dateTime: dateTime$6,
	date: date$8,
	time: time$8,
	periods: periods$6,
	days: days$7,
	shortDays: shortDays$6,
	months: months$7,
	shortMonths: shortMonths$6,
	default: esES
});

var dateTime$7 = "%A, %-d. %Bta %Y klo %X";
var date$9 = "%-d.%-m.%Y";
var time$9 = "%H:%M:%S";
var periods$7 = ["a.m.","p.m."];
var days$8 = ["sunnuntai","maanantai","tiistai","keskiviikko","torstai","perjantai","lauantai"];
var shortDays$7 = ["Su","Ma","Ti","Ke","To","Pe","La"];
var months$8 = ["tammikuu","helmikuu","maaliskuu","huhtikuu","toukokuu","kesäkuu","heinäkuu","elokuu","syyskuu","lokakuu","marraskuu","joulukuu"];
var shortMonths$7 = ["Tammi","Helmi","Maalis","Huhti","Touko","Kesä","Heinä","Elo","Syys","Loka","Marras","Joulu"];
var fiFI = {
	dateTime: dateTime$7,
	date: date$9,
	time: time$9,
	periods: periods$7,
	days: days$8,
	shortDays: shortDays$7,
	months: months$8,
	shortMonths: shortMonths$7
};

var fi_FI = Object.freeze({
	dateTime: dateTime$7,
	date: date$9,
	time: time$9,
	periods: periods$7,
	days: days$8,
	shortDays: shortDays$7,
	months: months$8,
	shortMonths: shortMonths$7,
	default: fiFI
});

var dateTime$8 = "%a %e %b %Y %X";
var date$10 = "%Y-%m-%d";
var time$10 = "%H:%M:%S";
var periods$8 = ["",""];
var days$9 = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
var shortDays$8 = ["dim","lun","mar","mer","jeu","ven","sam"];
var months$9 = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
var shortMonths$8 = ["jan","fév","mar","avr","mai","jui","jul","aoû","sep","oct","nov","déc"];
var frCA = {
	dateTime: dateTime$8,
	date: date$10,
	time: time$10,
	periods: periods$8,
	days: days$9,
	shortDays: shortDays$8,
	months: months$9,
	shortMonths: shortMonths$8
};

var fr_CA = Object.freeze({
	dateTime: dateTime$8,
	date: date$10,
	time: time$10,
	periods: periods$8,
	days: days$9,
	shortDays: shortDays$8,
	months: months$9,
	shortMonths: shortMonths$8,
	default: frCA
});

var dateTime$9 = "%A, le %e %B %Y, %X";
var date$11 = "%d/%m/%Y";
var time$11 = "%H:%M:%S";
var periods$9 = ["AM","PM"];
var days$10 = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
var shortDays$9 = ["dim.","lun.","mar.","mer.","jeu.","ven.","sam."];
var months$10 = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
var shortMonths$9 = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
var frFR = {
	dateTime: dateTime$9,
	date: date$11,
	time: time$11,
	periods: periods$9,
	days: days$10,
	shortDays: shortDays$9,
	months: months$10,
	shortMonths: shortMonths$9
};

var fr_FR = Object.freeze({
	dateTime: dateTime$9,
	date: date$11,
	time: time$11,
	periods: periods$9,
	days: days$10,
	shortDays: shortDays$9,
	months: months$10,
	shortMonths: shortMonths$9,
	default: frFR
});

var dateTime$10 = "%A, %e ב%B %Y %X";
var date$12 = "%d.%m.%Y";
var time$12 = "%H:%M:%S";
var periods$10 = ["AM","PM"];
var days$11 = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
var shortDays$10 = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];
var months$11 = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
var shortMonths$10 = ["ינו׳","פבר׳","מרץ","אפר׳","מאי","יוני","יולי","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"];
var heIL = {
	dateTime: dateTime$10,
	date: date$12,
	time: time$12,
	periods: periods$10,
	days: days$11,
	shortDays: shortDays$10,
	months: months$11,
	shortMonths: shortMonths$10
};

var he_IL = Object.freeze({
	dateTime: dateTime$10,
	date: date$12,
	time: time$12,
	periods: periods$10,
	days: days$11,
	shortDays: shortDays$10,
	months: months$11,
	shortMonths: shortMonths$10,
	default: heIL
});

var dateTime$11 = "%Y. %B %-e., %A %X";
var date$13 = "%Y. %m. %d.";
var time$13 = "%H:%M:%S";
var periods$11 = ["de.","du."];
var days$12 = ["vasárnap","hétfő","kedd","szerda","csütörtök","péntek","szombat"];
var shortDays$11 = ["V","H","K","Sze","Cs","P","Szo"];
var months$12 = ["január","február","március","április","május","június","július","augusztus","szeptember","október","november","december"];
var shortMonths$11 = ["jan.","feb.","már.","ápr.","máj.","jún.","júl.","aug.","szept.","okt.","nov.","dec."];
var huHU = {
	dateTime: dateTime$11,
	date: date$13,
	time: time$13,
	periods: periods$11,
	days: days$12,
	shortDays: shortDays$11,
	months: months$12,
	shortMonths: shortMonths$11
};

var hu_HU = Object.freeze({
	dateTime: dateTime$11,
	date: date$13,
	time: time$13,
	periods: periods$11,
	days: days$12,
	shortDays: shortDays$11,
	months: months$12,
	shortMonths: shortMonths$11,
	default: huHU
});

var dateTime$12 = "%A %e %B %Y, %X";
var date$14 = "%d/%m/%Y";
var time$14 = "%H:%M:%S";
var periods$12 = ["AM","PM"];
var days$13 = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
var shortDays$12 = ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"];
var months$13 = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
var shortMonths$12 = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
var itIT = {
	dateTime: dateTime$12,
	date: date$14,
	time: time$14,
	periods: periods$12,
	days: days$13,
	shortDays: shortDays$12,
	months: months$13,
	shortMonths: shortMonths$12
};

var it_IT = Object.freeze({
	dateTime: dateTime$12,
	date: date$14,
	time: time$14,
	periods: periods$12,
	days: days$13,
	shortDays: shortDays$12,
	months: months$13,
	shortMonths: shortMonths$12,
	default: itIT
});

var dateTime$13 = "%Y %b %e %a %X";
var date$15 = "%Y/%m/%d";
var time$15 = "%H:%M:%S";
var periods$13 = ["AM","PM"];
var days$14 = ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"];
var shortDays$13 = ["日","月","火","水","木","金","土"];
var months$14 = ["睦月","如月","弥生","卯月","皐月","水無月","文月","葉月","長月","神無月","霜月","師走"];
var shortMonths$13 = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
var jaJP = {
	dateTime: dateTime$13,
	date: date$15,
	time: time$15,
	periods: periods$13,
	days: days$14,
	shortDays: shortDays$13,
	months: months$14,
	shortMonths: shortMonths$13
};

var ja_JP = Object.freeze({
	dateTime: dateTime$13,
	date: date$15,
	time: time$15,
	periods: periods$13,
	days: days$14,
	shortDays: shortDays$13,
	months: months$14,
	shortMonths: shortMonths$13,
	default: jaJP
});

var dateTime$14 = "%Y/%m/%d %a %X";
var date$16 = "%Y/%m/%d";
var time$16 = "%H:%M:%S";
var periods$14 = ["오전","오후"];
var days$15 = ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"];
var shortDays$14 = ["일","월","화","수","목","금","토"];
var months$15 = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
var shortMonths$14 = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
var koKR = {
	dateTime: dateTime$14,
	date: date$16,
	time: time$16,
	periods: periods$14,
	days: days$15,
	shortDays: shortDays$14,
	months: months$15,
	shortMonths: shortMonths$14
};

var ko_KR = Object.freeze({
	dateTime: dateTime$14,
	date: date$16,
	time: time$16,
	periods: periods$14,
	days: days$15,
	shortDays: shortDays$14,
	months: months$15,
	shortMonths: shortMonths$14,
	default: koKR
});

var dateTime$15 = "%A, %e %B %Y г. %X";
var date$17 = "%d.%m.%Y";
var time$17 = "%H:%M:%S";
var periods$15 = ["AM","PM"];
var days$16 = ["недела","понеделник","вторник","среда","четврток","петок","сабота"];
var shortDays$15 = ["нед","пон","вто","сре","чет","пет","саб"];
var months$16 = ["јануари","февруари","март","април","мај","јуни","јули","август","септември","октомври","ноември","декември"];
var shortMonths$15 = ["јан","фев","мар","апр","мај","јун","јул","авг","сеп","окт","ное","дек"];
var mkMK = {
	dateTime: dateTime$15,
	date: date$17,
	time: time$17,
	periods: periods$15,
	days: days$16,
	shortDays: shortDays$15,
	months: months$16,
	shortMonths: shortMonths$15
};

var mk_MK = Object.freeze({
	dateTime: dateTime$15,
	date: date$17,
	time: time$17,
	periods: periods$15,
	days: days$16,
	shortDays: shortDays$15,
	months: months$16,
	shortMonths: shortMonths$15,
	default: mkMK
});

var dateTime$16 = "%a %e %B %Y %T";
var date$18 = "%d-%m-%Y";
var time$18 = "%H:%M:%S";
var periods$16 = ["AM","PM"];
var days$17 = ["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"];
var shortDays$16 = ["zo","ma","di","wo","do","vr","za"];
var months$17 = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
var shortMonths$16 = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
var nlNL = {
	dateTime: dateTime$16,
	date: date$18,
	time: time$18,
	periods: periods$16,
	days: days$17,
	shortDays: shortDays$16,
	months: months$17,
	shortMonths: shortMonths$16
};

var nl_NL = Object.freeze({
	dateTime: dateTime$16,
	date: date$18,
	time: time$18,
	periods: periods$16,
	days: days$17,
	shortDays: shortDays$16,
	months: months$17,
	shortMonths: shortMonths$16,
	default: nlNL
});

var dateTime$17 = "%A, %e %B %Y, %X";
var date$19 = "%d/%m/%Y";
var time$19 = "%H:%M:%S";
var periods$17 = ["AM","PM"];
var days$18 = ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"];
var shortDays$17 = ["Niedz.","Pon.","Wt.","Śr.","Czw.","Pt.","Sob."];
var months$18 = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
var shortMonths$17 = ["Stycz.","Luty","Marz.","Kwie.","Maj","Czerw.","Lipc.","Sierp.","Wrz.","Paźdz.","Listop.","Grudz."];
var plPL = {
	dateTime: dateTime$17,
	date: date$19,
	time: time$19,
	periods: periods$17,
	days: days$18,
	shortDays: shortDays$17,
	months: months$18,
	shortMonths: shortMonths$17
};

var pl_PL = Object.freeze({
	dateTime: dateTime$17,
	date: date$19,
	time: time$19,
	periods: periods$17,
	days: days$18,
	shortDays: shortDays$17,
	months: months$18,
	shortMonths: shortMonths$17,
	default: plPL
});

var dateTime$18 = "%A, %e de %B de %Y. %X";
var date$20 = "%d/%m/%Y";
var time$20 = "%H:%M:%S";
var periods$18 = ["AM","PM"];
var days$19 = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
var shortDays$18 = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
var months$19 = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var shortMonths$18 = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
var ptBR = {
	dateTime: dateTime$18,
	date: date$20,
	time: time$20,
	periods: periods$18,
	days: days$19,
	shortDays: shortDays$18,
	months: months$19,
	shortMonths: shortMonths$18
};

var pt_BR = Object.freeze({
	dateTime: dateTime$18,
	date: date$20,
	time: time$20,
	periods: periods$18,
	days: days$19,
	shortDays: shortDays$18,
	months: months$19,
	shortMonths: shortMonths$18,
	default: ptBR
});

var dateTime$19 = "%A, %e %B %Y г. %X";
var date$21 = "%d.%m.%Y";
var time$21 = "%H:%M:%S";
var periods$19 = ["AM","PM"];
var days$20 = ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"];
var shortDays$19 = ["вс","пн","вт","ср","чт","пт","сб"];
var months$20 = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
var shortMonths$19 = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
var ruRU = {
	dateTime: dateTime$19,
	date: date$21,
	time: time$21,
	periods: periods$19,
	days: days$20,
	shortDays: shortDays$19,
	months: months$20,
	shortMonths: shortMonths$19
};

var ru_RU = Object.freeze({
	dateTime: dateTime$19,
	date: date$21,
	time: time$21,
	periods: periods$19,
	days: days$20,
	shortDays: shortDays$19,
	months: months$20,
	shortMonths: shortMonths$19,
	default: ruRU
});

var dateTime$20 = "%A den %d %B %Y %X";
var date$22 = "%Y-%m-%d";
var time$22 = "%H:%M:%S";
var periods$20 = ["fm","em"];
var days$21 = ["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"];
var shortDays$20 = ["Sön","Mån","Tis","Ons","Tor","Fre","Lör"];
var months$21 = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
var shortMonths$20 = ["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
var svSE = {
	dateTime: dateTime$20,
	date: date$22,
	time: time$22,
	periods: periods$20,
	days: days$21,
	shortDays: shortDays$20,
	months: months$21,
	shortMonths: shortMonths$20
};

var sv_SE = Object.freeze({
	dateTime: dateTime$20,
	date: date$22,
	time: time$22,
	periods: periods$20,
	days: days$21,
	shortDays: shortDays$20,
	months: months$21,
	shortMonths: shortMonths$20,
	default: svSE
});

var dateTime$21 = "%x %A %X";
var date$23 = "%Y年%-m月%-d日";
var time$23 = "%H:%M:%S";
var periods$21 = ["上午","下午"];
var days$22 = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
var shortDays$21 = ["周日","周一","周二","周三","周四","周五","周六"];
var months$22 = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
var shortMonths$21 = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
var zhCN = {
	dateTime: dateTime$21,
	date: date$23,
	time: time$23,
	periods: periods$21,
	days: days$22,
	shortDays: shortDays$21,
	months: months$22,
	shortMonths: shortMonths$21
};

var zh_CN = Object.freeze({
	dateTime: dateTime$21,
	date: date$23,
	time: time$23,
	periods: periods$21,
	days: days$22,
	shortDays: shortDays$21,
	months: months$22,
	shortMonths: shortMonths$21,
	default: zhCN
});

var lookup$1 = {
	ca_ES: ca_ES,
	de_CH: de_CH,
	de_DE: de_DE,
	en_CA: en_CA,
	en_GB: en_GB,
	en_US: en_US,
	es_ES: es_ES,
	fi_FI: fi_FI,
	fr_CA: fr_CA,
	fr_FR: fr_FR,
	he_IL: he_IL,
	hu_HU: hu_HU,
	it_IT: it_IT,
	ja_JP: ja_JP,
	ko_KR: ko_KR,
	mk_MK: mk_MK,
	nl_NL: nl_NL,
	pl_PL: pl_PL,
	pt_BR: pt_BR,
	ru_RU: ru_RU,
	sv_SE: sv_SE,
	zh_CN: zh_CN
}

var lookupMapping = fillFallbacks(lookup$1);

function time$1(iso) {
    var lang = languages(iso);

    for (var i = 0; i < lang.length; ++i) {
        var key = lang[i];
        var fmt = lookupMapping[key];
        if (fmt) return { d3: fmt, iso639: key.replace('_', '-') };    
    }
    
    // default to US english
    return { d3: lookup$1.en_US, iso639: 'en-US'};
}

var decimal = ",";
var thousands = ".";
var grouping = [3];
var currency = [""," €"];
var caES$1 = {
	decimal: decimal,
	thousands: thousands,
	grouping: grouping,
	currency: currency
};

var ca_ES$1 = Object.freeze({
	decimal: decimal,
	thousands: thousands,
	grouping: grouping,
	currency: currency,
	default: caES$1
});

var decimal$1 = ",";
var thousands$1 = " ";
var grouping$1 = [3];
var currency$1 = [""," Kč"];
var csCZ = {
	decimal: decimal$1,
	thousands: thousands$1,
	grouping: grouping$1,
	currency: currency$1
};

var cs_CZ = Object.freeze({
	decimal: decimal$1,
	thousands: thousands$1,
	grouping: grouping$1,
	currency: currency$1,
	default: csCZ
});

var decimal$2 = ",";
var thousands$2 = "'";
var grouping$2 = [3];
var currency$2 = [""," CHF"];
var deCH$1 = {
	decimal: decimal$2,
	thousands: thousands$2,
	grouping: grouping$2,
	currency: currency$2
};

var de_CH$1 = Object.freeze({
	decimal: decimal$2,
	thousands: thousands$2,
	grouping: grouping$2,
	currency: currency$2,
	default: deCH$1
});

var decimal$3 = ",";
var thousands$3 = ".";
var grouping$3 = [3];
var currency$3 = [""," €"];
var deDE$1 = {
	decimal: decimal$3,
	thousands: thousands$3,
	grouping: grouping$3,
	currency: currency$3
};

var de_DE$1 = Object.freeze({
	decimal: decimal$3,
	thousands: thousands$3,
	grouping: grouping$3,
	currency: currency$3,
	default: deDE$1
});

var decimal$4 = ".";
var thousands$4 = ",";
var grouping$4 = [3];
var currency$4 = ["$",""];
var enCA$1 = {
	decimal: decimal$4,
	thousands: thousands$4,
	grouping: grouping$4,
	currency: currency$4
};

var en_CA$1 = Object.freeze({
	decimal: decimal$4,
	thousands: thousands$4,
	grouping: grouping$4,
	currency: currency$4,
	default: enCA$1
});

var decimal$5 = ".";
var thousands$5 = ",";
var grouping$5 = [3];
var currency$5 = ["£",""];
var enGB$1 = {
	decimal: decimal$5,
	thousands: thousands$5,
	grouping: grouping$5,
	currency: currency$5
};

var en_GB$1 = Object.freeze({
	decimal: decimal$5,
	thousands: thousands$5,
	grouping: grouping$5,
	currency: currency$5,
	default: enGB$1
});

var decimal$6 = ".";
var thousands$6 = ",";
var grouping$6 = [3];
var currency$6 = ["$",""];
var enUS$1 = {
	decimal: decimal$6,
	thousands: thousands$6,
	grouping: grouping$6,
	currency: currency$6
};

var en_US$1 = Object.freeze({
	decimal: decimal$6,
	thousands: thousands$6,
	grouping: grouping$6,
	currency: currency$6,
	default: enUS$1
});

var decimal$7 = ",";
var thousands$7 = ".";
var grouping$7 = [3];
var currency$7 = [""," €"];
var esES$1 = {
	decimal: decimal$7,
	thousands: thousands$7,
	grouping: grouping$7,
	currency: currency$7
};

var es_ES$1 = Object.freeze({
	decimal: decimal$7,
	thousands: thousands$7,
	grouping: grouping$7,
	currency: currency$7,
	default: esES$1
});

var decimal$8 = ".";
var thousands$8 = ",";
var grouping$8 = [3];
var currency$8 = ["$",""];
var esMX = {
	decimal: decimal$8,
	thousands: thousands$8,
	grouping: grouping$8,
	currency: currency$8
};

var es_MX = Object.freeze({
	decimal: decimal$8,
	thousands: thousands$8,
	grouping: grouping$8,
	currency: currency$8,
	default: esMX
});

var decimal$9 = ",";
var thousands$9 = " ";
var grouping$9 = [3];
var currency$9 = [""," €"];
var fiFI$1 = {
	decimal: decimal$9,
	thousands: thousands$9,
	grouping: grouping$9,
	currency: currency$9
};

var fi_FI$1 = Object.freeze({
	decimal: decimal$9,
	thousands: thousands$9,
	grouping: grouping$9,
	currency: currency$9,
	default: fiFI$1
});

var decimal$10 = ",";
var thousands$10 = " ";
var grouping$10 = [3];
var currency$10 = ["","$"];
var frCA$1 = {
	decimal: decimal$10,
	thousands: thousands$10,
	grouping: grouping$10,
	currency: currency$10
};

var fr_CA$1 = Object.freeze({
	decimal: decimal$10,
	thousands: thousands$10,
	grouping: grouping$10,
	currency: currency$10,
	default: frCA$1
});

var decimal$11 = ",";
var thousands$11 = ".";
var grouping$11 = [3];
var currency$11 = [""," €"];
var frFR$1 = {
	decimal: decimal$11,
	thousands: thousands$11,
	grouping: grouping$11,
	currency: currency$11
};

var fr_FR$1 = Object.freeze({
	decimal: decimal$11,
	thousands: thousands$11,
	grouping: grouping$11,
	currency: currency$11,
	default: frFR$1
});

var decimal$12 = ".";
var thousands$12 = ",";
var grouping$12 = [3];
var currency$12 = ["₪",""];
var heIL$1 = {
	decimal: decimal$12,
	thousands: thousands$12,
	grouping: grouping$12,
	currency: currency$12
};

var he_IL$1 = Object.freeze({
	decimal: decimal$12,
	thousands: thousands$12,
	grouping: grouping$12,
	currency: currency$12,
	default: heIL$1
});

var decimal$13 = ",";
var thousands$13 = " ";
var grouping$13 = [3];
var currency$13 = [""," Ft"];
var huHU$1 = {
	decimal: decimal$13,
	thousands: thousands$13,
	grouping: grouping$13,
	currency: currency$13
};

var hu_HU$1 = Object.freeze({
	decimal: decimal$13,
	thousands: thousands$13,
	grouping: grouping$13,
	currency: currency$13,
	default: huHU$1
});

var decimal$14 = ",";
var thousands$14 = ".";
var grouping$14 = [3];
var currency$14 = ["€",""];
var itIT$1 = {
	decimal: decimal$14,
	thousands: thousands$14,
	grouping: grouping$14,
	currency: currency$14
};

var it_IT$1 = Object.freeze({
	decimal: decimal$14,
	thousands: thousands$14,
	grouping: grouping$14,
	currency: currency$14,
	default: itIT$1
});

var decimal$15 = ".";
var thousands$15 = ",";
var grouping$15 = [3];
var currency$15 = ["","円"];
var jaJP$1 = {
	decimal: decimal$15,
	thousands: thousands$15,
	grouping: grouping$15,
	currency: currency$15
};

var ja_JP$1 = Object.freeze({
	decimal: decimal$15,
	thousands: thousands$15,
	grouping: grouping$15,
	currency: currency$15,
	default: jaJP$1
});

var decimal$16 = ".";
var thousands$16 = ",";
var grouping$16 = [3];
var currency$16 = ["₩",""];
var koKR$1 = {
	decimal: decimal$16,
	thousands: thousands$16,
	grouping: grouping$16,
	currency: currency$16
};

var ko_KR$1 = Object.freeze({
	decimal: decimal$16,
	thousands: thousands$16,
	grouping: grouping$16,
	currency: currency$16,
	default: koKR$1
});

var decimal$17 = ",";
var thousands$17 = ".";
var grouping$17 = [3];
var currency$17 = [""," ден."];
var mkMK$1 = {
	decimal: decimal$17,
	thousands: thousands$17,
	grouping: grouping$17,
	currency: currency$17
};

var mk_MK$1 = Object.freeze({
	decimal: decimal$17,
	thousands: thousands$17,
	grouping: grouping$17,
	currency: currency$17,
	default: mkMK$1
});

var decimal$18 = ",";
var thousands$18 = ".";
var grouping$18 = [3];
var currency$18 = ["€ ",""];
var nlNL$1 = {
	decimal: decimal$18,
	thousands: thousands$18,
	grouping: grouping$18,
	currency: currency$18
};

var nl_NL$1 = Object.freeze({
	decimal: decimal$18,
	thousands: thousands$18,
	grouping: grouping$18,
	currency: currency$18,
	default: nlNL$1
});

var decimal$19 = ",";
var thousands$19 = ".";
var grouping$19 = [3];
var currency$19 = ["","zł"];
var plPL$1 = {
	decimal: decimal$19,
	thousands: thousands$19,
	grouping: grouping$19,
	currency: currency$19
};

var pl_PL$1 = Object.freeze({
	decimal: decimal$19,
	thousands: thousands$19,
	grouping: grouping$19,
	currency: currency$19,
	default: plPL$1
});

var decimal$20 = ",";
var thousands$20 = ".";
var grouping$20 = [3];
var currency$20 = ["R$",""];
var ptBR$1 = {
	decimal: decimal$20,
	thousands: thousands$20,
	grouping: grouping$20,
	currency: currency$20
};

var pt_BR$1 = Object.freeze({
	decimal: decimal$20,
	thousands: thousands$20,
	grouping: grouping$20,
	currency: currency$20,
	default: ptBR$1
});

var decimal$21 = ",";
var thousands$21 = " ";
var grouping$21 = [3];
var currency$21 = [""," руб."];
var ruRU$1 = {
	decimal: decimal$21,
	thousands: thousands$21,
	grouping: grouping$21,
	currency: currency$21
};

var ru_RU$1 = Object.freeze({
	decimal: decimal$21,
	thousands: thousands$21,
	grouping: grouping$21,
	currency: currency$21,
	default: ruRU$1
});

var decimal$22 = ",";
var thousands$22 = " ";
var grouping$22 = [3];
var currency$22 = ["","SEK"];
var svSE$1 = {
	decimal: decimal$22,
	thousands: thousands$22,
	grouping: grouping$22,
	currency: currency$22
};

var sv_SE$1 = Object.freeze({
	decimal: decimal$22,
	thousands: thousands$22,
	grouping: grouping$22,
	currency: currency$22,
	default: svSE$1
});

var decimal$23 = ".";
var thousands$23 = ",";
var grouping$23 = [3];
var currency$23 = ["¥",""];
var zhCN$1 = {
	decimal: decimal$23,
	thousands: thousands$23,
	grouping: grouping$23,
	currency: currency$23
};

var zh_CN$1 = Object.freeze({
	decimal: decimal$23,
	thousands: thousands$23,
	grouping: grouping$23,
	currency: currency$23,
	default: zhCN$1
});

var lookup$2 = {
	ca_ES: ca_ES$1,
	cs_CZ: cs_CZ,
	de_CH: de_CH$1,
	de_DE: de_DE$1,
	en_CA: en_CA$1,
	en_GB: en_GB$1,
	en_US: en_US$1,
	es_ES: es_ES$1,
	es_MX: es_MX,
	fi_FI: fi_FI$1,
	fr_CA: fr_CA$1,
	fr_FR: fr_FR$1,
	he_IL: he_IL$1,
	hu_HU: hu_HU$1,
	it_IT: it_IT$1,
	ja_JP: ja_JP$1,
	ko_KR: ko_KR$1,
	mk_MK: mk_MK$1,
	nl_NL: nl_NL$1,
	pl_PL: pl_PL$1,
	pt_BR: pt_BR$1,
	ru_RU: ru_RU$1,
	sv_SE: sv_SE$1,
	zh_CN: zh_CN$1
}

var lookupMapping$1 = fillFallbacks(lookup$2);

function units(iso) {
    var lang = languages(iso);

    for (var i = 0; i < lang.length; ++i) {
        var key = lang[i];
        var fmt = lookupMapping$1[key];
        if (fmt) return { d3: fmt, iso639: key.replace('_', '-') };    
    }
    
    // default to US english
    return { d3: lookup$2.en_US, iso639: 'en-US'};
}

var noop = {value: function() {}};

function dispatch() {
  var arguments$1 = arguments;

  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments$1[i] + "") || (t in _)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames$1(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames$1(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$2(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$2(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    var arguments$1 = arguments;

    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments$1[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get$1(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$2(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function(f) { setTimeout(f, 17); };
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout) timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity) timeout = setTimeout(wake, delay);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

function timeout$1(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart(function(elapsed) {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}

var emptyOn = dispatch("start", "end", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

function schedule(node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id in schedules) return;
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}

function init(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > CREATED) throw new Error("too late");
  return schedule;
}

function set$1(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > STARTING) throw new Error("too late");
  return schedule;
}

function get(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("too late");
  return schedule;
}

function create(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout$1(start);

      // Interrupt the active transition, if any.
      // Dispatch the interrupt event.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions. No interrupt event is dispatched
      // because the cancelled transitions never started. Note that this also
      // removes this transition from the pending list!
      else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        delete schedules[i];
      }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout$1(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(null, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) return; // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

function interrupt(node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    if (active) schedule.on.call("interrupt", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
}

function selection_interrupt(name) {
  return this.each(function() {
    interrupt(this, name);
  });
}

function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule = set$1(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error;
  return function() {
    var schedule = set$1(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

function transition_tween(name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
}

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function() {
    var schedule = set$1(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function(node) {
    return get(node, id).value[name];
  };
}

function interpolate(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber
      : b instanceof color ? interpolateRgb
      : (c = color(b)) ? (b = c, interpolateRgb)
      : interpolateString)(a, b);
}

function attrRemove$1(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, interpolate, value1) {
  var value00,
      interpolate0;
  return function() {
    var value0 = this.getAttribute(name);
    return value0 === value1 ? null
        : value0 === value00 ? interpolate0
        : interpolate0 = interpolate(value00 = value0, value1);
  };
}

function attrConstantNS$1(fullname, interpolate, value1) {
  var value00,
      interpolate0;
  return function() {
    var value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null
        : value0 === value00 ? interpolate0
        : interpolate0 = interpolate(value00 = value0, value1);
  };
}

function attrFunction$1(name, interpolate, value) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var value0, value1 = value(this);
    if (value1 == null) return void this.removeAttribute(name);
    value0 = this.getAttribute(name);
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate(value00 = value0, value10 = value1);
  };
}

function attrFunctionNS$1(fullname, interpolate, value) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var value0, value1 = value(this);
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate(value00 = value0, value10 = value1);
  };
}

function transition_attr(name, value) {
  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransform$2 : interpolate;
  return this.attrTween(name, typeof value === "function"
      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value))
      : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
      : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value));
}

function attrTweenNS(fullname, value) {
  function tween() {
    var node = this, i = value.apply(node, arguments);
    return i && function(t) {
      node.setAttributeNS(fullname.space, fullname.local, i(t));
    };
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  function tween() {
    var node = this, i = value.apply(node, arguments);
    return i && function(t) {
      node.setAttribute(name, i(t));
    };
  }
  tween._value = value;
  return tween;
}

function transition_attrTween(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}

function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}

function transition_delay(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? delayFunction
          : delayConstant)(id, value))
      : get(this.node(), id).delay;
}

function durationFunction(id, value) {
  return function() {
    set$1(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function() {
    set$1(this, id).duration = value;
  };
}

function transition_duration(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? durationFunction
          : durationConstant)(id, value))
      : get(this.node(), id).duration;
}

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error;
  return function() {
    set$1(this, id).ease = value;
  };
}

function transition_ease(value) {
  var id = this._id;

  return arguments.length
      ? this.each(easeConstant(id, value))
      : get(this.node(), id).ease;
}

function transition_filter(match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
}

function transition_merge(transition) {
  if (transition._id !== this._id) throw new Error;

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
}

function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0, on1, sit = start(name) ? init : set$1;
  return function() {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

function transition_on(name, listener) {
  var id = this._id;

  return arguments.length < 2
      ? get(this.node(), id).on.on(name)
      : this.each(onFunction(id, name, listener));
}

function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id) return;
    if (parent) parent.removeChild(this);
  };
}

function transition_remove() {
  return this.on("end.remove", removeFunction(this._id));
}

function transition_select(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
}

function transition_selectAll(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
}

var Selection$1 = selection.prototype.constructor;

function transition_selection() {
  return new Selection$1(this._groups, this._parents);
}

function styleRemove$1(name, interpolate) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var style = window$1(this).getComputedStyle(this, null),
        value0 = style.getPropertyValue(name),
        value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate(value00 = value0, value10 = value1);
  };
}

function styleRemoveEnd(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant$1(name, interpolate, value1) {
  var value00,
      interpolate0;
  return function() {
    var value0 = window$1(this).getComputedStyle(this, null).getPropertyValue(name);
    return value0 === value1 ? null
        : value0 === value00 ? interpolate0
        : interpolate0 = interpolate(value00 = value0, value1);
  };
}

function styleFunction$1(name, interpolate, value) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var style = window$1(this).getComputedStyle(this, null),
        value0 = style.getPropertyValue(name),
        value1 = value(this);
    if (value1 == null) value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate(value00 = value0, value10 = value1);
  };
}

function transition_style(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransform$1 : interpolate;
  return value == null ? this
          .styleTween(name, styleRemove$1(name, i))
          .on("end.style." + name, styleRemoveEnd(name))
      : this.styleTween(name, typeof value === "function"
          ? styleFunction$1(name, i, tweenValue(this, "style." + name, value))
          : styleConstant$1(name, i, value), priority);
}

function styleTween(name, value, priority) {
  function tween() {
    var node = this, i = value.apply(node, arguments);
    return i && function(t) {
      node.style.setProperty(name, i(t), priority);
    };
  }
  tween._value = value;
  return tween;
}

function transition_styleTween(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}

function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

function transition_text(value) {
  return this.tween("text", typeof value === "function"
      ? textFunction$1(tweenValue(this, "text", value))
      : textConstant$1(value == null ? "" : value + ""));
}

function transition_transition() {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
}

var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition(name) {
  return selection().transition(name);
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease
};

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var exponent$1 = 3;

var polyIn = (function custom(e) {
  e = +e;

  function polyIn(t) {
    return Math.pow(t, e);
  }

  polyIn.exponent = custom;

  return polyIn;
})(exponent$1);

var polyOut = (function custom(e) {
  e = +e;

  function polyOut(t) {
    return 1 - Math.pow(1 - t, e);
  }

  polyOut.exponent = custom;

  return polyOut;
})(exponent$1);

var polyInOut = (function custom(e) {
  e = +e;

  function polyInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
  }

  polyInOut.exponent = custom;

  return polyInOut;
})(exponent$1);

var overshoot = 1.70158;

var backIn = (function custom(s) {
  s = +s;

  function backIn(t) {
    return t * t * ((s + 1) * t - s);
  }

  backIn.overshoot = custom;

  return backIn;
})(overshoot);

var backOut = (function custom(s) {
  s = +s;

  function backOut(t) {
    return --t * t * ((s + 1) * t + s) + 1;
  }

  backOut.overshoot = custom;

  return backOut;
})(overshoot);

var backInOut = (function custom(s) {
  s = +s;

  function backInOut(t) {
    return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
  }

  backInOut.overshoot = custom;

  return backInOut;
})(overshoot);

var tau = 2 * Math.PI;
var amplitude = 1;
var period = 0.3;
var elasticIn = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticIn(t) {
    return a * Math.pow(2, 10 * --t) * Math.sin((s - t) / p);
  }

  elasticIn.amplitude = function(a) { return custom(a, p * tau); };
  elasticIn.period = function(p) { return custom(a, p); };

  return elasticIn;
})(amplitude, period);

var elasticOut = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticOut(t) {
    return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
  }

  elasticOut.amplitude = function(a) { return custom(a, p * tau); };
  elasticOut.period = function(p) { return custom(a, p); };

  return elasticOut;
})(amplitude, period);

var elasticInOut = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticInOut(t) {
    return ((t = t * 2 - 1) < 0
        ? a * Math.pow(2, 10 * t) * Math.sin((s - t) / p)
        : 2 - a * Math.pow(2, -10 * t) * Math.sin((s + t) / p)) / 2;
  }

  elasticInOut.amplitude = function(a) { return custom(a, p * tau); };
  elasticInOut.period = function(p) { return custom(a, p); };

  return elasticInOut;
})(amplitude, period);

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      return defaultTiming.time = now(), defaultTiming;
    }
  }
  return timing;
}

function selection_transition(name) {
  var id,
      timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
}

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

function encode$1(s) {
  if (typeof s === 'string' || s instanceof String) {
    return Math.abs(s.split('').reduce(function (a,b) { a=((a<<5)-a)+b.charCodeAt(0); return a&a }, 0));  
  } 
  
  if (typeof s === 'number') { 
    var r = (s % 1);
    if (r === 0) {
      return s;
    }
  }
  return null;           
}

// Random color from theme, optionally derived from the input 's'
function random$1(palette, rng) {
  if (rng == null) rng = Math.random;
  
  return function _random(s) {
    var hash = encode$1(s);
    if (hash == null) {
      hash = Math.floor(rng() * palette.length);
    } else {
      hash = hash % palette.length;
    }
    
    return palette[hash];
  }
}

// Informed by the Cagatay Demiralp paper, grey is moved around to break
// brown and red in this color scheme

var presentation10dark$1 = [ 
    '#00ce5c', // Green
    '#d800a2', // Pink          
    '#00d9d2', // Aqua     
    '#AF5100', // Brown         
    '#bfbfbf', // Grey   
    '#DE0000', // Red     
    '#F0DE00', // Yellow           
    '#9200ff', // Purple      
    '#ED9200', // Orange     
    '#00aeff' // Blue 
];

var presentation10std$1 = [ 
   
    '#56d58e', // Green
    '#d95cba', // Pink          
    '#63eae4', // Aqua     
    '#C78348', // Brown         
    '#d6d6d6', // Grey 
    '#E06363', // Red     
    '#FFF741', // Yellow           
    '#965ede', // Purple      
    '#FCBB54', // Orange  
    '#73c5eb' // Blue 
];

var presentation10light$1 = [ 
    '#a5e6c3', // Green
    '#eda3da', // Pink          
    '#9af8f4', // Aqua     
    '#EDC19C', // Brown         
    '#e5e5e5', // Grey 
    '#F5AAAA', // Red     
    '#F7EFC3', // Yellow           
    '#c6a8ef', // Purple      
    '#F8D296', // Orange     
    '#addbf0' // Blue 
];

var names10$1 = {
    green:  0,
    pink:   1,
    aqua:   2,        
    brown:  3,
    grey:   4,
    red:    5,
    yellow: 6,
    purple: 7,
    orange: 8,
    blue:   9
}

var presentation10$1 = {
    standard: presentation10std$1,
    darker: presentation10dark$1,
    lighter: presentation10light$1,
    names: names10$1    
}

var display$1 = { 
    light : {
        background: '#ffffff',
        text: '#262626',
        axis: '#262626',
        grid: '#e0e0e0',
        highlight: 'rgba(225,16,16,0.5)',
        lowlight: 'rgba(127,127,127,0.3)',
        shadow: 'rgba(127,127,127,0.4)',
        fillOpacity: 0.33,
        negative: {
            background: 'rgba(0, 0, 0, 0.66)',
            text: '#ffffff'
        }
    },
    dark : {
        background: '#333333',    
        text: '#ffffff',
        axis: '#ffffff',
        grid: '#6d6d6d',
        highlight: 'rgba(225,16,16,0.5)',
        lowlight: 'rgba(127,127,127,0.5)',
        shadow: 'rgba(255,255,255,0.4)',
        fillOpacity: 0.33,      
        negative: {
            background: 'rgba(255, 255, 255, 0.85)',
            text: '#262626'
        }
    }
};

var widths$1 = {
    outline: 0.5,
    data: 2.5,
    axis: 1.0,
    grid: 2.0
}

var dashes$1 = {
    grid: '2,2'
}

// Fallback here chooses system fonts first
var systemFontFallback$1 = "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\"";

function sizeForWidth$1(width) {
    if (width < 414) {
        return '12px';
    }
    return '14px';
}

var fonts$1 = {
    fixed: {
        cssImport: "@import url(https://fonts.googleapis.com/css?family=Source+Code+Pro:300,500);",
        weightMonochrome: 300,
        weightColor: 500,
        sizeForWidth: sizeForWidth$1,
        family: "\"Source Code Pro\", Consolas, \"Liberation Mono\", Menlo, Courier, monospace" // Font fallback chosen to keep presentation on places like GitHub where Content Security Policy prevents inline SRC
    },
    variable: {
        cssImport: "@import url(https://fonts.googleapis.com/css?family=Raleway:400,500);",
        weightMonochrome: 400,
        weightColor: 500,
        sizeForWidth: sizeForWidth$1,
        family: ("\"Raleway\", \"Trebuchet MS\", " + systemFontFallback$1)
    },
    brand: {
        cssImport: "@import url(https://fonts.googleapis.com/css?family=Electrolize);",
        weightMonochrome: 400,
        weightColor: 400,
        sizeForWidth: sizeForWidth$1,
        family: ("\"Electrolize\", " + systemFontFallback$1)
    }
}

/**
 * Extension of work by Justin Palmer (https://github.com/Caged/d3-tip)
 *
 * Copyright (c) 2016 Redsift Limited. All rights reserved.
*/
// d3.tip
// Copyright (c) 2013 Justin Palmer
//
// Tooltips for d3.js SVG visualizations

var DEFAULT_WIDTH = 800; // Assume the chart is of this width if generating css

function tip(id) {
  var d3_tip_functor = function (v) { return (typeof v === "function" ? v : function () { return v; }); };
  var d3_tip_direction = function () { return 'n'; };
  var d3_tip_offset = function () { return [0, 0]; };
  var d3_tip_html = function () { return ' '; };
  var IsDOMElement = function (o) { return o instanceof Node; };


  transition(); // dummy injection for transition
  
  var direction = d3_tip_direction,
      offset    = d3_tip_offset,
      html      = d3_tip_html,
      classed   = 'd3-tip',
      node      = initNode(),
      point     = null,
      target    = null,
      parent    = null,
      theme     = 'light',
      transition$$= false,
      style     = undefined;

  function initNode() {
    var node = select('div' + (id ?  '#' + id : '.' + classed));
    if (node.empty())
      node = select(document.createElement('div'))
    node
      .attr('id', id)
      .attr('class', classed)
      .style('position','absolute')
      .style('top', 0)
      .style('left', 0)
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('box-sizing', 'border-box');
    return node.node()
  }

  function getSVGNode(el) {
    el = el.node()
    if(!el) return;
    return el.tagName.toLowerCase() === 'svg' ? el : el.ownerSVGElement;
  }

  function getNodeEl() {
    //TODO: this check might not be valid any more  
    if(node === null) {
      node = initNode();
      // re-add node to DOM
      parent.appendChild(node);
    }
    return select(node);
  }

  function _impl(vis) {
    if(!parent) {
      document.body.appendChild(node);
    }
    var svg = getSVGNode(vis)
    if (!svg) return;
    
    if (svg.createSVGPoint != null) {
      point = svg.createSVGPoint();
    }
    svg = select(svg);

    var defsEl = svg.select('defs');
    if (defsEl.empty()) {
      defsEl = svg.append('defs');
    }
    
    var _style = style;
    if (_style === undefined) {
      _style = _impl.defaultStyle(theme, DEFAULT_WIDTH);
    }

    var styleEl = defsEl.selectAll('style' + (id ?  '#style-tip-' + id : '.style-' + classed)).data(_style ? [ _style ] : []);
    styleEl.exit().remove();
    styleEl = styleEl.enter()
                  .append('style')
                    .attr('type', 'text/css')
                    .attr('id', (id ?  'style-tip-' + id : null))
                    .attr('class', (id ?  null : 'style-' + classed))
                  .merge(styleEl);
    styleEl.text(function (s) { return s; });
  }

  _impl.self = function() { return 'div' + (id ?  '#' + id : '.' + classed); }

  _impl.id = function() { return id; };
    
  _impl.classed = function(_) {
    return arguments.length ? (classed = _, _impl) : classed;
  };

  // Public - show the tooltip on the screen
  //
  // Returns a tip
  _impl.show = function() {
    if(!parent) _impl.parent(document.body);
    var args = [].slice.call(arguments);
    target = this;
    var standalone = false;
    if(args.length === 1 && IsDOMElement(args[0])){
      target = args[0];
      args[0] = target.__data__;
      standalone = true;
    }

    var content = html.apply(target, args);
    if (content == null) return _impl;
    
    var poffset = offset.apply(target, args),
        dir     = direction.apply(target, args),
        nodel   = getNodeEl(),
        i       = directions.length,
        parentCoords = node.offsetParent.getBoundingClientRect();

    while(i--) nodel.classed(directions[i], false);

    nodel.classed(dir, true).html(content)

    var coords = direction_callbacks[dir].apply(target);

    nodel
      .style('top', (coords.top +  poffset[0]) - parentCoords.top + 'px')
      .style('left', (coords.left + poffset[1]) - parentCoords.left + 'px')

    if(standalone){
      window.addEventListener('load', function() {
        // for testing
        // console.log('offsets',node.offsetHeight, node.offsetWidth)
        coords = direction_callbacks[dir].apply(target);
        nodel
            .style('top', (coords.top +  poffset[0]) - parentCoords.top + 'px')
            .style('left', (coords.left + poffset[1]) - parentCoords.left + 'px')
      });
    }

    if (transition$$ != null && transition$$ !== false) {
      nodel = nodel.transition();
      if (typeof transition$$ === 'number') {
        nodel = nodel.duration(transition$$);
      }
    }

    nodel.style('opacity', 1.0);

    return _impl;
  }

  // Public - hide the tooltip
  //
  // Returns a tip
  _impl.hide = function() {
    var nodel = getNodeEl();
    
    nodel.interrupt(); // stop the fade in if happening
    nodel.style('opacity', 0.0);
    return _impl;
  }

  // Public: Proxy attr calls to the d3 tip container.  Sets or gets attribute value.
  //
  // n - name of the attribute
  // v - value of the attribute
  //
  // Returns tip or attribute value
  _impl.attr = function(n) {
    if (arguments.length < 2 && typeof n === 'string') {
      return getNodeEl().attr(n)
    } else {
      var args =  [].slice.call(arguments)
      selection.prototype.attr.apply(getNodeEl(), args)
    }

    return _impl;
  }

  // Public: Set or get the direction of the tooltip
  //
  // v - One of n(north), s(south), e(east), or w(west), nw(northwest),
  //     sw(southwest), ne(northeast) or se(southeast)
  //
  // Returns tip or direction
  _impl.direction = function(v) {
    if (!arguments.length) return direction
    direction = v == null ? v : d3_tip_functor(v)

    return _impl;
  }

  // Public: Sets or gets the offset of the tip
  //
  // v - Array of [x, y] offset
  //
  // Returns offset or
  _impl.offset = function(v) {
    if (!arguments.length) return offset
    offset = v == null ? v : d3_tip_functor(v)

    return _impl;
  }

  // Public: sets or gets the html value of the tooltip
  //
  // v - String value of the tip
  //
  // Returns html value or tip
  _impl.html = function(v) {
    if (!arguments.length) return html
    html = v == null ? v : d3_tip_functor(v)

    return _impl;
  }

  // Public: destroys the tooltip and removes it from the DOM
  //
  // Returns a tip
  _impl.destroy = function() {
    if(node) {
      getNodeEl().remove();
      node = null;
    }
    return _impl;
  }

  _impl.style = function(_) {
    return arguments.length ? (style = _, _impl) : style;
  }
  
  _impl.transition = function(_) {
    return arguments.length ? (transition$$ = _, _impl) : transition$$;
  }

  _impl.theme = function(_) {
    return arguments.length ? (theme = _, _impl) : theme;
  }  
  

  _impl.parent = function(v) {
    if (!arguments.length) return parent;
    parent = v || document.body;
    parent.appendChild(node);

    // Make sure offsetParent has a position so the tip can be
    // based from it. Mainly a concern with <body>.
    var offsetParent = select(node.offsetParent)
    if (offsetParent.style('position') === 'static') {
     offsetParent.style('position', 'relative')
    }

    return _impl;
  }

  _impl.defaultStyle = function (_theme, _width) { return ("\n                  " + (fonts$1.fixed.cssImport) + "  \n                  " + (_impl.self()) + " {\n                                    line-height: 1;\n                                    font-family: " + (fonts$1.fixed.family) + ";\n                                    color: " + (display$1[_theme].negative.text) + ";\n                                    font-weight: " + (fonts$1.fixed.weightMonochrome) + ";  \n                                    font-size: " + (fonts$1.fixed.sizeForWidth(_width)) + ";  \n                                    padding: 8px;\n                                    background: " + (display$1[_theme].negative.background) + ";\n                                    border-radius: 2px;\n                                    pointer-events: none;\n                                  }\n                    /* Creates a small triangle extender for the tooltip */\n                    " + (_impl.self()) + ":after {\n                                      box-sizing: border-box;\n                                      display: inline;\n                                      width: 100%;\n                                      line-height: 1;\n                                      color: " + (display$1[_theme].negative.background) + ";\n                                      font-size: " + (fonts$1.fixed.sizeForWidth(1)) + ";  \n                                      position: absolute;\n                                      pointer-events: none;\n                                    }\n                    /* Northward tooltips */\n                    " + (_impl.self()) + ".n:after {\n                                      content: \"\\25bc\";\n                                      margin: -3px 0 0 0;\n                                      top: 100%;\n                                      left: 0;\n                                      text-align: center;\n                                    }\n                    /* Eastward tooltips */\n                    " + (_impl.self()) + ".e:after {\n                                      content: \"\\25C0\";\n                                      margin: -7px 0 0 0;\n                                      top: 50%;\n                                      left: -7px;\n                                    }\n                    /* Southward tooltips */\n                    " + (_impl.self()) + ".s:after {\n                                      content: \"\\25B2\";\n                                      margin: 0 0 1px 0;\n                                      top: -10px;\n                                      left: 0;\n                                      text-align: center;\n                                    }\n                    /* Westward tooltips */\n                    " + (_impl.self()) + ".w:after {\n                                      content: \"\\25B6\";\n                                      margin: -7px 0 0 0;\n                                      top: 50%;\n                                      left: 100%;\n                                    }                \n                "); };

  function direction_n() {
    var bbox = getScreenBBox()
    return {
      top:  (bbox.n.y - node.offsetHeight),
      left: (bbox.n.x - node.offsetWidth / 2)
    }
  }

  function direction_s() {
    var bbox = getScreenBBox()
    return {
      top:  (bbox.s.y),
      left: (bbox.s.x - node.offsetWidth / 2)
    }
  }

  function direction_e() {
    var bbox = getScreenBBox()
    return {
      top:  (bbox.e.y - node.offsetHeight / 2),
      left: (bbox.e.x)
    }
  }

  function direction_w() {
    var bbox = getScreenBBox()
    return {
      top:  (bbox.w.y - node.offsetHeight / 2),
      left: (bbox.w.x - node.offsetWidth)
    }
  }

  function direction_nw() {
    var bbox = getScreenBBox()
    return {
      top:  (bbox.nw.y - node.offsetHeight),
      left: (bbox.nw.x - node.offsetWidth)
    }
  }

  function direction_ne() {
    var bbox = getScreenBBox()
    return {
      top:  (bbox.ne.y - node.offsetHeight),
      left: (bbox.ne.x)
    }
  }

  function direction_sw() {
    var bbox = getScreenBBox()
    return {
      top:  (bbox.sw.y),
      left: (bbox.sw.x - node.offsetWidth)
    }
  }

  function direction_se() {
    var bbox = getScreenBBox()
    return {
      top:  (bbox.se.y),
      left: (bbox.se.x)
    }
  }

  // Private - gets the screen coordinates of a shape
  //
  // Given a shape on the screen, will return an SVGPoint for the directions
  // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
  // sw(southwest).
  //
  //    +-+-+
  //    |   |
  //    +   +
  //    |   |
  //    +-+-+
  //
  // Returns an Object {n, s, e, w, nw, sw, ne, se}
  function getScreenBBox() {
    var targetel   = target || event.target;

    while ('undefined' === typeof targetel.getScreenCTM && 'undefined' === targetel.parentNode) {
        targetel = targetel.parentNode;
    }

    var bbox       = {},
        matrix     = targetel.getScreenCTM(),
        tbbox      = targetel.getBBox(),
        width      = tbbox.width,
        height     = tbbox.height,
        x          = tbbox.x,
        y          = tbbox.y

    point.x = x
    point.y = y
    bbox.nw = point.matrixTransform(matrix)
    point.x += width
    bbox.ne = point.matrixTransform(matrix)
    point.y += height
    bbox.se = point.matrixTransform(matrix)
    point.x -= width
    bbox.sw = point.matrixTransform(matrix)
    point.y -= height / 2
    bbox.w  = point.matrixTransform(matrix)
    point.x += width
    bbox.e = point.matrixTransform(matrix)
    point.x -= width / 2
    point.y -= height / 2
    bbox.n = point.matrixTransform(matrix)
    point.y += height
    bbox.s = point.matrixTransform(matrix)

    return bbox;
  }

  var direction_callbacks = {
    n:  direction_n,
    s:  direction_s,
    e:  direction_e,
    w:  direction_w,
    nw: direction_nw,
    ne: direction_ne,
    sw: direction_sw,
    se: direction_se
  },
  directions = Object.keys(direction_callbacks);

  return _impl;
}

var DEFAULT_SIZE = 420;
var DEFAULT_ASPECT = 160 / 420;
var DEFAULT_MARGIN = 26;  // white space
var DEFAULT_INSET = 24;   // scale space
var DEFAULT_TICK_FORMAT_INDEX = ',d';
var DEFAULT_TICK_COUNT = 4;
var DEFAULT_SCALE = 42; // why not
var DEFAULT_HIGHLIGHT_TEXT_PADDING = 2;
var DEFAULT_HIGHLIGHT_SIZE = 14;
var DEFAULT_HIGHLIGHT_TEXT_SCALE = 8;

var PAD_SCALE = 8;

var objectId = 0;

function bars(id) {
  objectId++;

  var classed = 'chart-bars', 
      theme = 'light',
      background = undefined,
      width = DEFAULT_SIZE,
      height = null,
      margin = DEFAULT_MARGIN,
      style = undefined,
      scale = 1.0,
      logValue = 0,
      barSize = 6,
      rotateIndex = 0,
      rotateValues = 0,
      fill = null,
      orientation = 'left',
      minValue = null,
      maxValue = null,
      inset = DEFAULT_INSET,
      tickFormatValue = null,
      tickFormatIndex = DEFAULT_TICK_FORMAT_INDEX,
      labelTime = null,
      tickCountValue = DEFAULT_TICK_COUNT,
      tickCountIndex = null,
      tickDisplayValue = null,
      grid = true,
      label = null,
      language = null,
      stacked = true,
      legend = null,
      highlight = null,
      displayTip = -1,
      legendOrientation = 'bottom',
      displayHtml = null,
      value = function (d) {
        if (Array.isArray(d)) {
          return d;
        }
        if (typeof d === 'object') {
          d = d.v;
        }
        if (!Array.isArray(d)) {
            d = [ d ];
        }          

        return d;
      };

  
  function _impl(context) {
    var selection = context.selection ? context.selection() : context,
        transition = (context.selection !== undefined);

    var ldg = legend;
    if (legend != null) {
      if (!Array.isArray(legend)) {
        ldg = [ legend ];
      } else if (legend.length === 0) {
        ldg = null;
      }
    }
    
    var hlt = highlight;
    if (highlight == null) {
      hlt = [];
    } else if (!Array.isArray(highlight)) {
      hlt = [ highlight ];
    }   
    
    var formatTime = null;
    if (labelTime != null) {
      var locale = formatLocale$1(time$1(language).d3);
      formatTime = locale.format(labelTime);
    }

    var _background = background;
    if (_background === undefined) {
      _background = display$1[theme].background;
    }

    defaultLocale(units(language).d3);

    var fnBarSize = function (I) { return barSize < 0.0 ? Math.max(I(-barSize), 1) : barSize; };
       
    var ran = random$1(presentation10$1.standard.slice().reverse());
    var icolors = function (d, i) { return ran(i); };
      
    selection.each(function() {
      var node = select(this);  
      var sh = height || Math.round(width * DEFAULT_ASPECT);

      var sid = null;
      if (id) sid = 'svg-' + id;
      var root = svg(sid).width(width).height(sh).margin(margin).scale(scale).background(_background);
      var tnode = node;
      if (transition === true) {
        tnode = node.transition(context);
      }
      tnode.call(root);
      
      var snode = node.select(root.self());

      var _displayHtml = displayHtml;
      if (_displayHtml == null) {
        _displayHtml = function (d,i) { return value(d)[i]; };
      }

      var tid = null;
      if (id) tid = 'tip-' + id;
      var rtip = tip(tid);

      rtip.direction(orientation === 'top' ? 's' : 'n');

      var lid = null;
      if (id) lid = 'legend-' + id;
      var rlegend = svg$1(lid);   

      // Tip
      var _style = style;
      if (_style === undefined) {
        // build a style sheet from the embedded charts
        var w$1 = root.childWidth()
        _style = [ _impl, rtip, rlegend ].filter(function (c) { return c != null; }).reduce(function (p, c) { return p + c.defaultStyle(theme, w$1); }, '');
      }

      var defsEl = snode.select('defs');
      if (defsEl.empty()) {
        defsEl = snode.append('defs');
      }

      var styleEl = defsEl.selectAll('style' + (id ?  '#style-bars-' + id : '.style-' + classed)).data(_style ? [ _style ] : []);
      styleEl.exit().remove();
      styleEl = styleEl.enter()
                  .append('style')
                    .attr('type', 'text/css')
                    .attr('id', (id ?  'style-bars-' + id : null))
                    .attr('class', (id ?  null : 'style-' + classed))
                  .merge(styleEl);
      styleEl.text(function (s) { return s; });

      var elmS = snode.select(root.child());
      elmS.call(rtip);


      var _inset = inset;
      if (typeof _inset === 'object') {
        _inset = { top: _inset.top, bottom: _inset.bottom, left: _inset.left, right: _inset.right };
      } else {
        _inset = { top: _inset, bottom: _inset, left: _inset, right: _inset };
      }

      var cid = id != null ? 'clip-bars-' + id : 'clip-bars-' + objectId;
    
      var g = elmS.select(_impl.self())
      if (g.empty()) {
        g = elmS.append('g').attr('class', classed).attr('id', id);
        g.append('g').attr('class', 'axis-v axis');
        g.append('g').attr('class', 'axis-i axis');
        g.append('g').attr('class', 'legend');
        g.append('clipPath').attr('id', cid).append('rect');
        g.append('g').attr('class', 'stacks').attr('clip-path', ("url(#" + cid + ")"));
      }
 

      var data = node.datum() || [];
      var vdata = data.map(function(d) {
        var a = value(d);
        if (stacked) {
          var t = 0.0;
          return a.map(function (v) { 
            var z = t;
            t += v;
            z = (logValue !== 0 && z === 0.0 ? z = 1.0 : z);
            return [z, t];
          }).reverse();
        } else {
          return a.map(function (v) { return [logValue === 0 ? 0 : 1, v]; });
        }
      });
      
      (function (_data, _vdata) {
        var ht = function(v, i) { 
          var d = _data[v.i];
          if (stacked === true) {
            i = _vdata[v.i].length - i - 1;
          }
          return _displayHtml(d, i)
        }
        rtip.html(ht);
      })(data, vdata);


      var maxSeries = 1;
      var twoD = false;
  
      var maxV = max(vdata, function (d) { 
        var l = d.length;
        
        if (l > 1) {
          maxSeries = Math.max(maxSeries, l);
          twoD = true;
        }        
        return max(d, function (v) { return v[1]; });
      });

      var minV = minValue;
      if (minV == null) {
        minV = min(vdata, function (d) { return min(d, function (v) { return v[1]; }); });
        if (minV > 0) {
          minV = logValue === 0 ? 0 : 1;
        }
      }
      
      var mm = [ minV, maxV ];
            
      if (mm[0] === mm[1]) mm[0] = 0;
      
      if (maxValue != null) mm[1] = maxValue;
      
      if (mm[0] === undefined) mm[0] = 0;
      if (mm[1] === undefined) mm[1] = DEFAULT_SCALE;

      function _makeFillFn() {
        var colors = function () { return fill; };
        if (fill == null) {
          if (twoD) {
            // data has nested stacks, use the series presentation
            var rnd = random$1(presentation10$1.standard);
            colors = function (d, i) { return rnd(i); };          
          } else {
            colors = function () { return presentation10$1.standard[0]; };
          }
        } else if (fill === 'series') {
          var rnd$1 = random$1(presentation10$1.standard);
          colors = function (d, i) { return rnd$1(i); };
        } else if (fill === 'global') {
          var rnd$2 = random$1(presentation10$1.standard);
          var count = -1;
          colors = function () { return (count++, rnd$2(count)); };
        } else if (typeof fill === 'function') {
          colors = fill;
        } else if (Array.isArray(fill)) {
          var userFill = fill.slice();
          if (stacked) userFill.reverse();
          var count$1 = -1;
          colors = function () { return (count$1++, userFill[ count$1 % userFill.length ]); }
        }
        return colors;  
      }

            
      var w = root.childWidth(),
          h = root.childHeight();
      
      if (ldg !== null) {
        var lchart = rlegend.width(w).height(h).inset(0).fill(fill).orientation(legendOrientation);

        _inset = lchart.childInset(_inset);

        elmS.datum(ldg).call(lchart);
      }            
      elmS.datum(data);

      g.select('#' + cid).select('rect')
        .attr('x', _inset.left + (orientation === 'left' ? widths$1.axis : 0))
        .attr('y', _inset.top + (orientation === 'top' ? widths$1.axis : 0))
        .attr('width', w - (orientation === 'right' ? (_inset.right + _inset.left) : 0))
        .attr('height', h - (orientation === 'bottom' ? (_inset.bottom + _inset.top) : 0));    
 

      var colors = _makeFillFn();
            
      var rects = g.select('g.stacks').selectAll('g.stack').data(data);
      rects.exit().remove();
      rects = rects.enter().append('g').attr('class', 'stack').merge(rects);

      var sV = linear(); 
      if (logValue > 0) sV = log().base(logValue);
      var scaleV = sV.domain(mm);
      
      var sI = linear(); 
      var domainI = [ 0, DEFAULT_SCALE ];
      if (vdata.length > 4) {
        domainI = [ 0, vdata.length ];
      } else if (vdata.length > 0) {
        domainI = [ -1, vdata.length ]
      }
      var scaleI = sI.domain(domainI);

      var ticks = tickCountIndex;
      if (ticks == null) {
        ticks = Math.min(DEFAULT_TICK_COUNT, vdata.length - 1);
      }

      var labelFn = label;
      if (labelFn == null) {
        var scaleIFormat = scaleI.tickFormat(ticks, tickFormatIndex);
        
        labelFn = function (i) {
          var d = data[i];
          if (d != null && d.l !== undefined) {
            if (formatTime != null ) {
              return formatTime(d.l);
            }
            return d.l;
          }
          if (formatTime != null ) {
            return formatTime(i);
          }
          return scaleIFormat(i);
        };
      }


      // negative values need a center line
      var aZ = g.select('line.axis-z');
      if (mm[0] < 0) {
        if (aZ.empty()) aZ = g.append('line').attr('class', 'axis-z axis grid');
      } else {
        aZ.remove();
      }

      var toI = 0.0,
          fromI = 0.0,
          gridSize = 0.0,
          fnAttrV = null,
          fnAttrVV = null,
          attrV = '',
          attrO = '',
          attrVV = '',
          attrIV = '',
          axisV = null,
          axisI = null,
          anchorI = null,
          translateV = '',
          translateI = '';
            
      if (orientation === 'top' || orientation === 'left') {
        var toV = w - _inset.right;
        var fromV = _inset.left;
        toI = h - _inset.bottom;
        fromI = _inset.top;
        
        gridSize = (_inset.top + _inset.bottom) - h;
        attrV = 'x';
        attrO = 'y';        
        attrVV = 'width';
        attrIV = 'height';
        axisV = axisBottom;
        axisI = axisLeft;  
        translateV = 'translate(0,' + (h - _inset.bottom) + ')';
        translateI = 'translate(' + _inset.left + ',0)';
        
        if (orientation === 'top') {
          toV = h - _inset.bottom; fromV = _inset.top;
          toI = w - _inset.right; fromI = _inset.left;
          gridSize = (_inset.left + _inset.right) - w;
          attrV = 'y'; attrO = 'x'; attrIV = 'width'; attrVV = 'height'; 
          axisV = axisLeft; axisI = axisTop;
          translateV = 'translate(' + _inset.left + ', 0)';
          translateI = 'translate(0, ' + _inset.top + ')';
          anchorI = rotateIndex > 0 ? 'end' : rotateIndex < 0 ? 'start' : 'middle';
        }
        
        scaleI = scaleI.rangeRound([fromI, toI]);
        scaleV = scaleV.range([fromV, toV]);

        var t0$1 = scaleV(0);

        fnAttrV = function (z, d) { return mm[0] < 0 && d < 0 ? scaleV(d) : (mm[0] < 0 ? t0$1 : Math.min(scaleV(d), scaleV(z)) ); };
        fnAttrVV = function (z, d) { return mm[0] < 0 && d < 0 ? t0$1 - scaleV(d) :  Math.max(scaleV(Math.abs(d)) - (mm[0] < 0 ? t0$1 : scaleV(Math.abs(z))), 1); };
      } else if (orientation === 'bottom' || orientation === 'right') {
        var toV$1 = w - _inset.right;
        var fromV$1 = _inset.left;
            
        toI = h - _inset.bottom;
        fromI = _inset.top;
        gridSize = (_inset.top + _inset.bottom) - h;
        attrV = 'x';
        attrO = 'y'; 
        attrVV = 'width';
        attrIV = 'height';
        axisV = axisBottom;
        axisI = axisRight;
        translateV = 'translate(0,' + (h - _inset.bottom) + ')';
        translateI = 'translate(' + (w - _inset.right) + ',0)';        
                
        if (orientation === 'bottom') {
          toV$1 = h - _inset.bottom; fromV$1 = _inset.top;
          toI = w - _inset.right; fromI = _inset.left;
          gridSize = (_inset.left + _inset.right) - w;
          attrV = 'y'; attrO = 'x'; attrIV = 'width'; attrVV = 'height';
          axisV = axisLeft; axisI = axisBottom;
          translateV = 'translate(' + _inset.left + ', 0)';
          translateI = 'translate(0, ' + (h - _inset.bottom) + ')';          
          anchorI = rotateIndex > 0 ? 'start' : rotateIndex < 0 ? 'end' : 'middle';
        }        
        
        scaleI = scaleI.rangeRound([fromI, toI]);
        scaleV = scaleV.range([toV$1, fromV$1]);

        var t0$2 = scaleV(0);
                
        fnAttrV = function (z, d) { return mm[0] < 0 && d < 0 ? t0$2 : Math.min(scaleV(d), scaleV(z) - 1); };
        fnAttrVV = function (z, d) { return mm[0] < 0 && d < 0 ? scaleV(d) - t0$2 : Math.max((mm[0] < 0 ? t0$2 : scaleV(Math.abs(z))) - scaleV(Math.abs(d)), 1); };
      }

      var formatValue = tickFormatValue;
      if (logValue > 0 && formatValue == null) {
        formatValue = '.0r';
      }

      var aV = axisV(scaleV)
        .tickPadding(PAD_SCALE)
        .ticks(tickCountValue, (formatValue == null ? scaleV.tickFormat(tickCountValue) : formatValue));
      if (grid) {
        aV.tickSizeInner(gridSize);
      }
      if (tickDisplayValue) {
        aV.tickFormat(tickDisplayValue);
      }
      
      var gaV = g.select('g.axis-v');
      if (transition === true) {
        gaV = gaV.transition(context);
      }  
      gaV.attr('transform', translateV)
        .call(aV)
        .selectAll('line')
          .attr('class', grid ? 'grid' : null);

      gaV.selectAll('text').attr('transform', 'rotate(' + rotateValues + ')');

      var aI = axisI(scaleI)
                  .tickValues(vdata.map(function (d,i) { return i; }))
                  .tickFormat(labelFn);
      
      var gaI = g.select('g.axis-i');
      if (transition === true) {
        gaI = gaI.transition(context);
      }  
      gaI.attr('transform', translateI).call(aI);
      
      gaI.selectAll('text')
        .attr('transform', 'rotate(' + rotateIndex + ')')   
        .attr('text-anchor', anchorI);
      
      var t0 = scaleV(0);
      if (!isFinite(t0)) t0 = 0.0; // e.g. log scales

      var c0 = t0 + 0.5;
      if (orientation === 'bottom' || orientation === 'top') {
        aZ.attr('y1', c0).attr('y2', c0).attr('x1', _inset.left).attr('x2', toI);
      } else {
        aZ.attr('x1', c0).attr('x2', c0).attr('y1', _inset.top).attr('y2', toI);
      }

      var sz = fnBarSize(scaleI);

      var r = rects.attr('transform', function (d, i) { return 'translate(' + (attrV !== 'x' ? 
            ((scaleI(i) - sz/2) + "," + (orientation === 'top' ? widths$1.axis : 0)) : 
            ((orientation === 'left' ? widths$1.axis : 0) + "," + (scaleI(i) - sz/2))
          ) + ')'; })
                    .data(function (d) { return (d == null) ? [] : vdata; })
                    .selectAll('rect')
                    .data(function (d, i) { return d.map(function (v) { return ({ d: v, i: i }); }); });
      r.exit().remove();
      r = r.enter()
            .append('rect')
            .merge(r);

      r.on('mouseover', rtip.show).on('mouseout', rtip.hide);

      if (transition === true) {
        r = r.transition(context);
      }              
            
      r.attr(attrV, function (d,i) { return fnAttrV(d.d[0], d.d[1], i); })
            .attr(attrVV, function (d, i) { return fnAttrVV(d.d[0], d.d[1], i); })
            .attr(attrO, function (d, i) { return stacked ? 0 : (i - ((maxSeries - 1) / 2)) * sz; }) // center the series when not stacked
            .attr(attrIV, sz)
            .attr('fill', function (d, i) { return colors(d.d[1], i); });

      var hls = g.selectAll('.highlight').data(hlt);
      hls.exit().remove();
      var nhls = hls.enter().append('g').attr('class', 'highlight');
      hls = nhls.merge(hls);
      
      nhls.append('rect').attr('class', 'marker');
      nhls.append('rect').attr('class', 'label-background');
      nhls.append('text').attr('class', 'label')
          .attr('dominant-baseline', 'text-before-edge')
          .attr('text-anchor', 'start');    
      
      hls.attr('transform', function (d) { return 'translate(' + ( attrV === 'x' ? (scaleV(d) + ',0') : ('0,' + scaleV(d)) ) + ')'; });
      hls.selectAll('rect.marker')
        .attr(attrVV, 2)
        .attr(attrO, fromI)
        .attr(attrIV, toI - fromI)
        .attr('fill', icolors);
      
      function textForData(d) {
        if (tickDisplayValue != null) {
          return tickDisplayValue(d);
        }
        if (formatValue != null) {
          return format(formatValue)(d);
        }
        return scaleV.tickFormat(tickCountValue)(d);
      }

      
      hls.selectAll('rect.label-background')
        .attr(attrV, 0) // TODO: Position wrong for left / right charts
        .attr(attrO, function (d) { return toI - (DEFAULT_HIGHLIGHT_TEXT_PADDING * 2 + textForData(d).length * DEFAULT_HIGHLIGHT_TEXT_SCALE); })
        .attr('height', DEFAULT_HIGHLIGHT_SIZE + 1)
        .attr('width', function (d) { return DEFAULT_HIGHLIGHT_TEXT_PADDING * 2 + textForData(d).length * DEFAULT_HIGHLIGHT_TEXT_SCALE; })
        .attr('fill', icolors);
      
      
      hls.selectAll('text')
        .attr(attrO, function (d) { return toI - (DEFAULT_HIGHLIGHT_TEXT_PADDING + textForData(d).length * DEFAULT_HIGHLIGHT_TEXT_SCALE); })
        .text(function (d) { return textForData(d); });
        
      if (displayTip > -1) {
        var no = r.nodes();
        if (no.length > 0) {
          rtip.show(no[0]); //TODO: incorrect layout on bricks.html 
        }
      }
    });
    
  }
  
  _impl.self = function() { return 'g' + (id ?  '#' + id : '.' + classed); }

  _impl.id = function() {
    return id;
  };

  _impl.defaultStyle = function (_theme, _width) { return ("\n                  " + (fonts$1.fixed.cssImport) + "\n                  " + (fonts$1.variable.cssImport) + "  \n                  " + (_impl.self()) + " .axis line, \n                  " + (_impl.self()) + " .axis path { \n                                              shape-rendering: crispEdges; \n                                              stroke-width: " + (widths$1.axis) + "; \n                                              stroke: none;\n                                            }\n                  " + (_impl.self()) + " g.axis-v line, \n                  " + (_impl.self()) + " g.axis-v path { \n                                              stroke: " + (display$1[_theme].axis) + ";\n                                            }\n                                            \n                  " + (_impl.self()) + " g.axis-i line, \n                  " + (_impl.self()) + " g.axis-i path { \n                                              stroke: " + (display$1[_theme].axis) + "; \n                                            }\n                                              \n                  " + (_impl.self()) + " text { \n                                        font-family: " + (fonts$1.variable.family) + ";\n                                        font-weight: " + (fonts$1.variable.weightMonochrome) + ";                \n                                      }\n\n                  " + (_impl.self()) + " g.highlight {\n                                                pointer-events: none; \n                                                opacity: 0.66;\n                                              }\n\n                  " + (_impl.self()) + " .axis text { \n                                    font-family: " + (fonts$1.fixed.family) + ";                \n                                    font-weight: " + (fonts$1.fixed.weightMonochrome) + ";  \n                                    fill: " + (display$1[_theme].text) + "\n                                  }\n                  " + (_impl.self()) + " g.highlight text { \n                                    font-family: " + (fonts$1.fixed.family) + ";\n                                    font-size: " + (fonts$1.fixed.sizeForWidth(_width)) + ";                \n                                    font-weight: " + (fonts$1.fixed.weightMonochrome) + ";  \n                                    fill: " + (display$1[_theme].text) + "\n                                  }                \n                  \n                  " + (_impl.self()) + " g.axis-v line.grid,\n                  " + (_impl.self()) + " g.axis-i line.grid { \n                                             stroke-width: " + (logValue > 0 ? widths$1.axis : widths$1.grid) + "; \n                                             stroke-dasharray: " + (dashes$1.grid) + ";\n                                             stroke: " + (display$1[_theme].grid) + ";\n                                            }\n\n                  " + (_impl.self()) + " g.axis-i g.tick line.grid.first,                  \n                  " + (_impl.self()) + " g.axis-v g.tick line.grid.first {\n                                              stroke: none;\n                                            }\n                  " + (_impl.self()) + " line.axis-z {\n                                            stroke-width: " + (widths$1.grid) + ";\n                                            stroke: " + (display$1[_theme].axis) + ";\n                                          }       \n                "); };
    
  _impl.classed = function(value) {
    return arguments.length ? (classed = value, _impl) : classed;
  };
    
  _impl.background = function(value) {
    return arguments.length ? (background = value, _impl) : background;
  };

  _impl.theme = function(value) {
    return arguments.length ? (theme = value, _impl) : theme;
  };  

  _impl.size = function(value) {
    return arguments.length ? (width = value, height = null, _impl) : width;
  };
    
  _impl.width = function(value) {
    return arguments.length ? (width = value, _impl) : width;
  };  

  _impl.height = function(value) {
    return arguments.length ? (height = value, _impl) : height;
  }; 

  _impl.scale = function(value) {
    return arguments.length ? (scale = value, _impl) : scale;
  }; 

  _impl.margin = function(value) {
    return arguments.length ? (margin = value, _impl) : margin;
  };   

  _impl.logValue = function(value) {
    return arguments.length ? (logValue = value, _impl) : logValue;
  }; 

  // if > 0, pixels size. if < 0, relative to the interspacing [-1.0 to 0.0]
  _impl.barSize = function(value) {
    return arguments.length ? (barSize = value, _impl) : barSize;
  }; 

  _impl.fill = function(value) {
    return arguments.length ? (fill = value, _impl) : fill;
  };  

  _impl.orientation = function(value) {
    return arguments.length ? (orientation = value, _impl) : orientation;
  };  
  
  _impl.minValue = function(value) {
    return arguments.length ? (minValue = value, _impl) : minValue;
  };  

  _impl.maxValue = function(value) {
    return arguments.length ? (maxValue = value, _impl) : maxValue;
  };  

  _impl.inset = function(value) {
    return arguments.length ? (inset = value, _impl) : inset;
  };  

  _impl.tickCountIndex = function(value) {
    return arguments.length ? (tickCountIndex = value, _impl) : tickCountIndex;
  };  

  _impl.tickCountValue = function(value) {
    return arguments.length ? (tickCountValue = value, _impl) : tickCountValue;
  };  

  _impl.tickFormatIndex = function(value) {
    return arguments.length ? (tickFormatIndex = value, _impl) : tickFormatIndex;
  };  

  _impl.tickFormatValue = function(value) {
    return arguments.length ? (tickFormatValue = value, _impl) : tickFormatValue;
  };  

  _impl.tickDisplayValue = function(value) {
    return arguments.length ? (tickDisplayValue = value, _impl) : tickDisplayValue;
  };  

  _impl.style = function(value) {
    return arguments.length ? (style = value, _impl) : style;
  }; 

  _impl.grid = function(value) {
    return arguments.length ? (grid = value, _impl) : grid;
  };
  
  _impl.value = function(valuep) {
    return arguments.length ? (value = valuep, _impl) : value;
  };
  
  _impl.label = function(value) {
    return arguments.length ? (label = value, _impl) : label;
  };  
  
  _impl.labelTime = function(value) {
    return arguments.length ? (labelTime = value, _impl) : labelTime;
  };    
  
  _impl.language = function(value) {
    return arguments.length ? (language = value, _impl) : language;
  };   
  
  _impl.stacked = function(value) {
    return arguments.length ? (stacked = value, _impl) : stacked;
  };    
  
  _impl.legend = function(value) {
    return arguments.length ? (legend = value, _impl) : legend;
  };  

  _impl.displayHtml = function(value) {
    return arguments.length ? (displayHtml = value, _impl) : displayHtml;
  }; 

  _impl.displayTip = function(value) {
    return arguments.length ? (displayTip = value, _impl) : displayTip;
  };   
  
  _impl.highlight = function(value) {
    return arguments.length ? (highlight = value, _impl) : highlight;
  };    
  
  _impl.legendOrientation = function(value) {
    return arguments.length ? (legendOrientation = value, _impl) : legendOrientation;
  };  
     
  _impl.rotateIndex = function(value) {
    return arguments.length ? (rotateIndex = value, _impl) : rotateIndex;
  }; 
  
  _impl.rotateValues = function(value) {
    return arguments.length ? (rotateValues = value, _impl) : rotateValues;
  };        
            
  return _impl;
}

var SCROLL_DURATION = 200;

// Adapted from https://coderwall.com/p/hujlhg/smooth-scrolling-without-jquery
function smooth_scroll_to(element, target, duration) {
    target = Math.round(target);
    duration = Math.round(duration);
    if (duration < 0) {
        return Promise.reject('bad duration');
    }
    if (duration === 0) {
        element.scrollTop = target;
        return Promise.resolve('no-duration');
    }

    var start_time = Date.now();
    var end_time = start_time + duration;

    var start_top = element.scrollTop;
    var distance = target - start_top;

    // based on http://en.wikipedia.org/wiki/Smoothstep
    var smooth_step = function(start, end, point) {
        if (point <= start) {
            return 0;
        }
        if (point >= end) {
            return 1;
        }
        var x = (point - start) / (end - start); // interpolation
        return x * x * (3 - 2 * x);
    }

    return new Promise(function(resolve, reject) {
        // This is to keep track of where the element's scrollTop is
        // supposed to be, based on what we're doing
        var previous_top = element.scrollTop;

        var timer = null;
        // This is like a think function from a game loop
        var scroll_frame = function() {
            /*
            // This logic is too fragile
            if(element.scrollTop != previous_top) {
                window.clearInterval(timer);
                reject('interrupted');
                return;
            }
            */
            // set the scrollTop for this frame
            var now = Date.now();
            var point = smooth_step(start_time, end_time, now);
            var frameTop = Math.round(start_top + (distance * point));
            element.scrollTop = frameTop;

            // check if we're done!
            if (now >= end_time) {
                window.clearInterval(timer);
                resolve('done');
                return;
            }

            // If we were supposed to scroll but didn't, then we
            // probably hit the limit, so consider it done; not
            // interrupted.
            if (element.scrollTop === previous_top && element.scrollTop !== frameTop) {
                window.clearInterval(timer);
                resolve('limit');
                return;
            }
            previous_top = element.scrollTop;
        }

        // boostrap the animation process
        timer = setInterval(scroll_frame, 10);
    });
}

function clickFor(to, offset) {
    return function(evt) {
        var target = document.getElementById(to);
        if (target === undefined) {
            return true;
        }
        offset = offset || 0;
        var delta = getAbsoluteBoundingRect(target).top + offset;
        smooth_scroll_to(document.body, delta, SCROLL_DURATION).catch(function(e) {
            console.error(e);
        });
        evt.preventDefault();
        return false;
    }
}

var scrollNodes = [];

function throttle(type, name, obj) {
    obj = obj || window;
    var running = false;
    var func = function() {
        if (running) {
            return;
        }
        running = true;
        requestAnimationFrame(function() {
            obj.dispatchEvent(new CustomEvent(name));
            running = false;
        });
    };
    obj.addEventListener(type, func);
}

function onScroll() {
    var pos = window.scrollY;
    scrollNodes.forEach(function(params) {
        var node = params[0];
        var current = params[1];
        var cls = params[2];
        var extents = params[4];

        var state = false;
        for (var i = 0; i < extents.length; i++) {
            var extent = extents[i];
            state = (pos > extent.start && pos < extent.end);
            if (state) {
                break;
            }
        }

        if (state === current) {
            return;
        }
        params[1] = state;
        if (state) {
            node.classList.add(cls);
        } else {
            node.classList.remove(cls);
        }
    });
}

function getAbsoluteBoundingRect(el) {
    var doc = document,
        win = window,
        body = doc.body,

        // pageXOffset and pageYOffset work everywhere except IE <9.
        offsetX = win.pageXOffset !== undefined ? win.pageXOffset :
        (doc.documentElement || body.parentNode || body).scrollLeft,
        offsetY = win.pageYOffset !== undefined ? win.pageYOffset :
        (doc.documentElement || body.parentNode || body).scrollTop,

        rect = el.getBoundingClientRect();

    if (el !== body) {
        var parent = el.parentNode;

        // The element's rect will be affected by the scroll positions of
        // *all* of its scrollable parents, not just the window, so we have
        // to walk up the tree and collect every scroll offset. Good times.
        while (parent !== body) {
            offsetX += parent.scrollLeft;
            offsetY += parent.scrollTop;
            parent = parent.parentNode;
        }
    }

    return {
        bottom: rect.bottom + offsetY,
        height: rect.height,
        left: rect.left + offsetX,
        right: rect.right + offsetX,
        top: rect.top + offsetY,
        width: rect.width
    };
}

function updateRegions() {
    scrollNodes.forEach(function(params) {
        var target = params[0].getBoundingClientRect();
        var overlap = params[3];

        var nodes = document.querySelectorAll(overlap);
        var all = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var ext = getAbsoluteBoundingRect(node);
            all.push({
                start: ext.top - target.height,
                end: ext.bottom
            });
        }
        params[4] = all;
    });
}

var Scroll = {
    initSmooth: function initSmooth(selector, offset) {
        var nodes = document.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var href = node.attributes.href;
            if (href === undefined || href.length === 0) {
                continue;
            }
            var to = href.nodeValue.toString();
            if (to.substr(0, 1) !== '#') {
                continue;
            }

            node.addEventListener('click', clickFor(to.substr(1), offset), false);
        }
    },
    toggleClass: function toggleClass(selector, cls, overlap) {
        var nodes = document.querySelectorAll(selector);
        if (nodes.length > 0) {
            window.addEventListener('optimizedResize', updateRegions);
            window.addEventListener('optimizedScroll', onScroll);
        }
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var param = [node, null, cls, overlap, []];

            // check for this node
            var found = false;
            for (var ii = 0; i < scrollNodes.length; i++) {
                if (scrollNodes[ii][0] == node) {
                    scrollNodes[ii] = param;
                    found = true;
                    break;
                }
            }
            if (!found) {
                scrollNodes.push(param);
            }
        }
        updateRegions();
        onScroll();
    },
    updateRegions: updateRegions
};

throttle('scroll', 'optimizedScroll');
throttle('resize', 'optimizedResize');

var style = document.createElement("style");
document.head.appendChild(style);
var sheet = style.sheet;

// NOTE: redsift-bundler doe snot support the import of string templates yet
// import heroTmpl from '../templates/hero.tmpl';

var RedsiftHero = function RedsiftHero(el, opts) {
  this.locators = {
    hero: '.hero',
    heroContainer: '.hero__container',
    heroContent: '.hero__content',
    heroHeader: '.hero__header',
    heroHeaderContent: '.hero__header__content',
    heroStickyHeader: '.hero-sticky-header',
    heroStickyHeaderActive: '.hero-sticky-header--active',
    scrollDownArrow: '#smooth'
  }

  this.downArrowHtml = '<div class="down-arrow"></div>';
  this.hasStickyHeader = false;

  // TODO: replace with string import of template when support is added in redsift-bundler!
  var heroTmpl = "\n      <div class=\"hero\">\n          <div class=\"hero__header\">\n              <h3 class=\"hero__header__content\"><!-- yields header --></h3>\n          </div>\n          <div class=\"hero__container\">\n              <div class=\"hero__content\"><!-- yields content --></div>\n          </div>\n      </div>\n    ";

  this._setupElement(el, heroTmpl, opts);
};

RedsiftHero.prototype.setHeader = function setHeader (text) {
  this.$headerContent.innerHTML = text;
};

RedsiftHero.prototype.setBgClass = function setBgClass (bgClass) {
  this.$hero.className += " " + bgClass;
};

RedsiftHero.prototype.enableStickyHeader = function enableStickyHeader (flag, triggerElSelector) {
    // NOTE: Do NOT use cached element here. For the first run these elements
    // are only cached after this feature is handled!

    if (flag) {
        var $header = document.querySelector(this.locators.heroHeader),
            $hero = document.querySelector(this.locators.hero);

        if ($header) {
          $header.classList.remove(this.locators.heroHeader.substr(1));
          $header.classList.add(this.locators.heroStickyHeader.substr(1));
            $hero.parentNode.parentNode.appendChild($header);
          } // else the sticky-header is already present on the page

          if (triggerElSelector && triggerElSelector != '') {
              try {
                  // TODO: change toggleClass signature to provide element list instead of selector
                //     for '.content' to be more flexible (i.e. provide first element after hero
                //     without having to know the name)
                Scroll.toggleClass(
                    this.locators.heroStickyHeader,
                    this.locators.heroStickyHeaderActive.substr(1),
                    // FIXXME: replace hardcoded '.content' with something appropriate (based on aboves TODO)!
                    triggerElSelector
                );
            } catch (err) {
                console.log('[redsift-ui/hero] Error enabling sticky header. Did you specify a valid element name for the "sticky-header" attribute?');
            }
        }

        this.hasStickyHeader = true;
    } else {
        var $header$1 = document.querySelector(this.locators.heroStickyHeader),
            $hero$1 = document.querySelector(this.locators.hero);

        if ($header$1) {
            $header$1.classList.add(this.locators.heroHeader.substr(1));
            $header$1.classList.remove(this.locators.heroStickyHeader.substr(1));
            $hero$1.insertBefore($header$1, $hero$1.firstChild);

            // TODO: remove toggleClass callback!

            this.hasStickyHeader = false;
        }
    }
};

RedsiftHero.prototype.enableScrollFeature = function enableScrollFeature (flag, scrollTarget) {
  if (flag) {
    this.$scrollFeature = this._createScrollFeatureElement(scrollTarget);
    this.$container.appendChild(this.$scrollFeature);

    var offset = this._getStickyHeaderHeight();
    Scroll.initSmooth(this.locators.scrollDownArrow, -offset);
  } else if (this.$scrollFeature && this.$scrollFeature.parentNode) {
    this.$scrollFeature.parentNode.removeChild(this.$scrollFeature);
  }
};

//----------------------------------------------------------
// Private API:
//----------------------------------------------------------

RedsiftHero.prototype._setupElement = function _setupElement (el, heroTmpl, opts) {
  // Get the user provided inner block of the element, replace the elements
  // content with the hero tree and insert the content at the correct place.
  var userTmpl = el.innerHTML;
  el.innerHTML = heroTmpl;

  var content = document.querySelector(this.locators.heroContent);
  content.innerHTML = userTmpl;

  // NOTE: handle sticky header before caching, as this.$header is set
  // differently depending this feature:
  if (opts.hasStickyHeader) {
    this.enableStickyHeader(true, opts.stickyHeaderTrigger);
  }

  this._cacheElements(opts.hasStickyHeader);

  if (opts.header) {
    this.setHeader(opts.header);
  }

  if (opts.bgClass) {
    this.setBgClass(opts.bgClass);
  }

  if (opts.scrollTarget) {
    this.enableScrollFeature(true, opts.scrollTarget);
  }
};

RedsiftHero.prototype._createScrollFeatureElement = function _createScrollFeatureElement (scrollTarget) {
  var a = document.createElement('a');

  a.id = this.locators.scrollDownArrow.substr(1);
  a.href = scrollTarget;
  a.innerHTML = this.downArrowHtml;

  // FIXXME: If the arrow is on the same height as the header it is not
  // clickable due to the z-index.

  return a;
};

RedsiftHero.prototype._getStickyHeaderHeight = function _getStickyHeaderHeight () {
    var height = 0;

    try {
        if (this.hasStickyHeader) {
            height = this.$header.getBoundingClientRect().height
        }
    } catch (err) {
        console.log('[redsift-ui/hero] Error enabling sticky header. Did you specify a valid element name for the "sticky-header" attribute?');
    }
};

// TODO: implement generic caching functionality, e.g. this.querySelector(selector, useCache)
RedsiftHero.prototype._cacheElements = function _cacheElements (hasStickyHeader) {
  this.$hero = document.querySelector(this.locators.hero);
  if (hasStickyHeader) {
    this.$header = document.querySelector(this.locators.heroStickyHeader);
  } else {
    this.$header = document.querySelector(this.locators.heroHeader);
  }
  this.$headerContent = document.querySelector(this.locators.heroHeaderContent);
  this.$container = document.querySelector(this.locators.heroContainer);
  this.$content = document.querySelector(this.locators.heroContent);
  this.$scrollFeature = undefined;
};

var RedsiftHeroWebComponent = (function (HTMLElement) {
  function RedsiftHeroWebComponent () {
    HTMLElement.apply(this, arguments);
  }

  if ( HTMLElement ) RedsiftHeroWebComponent.__proto__ = HTMLElement;
  RedsiftHeroWebComponent.prototype = Object.create( HTMLElement && HTMLElement.prototype );
  RedsiftHeroWebComponent.prototype.constructor = RedsiftHeroWebComponent;

  var prototypeAccessors = { header: {},bgClass: {},hasStickyHeader: {},stickyHeader: {},scrollTarget: {} };

  RedsiftHeroWebComponent.prototype.attachedCallback = function attachedCallback () {
    var stickyHeaderTrigger = this.stickyHeader;

    this.rsHero = new RedsiftHero(this, {
      hasStickyHeader: this.hasStickyHeader,
      stickyHeaderTrigger: stickyHeaderTrigger,
      header: this.header,
      bgClass: this.bgClass,
      scrollTarget: this.scrollTarget
    });
  };

  RedsiftHeroWebComponent.prototype.attributeChangedCallback = function attributeChangedCallback (attributeName, oldValue, newValue) {
    if (attributeName === 'scroll-target') {
      if (!newValue) {
        this.rsHero.enableScrollFeature(false);
      }

      if (newValue && !oldValue) {
        this.rsHero.enableScrollFeature(true, this.scrollTarget);
      }
    }

    if (attributeName === 'sticky-header') {
      if (this.hasStickyHeader) {
        if (!newValue || newValue == '') {
          console.log('[redsift-ui] WARNING: No selector specified with "sticky-header" attribute. No "hero-sticky-header--active" class will be added!');
        }
        this.rsHero.enableStickyHeader(true, this.stickyHeader);
      } else {
        this.rsHero.enableStickyHeader(false);
      }
    }
  };

  //----------------------------------------------------------------------------
  // Attributes:
  //----------------------------------------------------------------------------

  prototypeAccessors.header.get = function () {
    return this.getAttribute('header');
  };

  prototypeAccessors.header.set = function (val) {
    this.setAttribute('header', val);
  };

  prototypeAccessors.bgClass.get = function () {
    return this.getAttribute('bg-class');
  };

  prototypeAccessors.bgClass.set = function (val) {
    this.setAttribute('bg-class', val);
  };

  prototypeAccessors.hasStickyHeader.get = function () {
    var a = this.getAttribute('sticky-header');
    if (a == '' || a) {
      return true;
    }

    return false;
  };

  prototypeAccessors.stickyHeader.get = function () {
      return this.getAttribute('sticky-header');
  };

  prototypeAccessors.stickyHeader.set = function (val) {
    return this.setAttribute('sticky-header', val);
  };

  prototypeAccessors.scrollTarget.get = function () {
    return this.getAttribute('scroll-target');
  };

  prototypeAccessors.scrollTarget.set = function (val) {
    return this.setAttribute('scroll-target', val);
  };

  Object.defineProperties( RedsiftHeroWebComponent.prototype, prototypeAccessors );

  return RedsiftHeroWebComponent;
}(HTMLElement));

function registerHeroElement () {
    try {
        document.registerElement('rs-hero', RedsiftHeroWebComponent);
    } catch (e) {
        console.log('[redsift-ui] Element already exists: ', e);
    }
}

(function() {
  if ('registerElement' in document
      && 'import' in document.createElement('link')
      && 'content' in document.createElement('template')) {
    // platform is good!
    // register the element per default:
    registerHeroElement();
  } else {
    // polyfill the platform!
    var e = document.createElement('script');
    e.src = 'https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/0.7.22/CustomElements.js';
    document.body.appendChild(e);

    window.addEventListener('WebComponentsReady', function(e) {
      // register the element per default:
      registerHeroElement();
    });
  }
})();

function cardCreator(data){
  var familyExamples = {
    Cruciferous: 'broccoli, kale, cauliflower',
    'Green leafy': 'lettuce, spinach, parsley',
    Allium: 'onion, garlic, leek',
    'Yellow/Orange': 'pumpkin, butternut squash',
    Citrus: 'orange, lemon, grapefruit',
    Berry: 'strawberries, blackberries'
  };
  var parent = document.querySelector('#nscore');
  if(!parent) {
    console.error('missing parent node from html');
    return
  }
  parent.innerHTML = '';
  Object.keys(data).forEach(function (k) {
    var node = document.querySelector('#card-template');
    if(!node) {
      console.error('missing template node from html');
      return
    }
    var ct = document.querySelector('#card-template').cloneNode(true);
    var recBox = ct.content.querySelector('.card__box--recommend');
    var recBoxItems = recBox.querySelector('.card__box__items');
    var boughtBoxItems = ct.content.querySelector('.card__box--bought .card__box__items');
    var parentCard = ct.content.querySelector('.card');
    parentCard.classList.add('card--' + k.toLowerCase().replace(/\/|\s/, '-'));
    ct.content.querySelector('.card__family__name').innerHTML = k;
    ct.content.querySelector('.card__family__examples').innerHTML = [familyExamples[k], '...'].join(', ');
    var s = data[k].suggestions;
    if(s.length > 0){
      var e = Math.floor(Math.random() * s.length);
      recBoxItems.appendChild(createItem(s[e].name, s[e].score));
    }else{
      var starTemp = document.querySelector('#item-star');
      recBox.innerHTML = '';
      recBox.appendChild(document.importNode(starTemp.content, true));
    }

    var f = data[k].found;
    if(f.length > 0){
      f.map(function (d) { return boughtBoxItems.appendChild(createItem(d.name, d.score)); })
    }else{
      boughtBoxItems.innerHTML = 'Nothing in your history from this category';
    }

    parent.appendChild(document.importNode(ct.content, true));
  });
}

function createItem(name, score){
  var node = document.querySelector('#item-template');
  if(!node) {
    console.error('missing template node from html');
    return;
  }
  var t = node.cloneNode(true);
  t.content.querySelector('.item__name .item__name__label').innerHTML = name;
  t.content.querySelector('.item__score').innerHTML = score + "%";
  // 230px - 55px(number) = 175px / 100 = 1.75
  t.content.querySelector('.item__name').style.flex = "0 1 " + (1.75 * score) + "px";
  return document.importNode(t.content, true)
}

var Watercress = {"plural":"watercress","query":"watercress"};
var Chard = {"plural":"chard","query":"chard"};
var Spinach = {"plural":"spinach","query":"spinach"};
var Chicory = {"plural":"chicory","query":"chicory"};
var Parsley = {"plural":"parsley","query":"parsley"};
var Kale = {"plural":"kale","query":"kale"};
var Broccoli = {"plural":"broccoli","query":"broccoli"};
var Pumpkin = {"plural":"pumpkin","query":"pumpkin"};
var Kohlrabi = {"plural":"kohlrabi","query":"kohlrabi"};
var Cauliflower = {"plural":"cauliflower","query":"cauliflower"};
var Cabbage = {"plural":"cabbage","query":"cabbage"};
var Carrot = {"plural":"carrots","query":"carrot"};
var Tomato = {"plural":"tomatoes","query":"tomato"};
var Lemon = {"plural":"lemons","query":"lemon"};
var Strawberry = {"plural":"strawberries","query":"strawberry"};
var Radish = {"plural":"radish","query":"radish"};
var Orange = {"plural":"oranges","query":"orange"};
var Lime = {"plural":"limes","query":"lime"};
var Grapefruit = {"plural":"grapefruits","query":"grapefruit"};
var Turnip = {"plural":"turnips","query":"turnip"};
var Blackberry = {"plural":"blackberries","query":"blackberry"};
var Leek = {"plural":"leek","query":"leek"};
var ingredients = {
	Watercress: Watercress,
	Chard: Chard,
	Spinach: Spinach,
	Chicory: Chicory,
	Parsley: Parsley,
	Kale: Kale,
	Broccoli: Broccoli,
	Pumpkin: Pumpkin,
	Kohlrabi: Kohlrabi,
	Cauliflower: Cauliflower,
	Cabbage: Cabbage,
	Carrot: Carrot,
	Tomato: Tomato,
	Lemon: Lemon,
	Strawberry: Strawberry,
	Radish: Radish,
	Orange: Orange,
	Lime: Lime,
	Grapefruit: Grapefruit,
	Turnip: Turnip,
	Blackberry: Blackberry,
	Leek: Leek,
	"Chinese cabbage": {"plural":"chinese cabbage","query":"chinese_cabbage"},
	"Dandelion green": {"plural":"dandelion","query":"dandelion"},
	"Brussels sprout": {"plural":"brussels sprouts","query":"brussels_sprouts"},
	"Iceberg lettuce": {"plural":"iceberg lettuce","query":"iceberg_lettuce"},
	"Sweet potato": {"plural":"sweet potatoes","query":"sweet_potato"}
};

var CreateView = (function (SiftView) {
  function CreateView() {
    // You have to call the super() method to initialize the base class.
    SiftView.call(this);
    console.log('sift-ocado: view: init');

    // We subscribe to 'storageupdate' updates from the Controller
    this.controller.subscribe('countupdated', this.countUpdated.bind(this));
    this.controller.subscribe('suggestionsupdated', this.suggestionsUpdated.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  if ( SiftView ) CreateView.__proto__ = SiftView;
  CreateView.prototype = Object.create( SiftView && SiftView.prototype );
  CreateView.prototype.constructor = CreateView;

  /**
   * Sift lifecycle method 'presentView'
   * Called by the framework when the loadView callback in frontend/controller.js calls the resolve function or returns a value
   */
  CreateView.prototype.presentView = function presentView (value) {
    console.log('sift-ocado: view: presentView: ', value);
    this.renderTotalSection(value.data.count);
    this.renderCardsSection(value.data.suggestions);
  };


  CreateView.prototype.renderTotalSection = function renderTotalSection (data){
    var parseTime = utcParse('%Y%m');
    moment.utc();
    var months = {};
    for(var i = 0; i < 12; i++){
      var a = moment().subtract(i, 'months').format('YYYYMM');
      months[a] = null;
    }
    // find the earliest date we have data for the last year
    var min = Infinity;
    data.forEach(function (d) {
      min = Math.min(min, d.key);
      months[d.key] = +d.value;
    });

    this._counts = Object.keys(months)
      .filter(function (k) { return k >= min; })
      .map(function (d) { return ({
        l: parseTime(d).getTime(),
        v: months[d] ? [months[d]] : []
      }); })


    if(!this._expense) {
      this._expense = bars('monthly')
        .tickCountIndex('utcMonth') // want monthly ticks
        .tickDisplayValue(function (d) { return ("£" + d); }) // Force to £ for now
        .labelTime('%b') // use the smart formatter
        .orientation('bottom')
        .height(200)
        .tickFormatValue('($.0f');
    }
    this.onResize();
  };

  CreateView.prototype.onResize = function onResize () {
    var content = document.querySelector('.content__container--expand');
    var e = this._counts || [];
    var w = content.clientWidth * 0.8;
    var dat = e.slice(-12);
    var barSize = 6;
    var barSizeCoefficient = 0.7;
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
  };

  /**
   * Sift lifecycle method 'willPresentView'
   * Called when a sift starts to transition between size classes
   */
  CreateView.prototype.willPresentView = function willPresentView (value) {
    console.log('sift-ocado: view: willPresentView: ', value);
  };

  CreateView.prototype.renderCardsSection = function renderCardsSection (data){
    if (data.length === 0){
      return;
    }
    this.removeEmptyState();
    this.recipeSuggestion();
    cardCreator(data);
  };

  CreateView.prototype.removeEmptyState = function removeEmptyState (){
    document.querySelector('.scoresinfo').classList.remove('hide');
  };

  CreateView.prototype.recipeSuggestion = function recipeSuggestion (){
    var fArray = Object.keys(ingredients);
    var randomF = Math.floor(Math.random() * fArray.length);
    var pickedF = ingredients[fArray[randomF]];
    var node = document.querySelector('#hero-message');
    node.innerHTML = "Next time try a <a target=\"_blank\" href=\"http://www.bbc.co.uk/food/" + (pickedF.query) + "\">recipe</a> with " + (pickedF.plural) + "...";
  };

  /**
   * Custom methods defined by the developer
   */
  CreateView.prototype.countUpdated = function countUpdated (data) {
    console.log('sift-ocado: view: countUpdated: ', data);
    this.renderTotalSection(data);
  };

  CreateView.prototype.suggestionsUpdated = function suggestionsUpdated (data){
    this.renderCardsSection(data);
  };

  return CreateView;
}(SiftView));

registerSiftView(new CreateView(window));

return CreateView;

})));