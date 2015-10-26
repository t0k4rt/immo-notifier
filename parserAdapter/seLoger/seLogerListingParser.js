var urlParser = require('url')
  , Cheerio = require('cheerio')
  , request = require('request')
  , Q = require('q');

var SeLogerSearchAdapter = require('../../searchAdapter/seLoger/seLogerAdapter');

var provider = 'seloger';

  module.exports = {
    parseListing: function (searchObject, callback) {

      var deferred = Q.defer();

      SeLogerSearchAdapter
        .getListingUrl(searchObject)
        .then(function(_url){
          try{
            url = urlParser.parse(_url);
          }
          catch(e) {
            deferred.reject("URL "+_url+" is invalid");
          }

          request(url.href, function (error, response, body) {
            if(error || response.statusCode != 200) {
              deferred.reject(new Error('Could not fetch url content'));
            }
            else {
              $ = Cheerio.load(body);
              var articles = $("article");
              var result = [];
              articles.each(function (index, elt) {
                $a = $(elt).find(".listing_infos > h2 > a");
                result.push({id: elt.attribs.id, url: $a[0].attribs.href, provider: provider})
              });
              deferred.resolve(result);
            }
          });
        });

      deferred.promise.nodeify(callback);
      return deferred.promise;
    }
  };




