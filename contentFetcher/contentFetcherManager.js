var urlParser = require('url')
  , Cheerio = require('cheerio')
  , request = require('request')
  , Q = require('q');

  module.exports = {
    parseContent: function(searchObject, Provider) {
      var contentProvider = new Provider();
      // todo : en fonction du search object, instantier les content fetcher requis
      var content = contentProvider.fetchContent(searchObject)
    }
  };


