const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gatewayDataSchema = new Schema({
    gatewayData: [
        {
            date: { type: String },
            data: [
                {
                    gatewayName: { type: String },
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
                    abbr: { type: String }
                }
            ]
        }
    ]
});


module.exports = mongoose.model('GatewayData', gatewayDataSchema);
