var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');

var Schema = mongoose.Schema;

var ressourceSchema = new Schema({
  idSeloger:            String,
  link:                 String,
  prix:                 String,
  surface:              String,
  tel:                  String,
  honoraires:           String,
  pageHash:             String
});
ressourceSchema.plugin(timestamps);

module.exports = ressourceSchema;


