/**
 * Created by alexandre on 13/03/15.
 */

if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target, firstSource) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

var baseModel = {

  attributes: {},

  new: true,

  set: function(key, value) {
    if (key == null) return this;
    this.attributes[key] = value;
    return this;
  },

  get: function(key) {
    return this.attributes[key];
  },

  has: function(attr) {
    return this.get(attr) != null;
  },

  initialize: function(options){
    console.log('init object', options);
  },

  validate: function(){},

  serialize: function(){
    var clone = Object.assign({}, this.attributes);
    return JSON.stringify(clone);
  },

  unserialize: function(data){},

  url: function(){}
};


var model = function(attributes, options) {
  Object.assign(this, baseModel);
  this.attributes = attributes || {};
  this.initialize(options);
};


model.extend = function(_baseModel) {
  var ExtendedModel = Object.assign({}, baseModel, _baseModel);
  return function(attributes, options) {
    Object.assign(this, ExtendedModel);
    this.attributes = attributes || {};
    this.initialize(options);
  };
};

module.exports = model;

