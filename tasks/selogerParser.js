#!/usr/bin/env node
var redis = require('redis')
  , debug = require('debug')('my-application')
  , url = require('url')
  , Cheerio = require('cheerio')
  , request = require('request')
  , Q = require('q')
  , nodemailer = require('nodemailer')
  , jade = require('jade')
  , Pushover = require('node-pushover');

/**
 * Mandrill setup
 */
var transporter = nodemailer.createTransport();
if(process.env.MANDRILL_USERNAME) {
  console.log('Mailer use Mandrill');
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

var mailTemplate = jade.compileFile('./views/mail/mail.jade', {pretty: true});

/**
 *Pushover setup
 */
var push = new Pushover({
  token: "aNMGCoq3foJPjk4jgkavfC9RGXgJXr",
  user: "uNc7YJaajnsZ6iFewtKL4s5BHABLoR"
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
    function analyzeSelogerUrl(url) {
      var deferred = Q.defer();
      request(url, function (error, response, body) {
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
      return deferred.promise;
    }

    var promises = [];
    newSeloger.forEach(function(elt){
      if(elt.state == 'fulfilled') {
        promises.push(analyzeSelogerUrl(elt.value))
      }
    });
    if(promises.length > 1) {
      console.log('We found new articles, now analyzing them');
    };

    return Q.allSettled(promises);
  })
  .then(function(results){
    function sendPush(annonce) {
      var deferred = Q.defer();
      push.send("Nouvelle annonce de location", annonce.value.prix + " / " + annonce.value.surface + " lien : " + annonce.value.url    , function (err, res){
        if(err){
          deferred.reject(new Error(err));
        }else{
          deferred.resolve(annonce.value);
        }
      });
      return deferred.promise;
    }

    var promises = [];
    results.forEach(function(elt){
      if(elt.state == 'fulfilled') {
        promises.push(sendPush(elt))
      }
    });
    return Q.allSettled(promises);

  })
  .then(function(results){
    if(results.length > 0) {
      console.log('sendemail');
      var deferred = Q.defer();
      transporter.sendMail({
          from: 'alerte@seloger.com',
          to: 'alexandre.assouad@gmail.com',
          subject: 'We found new articles for you',
          html: mailTemplate({result: results})
        },
        function(err, info) {
          console.log(info);
          if(err)
            deferred.reject(new Error(err));
          else
            deferred.resolve(results);
          return deferred.promise;
        }
      );
    }
    return results;
  })
  .catch(function(errors){
    console.error(errors);
  })
  .done(function(results){
    console.log(results);
    process.exit(1);
  });
