const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Ipschema = new Schema({
  ip: { type: String, required: true },
  emailId:{type:String,default:null},
  timestamp: { type: Date, default: Date.now },
});

module.exports= mongoose.model('Ipwhitelist', Ipschema);