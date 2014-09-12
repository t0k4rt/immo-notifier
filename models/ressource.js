var mongoose = require('mongoose');
var ressourceSchema = require('./schemas/ressource');

module.exports = mongoose.model('ressourceModel', ressourceSchema);


