const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  uuid: { 
    type: String, 
    required: true 
}, // required OTP field
type:{
  type:String,
  required: true
},
request_body: mongoose.Schema.Types.Mixed,
csv_url:{
  type:String,
  required:true
},
creation_date:{
  type:String
}
}, {
    versionKey: false,
    timeStamp: true,
    strict: true
})

const Csv =mongoose.model("Csv", Schema);

module.exports = Csv
