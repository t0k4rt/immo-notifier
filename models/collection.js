/**
 * Created by alexandre on 13/03/15.
 */

var collection = {

  models: [],

  add: function(item) {
    this.models.push(item);
  },

  extend: function(extension) {
    return Object.assign({}, this, extension);
  },

  get: function(key) {
    return this.models[key];
  },

  has: function(model) {
    this.models.forEach(function(value) {
      if(value.get('id') == model.get('id'))
        return true;
    });
    return false;
  }

};

module.exports = collection;
