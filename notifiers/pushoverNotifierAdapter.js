var Pushover = require('node-pushover');

module.exports = {
  connect: function(token, user){
    this.push = new Pushover({
      token: token,
      user: user
    });
    return this;
  },
  sendPush: function(annonce, callback){
    var deferred = Q.defer();
    it(typeof this.push == 'undefined')
      deferred.reject(new Error('Not connected to pushover'));

    this.push.send("Nouvelle annonce de location", annonce.value.prix + " / " + annonce.value.surface + " lien : " + annonce.value.url    , function (err, res){
      if(err){
        deferred.reject(new Error(err));
      }else{
        deferred.resolve(annonce.value);
      }
    });
    deferred.promise.nodeify(callback);
    return deferred.promise;
  }
}

