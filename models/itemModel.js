/**
 * Created by alexandre on 13/03/15.
 */
var model = require('./model');
var urlParser = require('url');


module.exports = model.extend({

  initialize: function(options) {
    if(!(this.has('providerId') && this.has('providerName'))) {
      console.error('Provider id and provider name are missing');
      //throw new Error('Provider id and provider name are missing');
    }
    if(!this.has('_id'))
      this.set('_id', this.generateId());

    if(this.has('url')) {
      try {
        this.url = urlParser.parse(this.get('url'));
      }
      catch (e) {
        console.error(e);
      }
    }
  },

  validate: function() {
    if(typeof this.attributes.id == "undefined") {
      throw new Error('Id is missing');
    }
  },

  getId: function() {
    if(typeof this.attributes.id == "undefined")
      this.set('_id', this.generateId());

    return this.get('_id');
  },

  generateId: function(){
    var b = new Buffer(this.attributes.providerName + this.attributes.providerId);
    return b.toString('base64');
  }
});
