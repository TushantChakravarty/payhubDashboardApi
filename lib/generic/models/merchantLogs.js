const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const merchantLogs = new Schema({
    uuid: { type: String, required: true},
    business_name: { type: String, required: true},
    date:{type: String, required: true},
    volume: { type: Number, default:0 },
    txCount:{ type: Number, default:0 },
  });
  
  module.exports = mongoose.model('merchantLogs', merchantLogs);
  
  