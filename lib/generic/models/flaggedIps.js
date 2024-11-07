const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const flaggedIPSchema = new Schema({
    ip: { type: String, required: true, unique: true },
    email:{type: String, required: true},
    timestamp: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model('FlaggedIPs', flaggedIPSchema);
  
  