const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  otp: { 
    type: String, 
    required: true 
}, // required OTP field
emailId: { 
    type: String, 
    required: true 
}, // required email field
sent_at: {
    type: Date,
    default: Date.now, // auto-set the current date as default
    required: true
}, // required sent_at field
   
}, {
    versionKey: false,
    timeStamp: true,
    strict: true
})

const Otp =mongoose.model("Otp", Schema);

module.exports = Otp
