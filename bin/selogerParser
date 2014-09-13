#!/usr/bin/env node
var redis = require('redis')
  , debug = require('debug')('my-application')
  , url = require('url')
  , Cheerio = require('cheerio')
  , request = require('request')
  , Q = require('q')
  , nodemailer = require('nodemailer')
  , jade = require('jade');

/**
 * Mandrill setup
 */
var transporter = nodemailer.createTransport();
if(process.env.MANDRILL_USERNAME) {
  transporter = nodemailer.createTransport({
    //debug: true,
    //port: 587,
    //host: "smtp.mandrillapp.com",
    service: 'Mandrill',
    auth: {
      user: process.env.MANDRILL_USERNAME,
      pass: process.env.MANDRILL_APIKEY
    }
  });
}
var test = [ { state: 'fulfilled',
  value:
  { url: 'http://www.seloger.com/annonces/locations/appartement/paris-20eme-75/plaine/92200301.htm?ci=750103,750109,750110,750111,750117,750118,750119,750120&idtt=1&idtypebien=1&leadali=L001&orientation=VueetOrientation&pxmax=900&surfacemin=35&tri=d_dt_crea&bd=Li_LienAnn_1',
    prix: '853,10 € CC',
    tel: ' Téléphone 01 53 98 58 58 ',
    surface: 'Surface de 36 m²',
    honoraires: 100 } },
  { state: 'fulfilled',
    value:
    { url: 'http://www.seloger.com/annonces/locations/appartement/paris-19eme-75/92199891.htm?ci=750103,750109,750110,750111,750117,750118,750119,750120&idtt=1&idtypebien=1&leadali=L001&orientation=VueetOrientation&pxmax=900&surfacemin=35&tri=d_dt_crea&bd=Li_LienAnn_1',
      prix: '878 € +CH',
      tel: ' Téléphone 06 72 73 97 99 ',
      surface: 'Surface de 35 m²',
      honoraires: 100 } },
  { state: 'fulfilled',
    value:
    { url: 'http://www.seloger.com/annonces/locations/appartement/paris-10eme-75/porte-saint-denis-paradis/92035855.htm?ci=750103,750109,750110,750111,750117,750118,750119,750120&idtt=1&idtypebien=1&leadali=L001&orientation=VueetOrientation&pxmax=900&surfacemin=35&tri=d_dt_crea&bd=Li_LienAnn_1',
      prix: '900 € +CH',
      tel: ' Téléphone 06 79 53 22 27 ',
      surface: 'Surface de 37 m²',
      honoraires: 100 } } ];

var mailTemplate = jade.compileFile('./views/mail/mail.jade', {pretty: true});


transporter.sendMail({
  from: 'alerte@seloger.com',
  to: 'alexandre.assouad@gmail.com',
  subject: 'test',
  html: mailTemplate({result: test})
}, function(error, info){
  if(error){
    console.log(error);
  }else{
    console.log('Message sent: ' + info.response);
  }
});


/**
 * redis setup
 */
//var redis_url = process.env.REDISCLOUD_URL ? process.env.REDISCLOUD_URL : 'redis://127.0.0.1:6379';
var redisUrl = url.parse(process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379');
var redisStore = redis.createClient(redisUrl.port, redisUrl.hostname);

if(redisUrl.auth) {
  var auth = (redisUrl.auth.split(':'))[1];
  redisStore.auth(auth, function(){console.log("redisStore ready")});
}


var _url = "http://www.seloger.com/list.htm?ci=750103,750109,750110,750111,750117,750118,750119,750120&idtt=1&idtypebien=1&leadali=L001&orientation=VueetOrientation&pxmax=900&surfacemin=35&tri=d_dt_crea";

// create promise, return parsed url
Q.fcall(function () {return url.parse(_url)})
  //we first get the list of articles from seloger page
  .then(function(ressourceParams){
    var deferred = Q.defer();
    console.log('loading listing url');
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
    console.log('Compare with stored ids');
    redisStore.smembers('selogerIds',function(err, obj){console.log(obj)});

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
    console.log('Parsing new articles info');
    function analyzeSelogerUrl(url) {
      var deferred = Q.defer();
      request(url, function (error, response, body) {
        if(error || response.statusCode != 200) {
          deferred.reject(new Error('Could not fetch url content'));
        }
        else {
          $ = Cheerio.load(body);

          var infos = $(".description-liste").first().text();

          var reSurface = /.*(surface.*m²)./ig;
          var reHonoraires = /.*honoraires ttc : (.*€)./ig;

          var result = {
            url: url,
            prix: $("#price").text().trim().replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," "),
            tel: $(".action__detail-tel").first().text().replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," "),
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
    if(result.length > 0) {
      console.log("should send email");
      transporter.sendMail({
          from: 'alerte@seloger.com',
          to: 'alexandre.assouad@gmail.com',
          subject: 'we found new articles for you',
          text: mailTemplate({result: result})
        },
        function(err, info) {
          if(error){
            console.log(error);
          }else{
            console.log('Message sent: ' + info.response);
          }
          process.exit(1);
        });
    }
    else {
      process.exit(1);
    }

  });
