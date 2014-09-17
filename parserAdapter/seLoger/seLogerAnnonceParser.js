var url = require('url')
  , Cheerio = require('cheerio')
  , request = require('request')
  , Q = require('q');


  module.exports = {
    parseAnnonce: function (_url, callback) {
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

          var infos = $(".description-liste").first().text();

          var reSurface = /.*surface de (.*m²).*/ig;
          var reHonoraires = /.*honoraires ttc : (.*€).*/ig;

          var result = {
            url: url,
            prix: $("#price").text().trim().replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," "),
            tel: $(".action__detail-tel").first().text().replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," "),
            description: $('p.description').first().text()
          };

          var surface = reSurface.exec(infos);
          if(surface) {
            result.surface = surface[1]
          }
          var hono = reHonoraires.exec(infos);
          if(hono) {
            result.honoraires = hono[1]
          }

          deferred.resolve(result);
        }
      });

      deferred.promise.nodeify(callback);
      return deferred.promise;
    }
  };




