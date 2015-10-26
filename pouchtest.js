var PouchDB = require('pouchdb');
var Item = require('./models/itemModel');
var Model = require('./models/model');

//var db = new PouchDB('realestatesearch');

var item = new Item({
  providerName: 'seloger',
  providerId: 3456,
  location: ['75010','75009','75011','75001','75018','75019','75020'],
  maxPrice: 900,
  minSurface: 35
});


var model = new Model({
  location: ['75010','75009','75011','75001','75018','75019','75020'],
  maxPrice: 900,
  minSurface: 35
});

console.log(item.serialize());
var idb = document.getElementById('idb');
var db = new PouchDB('realestatesearch');
db.info().then(function () {
  console.log('ok');
}).catch(function (err) {
  console.error(err);
});


db.get(item.get('_id')).then(function(item){
  if(item)
    console.log(item);
  else
    db.put(item.serialize).then(function (response) {
      // handle response
      console.log(response);
      console.log('yoooooooooooooo');
    }).catch(function (err) {
      console.log(err);
    });
}).catch(function (err) {
  console.log(err);
});

//console.log(model.get('maxPrice'));
//console.log(model.set('maxPrice', 800));
//console.log(model.get('maxPrice'));
//console.log(model.serialize());
