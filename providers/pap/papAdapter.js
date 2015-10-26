var url = require('url')
  , URIjs = require('URIjs')
  , request = require('request')
  , Q = require('q');

/**
 * On ne peux pas utiliser directement un code postal sur PAP
 * Il est nécessaire de convertir le code postal en code interne utilisé par PAP
 *
 * @param locationString
 * @returns {defer.promise|*|promise|Q.promise}
 */
var geoCode = function getLocationId(locationString) {
  var autoCompleteUrl = "http://www.pap.fr/index/ac-geo2";
  var deferred = Q.defer();
  request.get(
    { url : autoCompleteUrl
      , qs : { q: locationString+'' }
      , json:true }
    , function (error, response, body) {
      if(error || response.statusCode != 200) {
        deferred.reject(new Error('There was an issue fetching pap location id'));
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

  validatePostalCode: function(locationString) {
    Q.fcall(geoCode(locationString)).done(function(result, error) {
      return error ? false : true;
    });
  },

  getListingUrl: function (searchObject, callback) {
    console.log(searchObject);
    var baseUrl = new URIjs("http://www.seloger.com/list.htm");
    var deferred = Q.defer();

    var locationIds = searchObject.location.map(function(city) {
      return geoCode(city);
    });

    Q.allSettled(locationIds).then(function(seLogerlocationIds){
      var location = seLogerlocationIds.map(function(elt){
        if(elt.state = 'fulfilled')
          return elt.value;
      }).join(',');
      console.log(location);
      /*if(location != '') baseUrl.addQuery("ci", location);

      baseUrl.addQuery("idtt", 1);
      baseUrl.addQuery("idtypebien", 1);
      baseUrl.addQuery("orientation", "VueetOrientation");

      if(typeof searchObject.minPrice != "undefined")
        baseUrl.addQuery("pxmin", searchObject.minPrice);
      if(searchObject.maxPrice)
        baseUrl.addQuery("pxmax", searchObject.maxPrice);

      if(searchObject.minSurface)
        baseUrl.addQuery("surfacemin", searchObject.minSurface);
      if(searchObject.maxSurface)
        baseUrl.addQuery("surfacemax", searchObject.maxSurface);

      baseUrl.addQuery("tri", "d_dt_crea");

      deferred.resolve(baseUrl.toString());*/
    });

    deferred.promise.nodeify(callback);
    return deferred.promise;
  }
}
