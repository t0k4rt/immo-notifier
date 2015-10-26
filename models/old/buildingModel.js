/**
 * Created by alexandre on 13/03/15.
 */
var urlParser = require('url');

var buildingSchema = {
  id:null,
  provider: null,
  providerId: null,
  url: null,
  like: false,
  name : null,
  description: null,
  city: null,
  postcode: null,
  street: null,
  country: null,
  surface: 'int',
  surfaceunit: '',
  pictures : 'array',
  price: 'int',
  currency: '',
  phonecontact: null,
  mailcontact: null,
  agencyname: null,
  agencycity: null,
  agencypostcode: null,
  agencystreet: null,
  agencycountry: null,
  agencyfee: 0,

  parseData: function(data){
    return {
      id:data.null,
      provider: data.provider,
      providerId: data.providerId,
      url: data.url,
      like: data.like,
      name : data.name,
      description: data.description,
      address: {
        city: data.city,
        postcode: data.postcode,
        street: data.street,
        country: data.country
      },
      surface: data.surface,
      surfaceUnit: data.surfaceunit,
      pictures : data.pictures.split('|'),
      price: data.price,
      currency: data.currency,
      phoneContact: data.phonecontact,
      mailContact: data.mailcontact,
      agency: {
        name: data.agencyname,
        city: data.agencycity,
        postcode: data.agencypostcode,
        street: data.agencystreet,
        country: data.agencycountry,
        fee: data.agencyfee
      }
    }
  },

  toString: function(model) {
    return {
      id: model.id,
      provider: model.provider,
      providerid: model.providerId,
      url: model.url.href,
      like: model.like,
      name : model.name,
      description: model.description,
      city: model.agency.city,
      postcode: model.agency.postcode,
      street: model.address.street,
      country: model.address.country,
      surface: model.surface,
      surfaceunit: model.surfaceUnit,
      pictures : model.pictures.join('|'),
      price: model.price,
      currency: model.currency,
      phonecontact: model.phoneContact,
      mailcontact: model.mailContact,
      agencyname: model.agency.name,
      agencycity: model.agency.city,
      agencypostcode: model.agency.postcode,
      agencystreet: model.agency.street,
      agencycountry: model.agency.country,
      agencyfee: model.agency.fee
    };
  }
};

var buildingModel = {
  _id:null,
  provider: null,
  providerId: null,
  url: null,
  like: false,
  name : null,
  description: null,
  address: {
    city: null,
    postcode: null,
    street: null,
    country: null
  },
  surface: 0,
  surfaceUnit: 'm2',
  pictures : [],
  price: 0,
  currency: '€',
  phoneContact: null,
  mailContact: null,
  agency: {
    name: null,
    city: null,
    postcode: null,
    street: null,
    country: null,
    fee: 0
  },

  addPicture: function(pictureUrl) {
    try {
      urlParser.parse(pictureUrl);
      this.pictures.push(pictureUrl);
    }
    catch (e) {}
  }
};



/*module.exports = function Building(name) {
  var building = new buildingModel;
  building.name = name;
  return building;
}*/


module.exports = {

  _id: null,
  provider: null,
  providerId: null,
  like: false,
  name: null,
  description: null,
  address: {
    city: null,
    postcode: null,
    street: null,
    country: null
  },
  surface: 0,
  surfaceUnit: 'm2',
  pictures: [],
  price: 0,
  currency: '€',
  phoneContact: null,
  mailContact: null,
  fee: 0,
  agency: {
    name: null,
    city: null,
    postcode: null,
    street: null,
    country: null,
  },


  generateId: function() {
    if(this.provider && this.providerId) {
      this._id = this.provider +":"+ this.providerId;
    }
    else
      throw new Error('Cannot generate id. provider or provider id is missing.');
  },


  set: function(key, value) {
    this[key] = value;
    return this;
  },


  addPicture: function(pictureUrl) {
    try {
      urlParser.parse(pictureUrl);
      this.pictures.push(pictureUrl);
    }
    catch (e) {}
  }
};
