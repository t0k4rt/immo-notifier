var url = require('url')
  , URIjs = require('URIjs')
  , request = require('request')
  , config = require('./config')
  , Q = require('q');


/**
 * On ne peux pas utiliser directement un code postal sur Seloger
 * Il est nécessaire de convertir le code postal en code interne utilisé par Seloger
 *
 * @param locationString
 * @returns {defer.promise|*|promise|Q.promise}
 */
var geoCode = function getLocationId(locationString) {
  var autoCompleteUrl = "http://www.seloger.com/new_recherche,js,autocomplete_localisation.json";
  var deferred = Q.defer();
  request.get(
    { url : autoCompleteUrl
      , qs : { term: locationString+'' }
      , json:true }
    , function (error, response, body) {
      if(error || response.statusCode != 200) {
        deferred.reject(new Error('There was an issue fetching seLoger location id'));
      }

      if(body.length == 0) {
        deferred.reject(new Error('Could not find any corresponding id'));
      }
      console.log(body[0].values[0].code);
      deferred.resolve(body[0].values[0].code);
    });
  return deferred.promise;
};


module.exports = {
  /**
   * @param locationString
   */
  validatePostalCode: function(locationString) {
    Q.fcall(geoCode(locationString)).done(function(result, error) {
      return error ? false : true;
    });
  },

  /**
   * Méthode publique permettant de récupérer l'url de listing chez Seloger
   *
   * @param searchObject
   * @param callback
   * @returns {defer.promise|*|promise|Q.promise}
   *
   * http://www.seloger.com/recherche.htm?org=engine&idtt=1&nb_pieces=&pxmax=900&idtypebien=2%2C1&ci=750120,750118#idtt=1&idtypebien=1&idtypebien=2&&idq=all&pxmax=900&&surfacemin=32&&ci=750120,750118&&nb_pieces=2&nb_pieces=3&nb_pieces=4&nb_pieces=5&nb_pieces=5%2b
   */
  getListingUrl: function (searchObject, callback) {

    var baseUrl = new URIjs(config.baseUrl + "/list.htm");
    var deferred = Q.defer();

    var locationIds = searchObject.location.map(function(city) {
      return geoCode(city);
    });

    Q.allSettled(locationIds).then(function(seLogerlocationIds){
      var location = seLogerlocationIds.map(function(elt){
        if(elt.state = 'fulfilled')
          return elt.value;
      }).join(',');

      if(location != '') baseUrl.addQuery("ci", location);

      baseUrl.addQuery("idtt", 1);
      baseUrl.addQuery("idtypebien", 1);
      baseUrl.addQuery("orientation", "VueetOrientation");

      // nbre de pièces minimum
      baseUrl.addQuery("nb_pieces", "2");

      if(searchObject.minPrice)
        baseUrl.addQuery("pxmin", searchObject.minPrice);
      if(searchObject.maxPrice)
        baseUrl.addQuery("pxmax", searchObject.maxPrice);

      if(searchObject.minSurface)
        baseUrl.addQuery("surfacemin", searchObject.minSurface);
      if(searchObject.maxSurface)
        baseUrl.addQuery("surfacemax", searchObject.maxSurface);

      baseUrl.addQuery("tri", "d_dt_crea");

      deferred.resolve(baseUrl.toString());
    });

    deferred.promise.nodeify(callback);
    return deferred.promise;
  }
};
