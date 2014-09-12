var express = require('express')
  , url = require('url')
  , Cheerio = require('cheerio')
  , request = require('request')
  , Q = require('q')
  , _ = require('lodash');

var RessourceModel = require('../models/ressource');

module.exports = function Router(app, mongoose, redisStore) {
  var router = express.Router();

  router.get('/', function(req, res) {
    var _url = "http://www.seloger.com/list.htm?ci=750103,750109,750110,750111,750117,750118,750119,750120&idtt=1&idtypebien=1&leadali=L001&orientation=VueetOrientation&pxmax=900&surfacemin=35&tri=d_dt_crea";


    // create promise, return parsed url
    Q.fcall(function () {return url.parse(_url)})
      //we first get the liste of articles from seloger page
      .then(function(ressourceParams){
        var deferred = Q.defer();
        request(ressourceParams.href, function (error, response, body) {
          if(error || response.statusCode != 200) {
            deferred.reject(new Error('Could not fetch url content'));
          }
          else {
            $ = Cheerio.load(body);
            var articles = $("article");
            var result = [];
            articles.each(function (index, elt) {
              $a = $(elt).find(".listing_infos > h2 > a");
              result.push({id: elt.attribs.id, url: $a[0].attribs.href})
            });
            deferred.resolve(result);
          }
        });
        return deferred.promise;
      })
      // we compare id list with stored id to get only new articles
      .then(function(result){
        function getNewSelogerUrl(value) {
          var deferred = Q.defer();
          redisStore.sismember('selogerIds', value.id, function(err, obj){
            if(err)
              deferred.reject(new Error(err));

            if(!obj) {
              redisStore.sadd('selogerIds', value.id);
              deferred.resolve(value.url);
            }
            else
              deferred.reject(new Error('seLogerId exists with id : '+value.id));
          });
          return deferred.promise;
        }

        var promises = [];
        result.forEach(function(value){
          promises.push(getNewSelogerUrl(value));
        });

        return Q.allSettled(promises);

      })
      // we then analyze the content of the page to parse meaningfull informations
      .then(function(newSeloger){
        function analyzeSelogerUrl(url) {
          var deferred = Q.defer();
          request(url, function (error, response, body) {
            if(error || response.statusCode != 200) {
              deferred.reject(new Error('Could not fetch url content'));
            }
            else {
              $ = Cheerio.load(body);

              var infos = $(".description-liste").first().text();

              var reSurface = /.*(surface.*m²).*/ig;
              var reHonoraires = /.*honoraires ttc : (.*€).*/ig;

              var result = {
                url: url,
                prix: $("#price").text().trim().replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," "),
                tel: $(".action__detail-tel").first().text().replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," "),
                surface: (reSurface.exec(infos))[1],
                honoraires: (reHonoraires.exec(infos))[1]
              };

              deferred.resolve(result);
            }
          });
          return deferred.promise;
        }

        var promises = [];
        newSeloger.forEach(function(elt){
          if(elt.state == 'fulfilled') {
            promises.push(analyzeSelogerUrl(elt.value))
          }
        });
        return Q.allSettled(promises);
      })
      .catch(function(error){
        //console.error(error);
      })
      .done(function(result){
        console.log(result);
        res.send(result);
      });
  });

  return router;
};





