var express = require('express')
  , url = require('url')
  , URIjs = require('URIjs')
  , Q = require('q');

  var _url = "http://www.seloger.com/list.htm?ci=750103,750109,750110,750111,750117,750118,750119,750120&idtt=1&idtypebien=1&leadali=L001&orientation=VueetOrientation&pxmax=900&surfacemin=35&tri=d_dt_crea";


module.exports = {
  getListingUrl: function (searchObject, callback) {
    var baseUrl = new URIjs("http://www.seloger.com/list.htm");
    baseUrl.addQuery("idtt", 1);
    baseUrl.addQuery("idtypebien", 1);
    var deferred = Q.defer();

    var location = searchObject.location.join(',');
    if(location != '') baseUrl.addQuery("ci", location);

    if(searchObject.maxPrice) baseUrl.addQuery("pxmin", searchObject.minPrice);
    if(searchObject.maxPrice) baseUrl.addQuery("pxmax", searchObject.maxPrice);

    if(searchObject.minSurface) baseUrl.addQuery("surfacemin", searchObject.minSurface);
    if(searchObject.maxSurface) baseUrl.addQuery("surfacemax", searchObject.maxSurface);

    baseUrl.addQuery("tri", "d_dt_crea");

    deferred.resolve(baseUrl.toString());
    deferred.promise.nodeify(callback);
    return deferred.promise;
  }
}