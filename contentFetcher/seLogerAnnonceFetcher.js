var urlParser = require('url')
  , Cheerio = require('cheerio')
  , request = require('request')
  , buildingModel = require('../models/buildingModel')
  , Q = require('q');

var SeLogerSearchAdapter = require('../searchAdapter/seLoger/seLogerAdapter');
var provider = 'seloger';

var parseListing = function parseListing(searchObject, callback) {
  var deferred = Q.defer();
  SeLogerSearchAdapter
    .getListingUrl(searchObject)
    .then(function (_url) {
      try {
        url = urlParser.parse(_url);
      }
      catch (e) {
        deferred.reject("URL " + _url + " is invalid");
      }

      request(url.href, function (error, response, body) {
        if (error || response.statusCode != 200) {
          deferred.reject(new Error('Could not fetch url content'));
        }
        else {
          $ = Cheerio.load(body);
          var articles = $("article");
          var result = [];
          articles.each(function (index, elt) {
            $a = $(elt).find(".listing_infos > h2 > a");
            try {
              _url = url.parse($a[0].attribs.href);
              result.push(new buildingModel({providerId: elt.attribs.id, url: _url, provider: provider}))
            } catch (e) {console.error('got a bad url for a building.');}
          });
          deferred.resolve(result);
        }
      });
    });

  deferred.promise.nodeify(callback);
  return deferred.promise;
};

//todo : normaliser le résultat d'une annonce
var parseAnnonce = function parseAnnonce(buildingModel, callback) {
  var deferred = Q.defer();

  request(buildingModel.url.href, function (error, response, body) {
    if (error || response.statusCode != 200) {
      deferred.reject(new Error('Could not fetch url content'));
    }
    else {
      $ = Cheerio.load(body);

      var infos = $(".description-liste").first().text();

      var reSurface = /.*surface de (.*m²).*/ig;
      var reHonoraires = /.*honoraires ttc : (.*€).*/ig;


      var surface = reSurface.exec(infos);
      if (surface) {
        buildingModel.set('surface', surface[1]);
      }
      var hono = reHonoraires.exec(infos);
      if (hono) {
        buildingModel.set('fee', hono[1]);
      }

      buildingModel
        .set('price', $("#price").text().trim().replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " "))
        .set('phoneContact', $(".action__detail-tel").first().text().replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " "))
        .set('description', $('p.description').first().text());

      deferred.resolve(buildingModel);
    }
  });

  deferred.promise.nodeify(callback);
  return deferred.promise;
};

module.exports = {
  fetchContent: function(searchObject, db) {
    Q.fcall((new SeLogerSearchAdapter).getListingUrl(searchObject))
      .then(function(url){
        return parseListing(url);
      })
      .then(function(listing) {
        var promises = listing.map(function(item){ return parseAnnonce(item.url)});

        var deferred = Q.defer();

        Q.allSettled(promises).then(function(rawAnnonces){
          var annonces = rawAnnonces.map(function(elt){
            if(elt.state = 'fulfilled')
              return elt.value;
          });
          deferred.resolve(annonces);
        });

        deferred.promise.nodeify(callback);
        return deferred.promise;
      })
      .then(function(annonces) {
        //todo : filtrerles annonces en ne laissant que les nouvelles
      })
      .done(function(newAnnonces) {
        // todo: on devrait retourner une promise car on va chainer les promises sur les différents providers
        // il faut réfléchir à la manière dont on gère les compteur de nouvelles annonces
        // (quand on le déclenche ?, comment on le reset)
      });
  }
};

