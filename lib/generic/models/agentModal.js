const mongoose = require('mongoose')


const Schema = new mongoose.Schema({
    emailId: { type: String, index: { unique: true } },
    name: { type: String },
    password:{type:String,required: true},
    apiKey: { type: String, required: true },
    isVerified:{type:Boolean}
}, {
    versionKey: false,
    timeStamp: true,
    strict: true
})

module.exports = mongoose.model('agents', Schema);
