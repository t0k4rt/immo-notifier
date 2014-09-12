var url = require('url')
  , Cheerio = require('cheerio')
  , request = require('request')
  , Q = require('q');

var provider = 'seloger';

  module.exports = {
    parseListing: function (_url, callback) {
      var deferred = Q.defer();

      try{
        _url = url.parse(_url)
      }
      catch(e) {
        deferred.reject("URL "+_url+" is invalid");
      }

      request(_url.href, function (error, response, body) {
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

      deferred.promise.nodeify(callback);
      return deferred.promise;
    }
  };




