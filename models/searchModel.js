/**
 * Created by alexandre on 13/03/15.
 */
var model = require('./model');


module.exports = model.extend({

  initialize: function(attributes) {
    var attr = attributes || {};
    if(typeof attr.location == "undefined")
      attr.location = [];
    this.attributes = attr;
  },

  addLocation: function(zipCode) {
    this.attributes.location.push(zipCode);
  },

  removeLocation:function(zipCode) {
    var key = this.attributes.location.indexOf(zipCode);
    if(key > -1) {
      this.attributes.location.splice(key, 1);
    }
  }
});
