var urlParser = require('url')
  , Cheerio = require('cheerio')
  , request = require('request')
  , Item = require('../models/itemModel')
  , Q = require('q')
  , config = require('./config')
  ,searchAdapter = require('./searchAdapter');



var parseListing = function parseListing(searchObject, callback) {
  var deferred = Q.defer();
  searchAdapter
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
              result.push(new Item({providerId: elt.attribs.id, url: _url, providerName: config.providerName}))
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
var parseAnnonce = function parseAnnonce(model, callback) {
  var deferred = Q.defer();

  request(model.url.href, function (error, response, body) {
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
        model.set('surface', surface[1]);
      }
      var hono = reHonoraires.exec(infos);
      if (hono) {
        model.set('fee', hono[1]);
      }

      model
        .set('price', $("#price").text().trim().replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " "))
        .set('phoneContact', $(".action__detail-tel").first().text().replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " "))
        .set('description', $('p.description').first().text());

      deferred.resolve(model);
    }
  });

  deferred.promise.nodeify(callback);
  return deferred.promise;
};


var getItemFromDb = function(item, db) {
  var deferred = Q.defer();
  db.get(item.get('_id'), function(response, err){
    if(err)
      deferred.reject(err);
    else
      deferred.resolve(reponse);
  });
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
      .then(function(items) {
        //todo : filtrerles annonces en ne laissant que les nouvelles
        var promises = items.map(function(item){ return getItemFromDb(item, db)});

        Q.allSettled(promises).then(function(_items){
          var items = _items.map(function(item){
            if(item.state = 'fulfilled')
              return item.value;
          });
          deferred.resolve(items);
        });
        return deferred.promise;
      })
      .done(function(newItems) {
        // todo: on devrait retourner une promise car on va chainer les promises sur les différents providers
        // il faut réfléchir à la manière dont on gère les compteur de nouvelles annonces
        // (quand on le déclenche ?, comment on le reset)
      });
  }
};

