const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    transactionId: { type: String },
    gateway: { type: String },
    callbackTime: { type: String },
    otherFields: mongoose.Schema.Types.Mixed  // Dynamic field for additional data
}, {
    versionKey: false,
    timestamps: true,
    strict: false  // Allow dynamic addition of fields
});

module.exports = mongoose.model("Callbacks", Schema);