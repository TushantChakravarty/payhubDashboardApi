const mongoose = require('mongoose')
const constants = require('../../constants')


const Schema = new mongoose.Schema({
  emailId: { type: String, index: { unique: true } },
  username: { type: String },
  password: { type: String, required: true, select: false },
  apiKey: { type: String, required: true },
  token: { type: String },
  merchants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: constants.DB_MODEL_REF.USERS,
    }
  ],
}, {
  versionKey: false,
  timeStamp: true,
  strict: true
})

module.exports = mongoose.model('sales', Schema);
