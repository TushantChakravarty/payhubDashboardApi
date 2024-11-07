const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const allGatewayDataSchema = new Schema({
    date: { type: String, required: true },
    gatewayName: { type: String, required: true },
    last24hr: { type: Number },
    yesterday: { type: Number },
    totalVolume: { type: Number },
    successfulTransactions: { type: Number },
    last24hrSuccess: { type: Number },
    last24hrTotal: { type: Number },
    totalTransactions: { type: Number },
    platformFee: { type: Number },
    feeCollected24hr: { type: Number },
    totalFeeCollected: { type: Number },
    yesterdayFee: { type: Number },
    yesterdayTransactions: { type: Number },
    collectionFee: { type: Number },
    payoutFee: { type: Number },
    abbr: { type: String },
    balance: { type: Number },
    settlements: { type: Number },
    hash: { type: String },
    switch: { type: Boolean },
    uniqueId: { type: Number }
});

module.exports = mongoose.model('AllGatewayData', allGatewayDataSchema);
