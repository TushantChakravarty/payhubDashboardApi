const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const requestSchema = new Schema({
  ip: { type: String, required: true },
  email: { type: String, required: true },
  count:{type:Number,default:0},
  timestamp: { type: Date, default: Date.now },
});

module.exports= mongoose.model('Request IPs', requestSchema);