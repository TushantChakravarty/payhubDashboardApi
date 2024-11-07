const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const GatewayModel= new Schema({
        uniqueId:{type: Number},
        gatewayName: { 
          type: String, 
          required: true, 
          unique: true,
          immutable: true // This makes the field unchangeable after creation
      },
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
        payouts: {
          last24hr: { type: Number},
          last24hrSuccess: { type: Number },
          last24hrTotal: { type:Number },
          yesterday: { type: Number },
          yesterdayTransactions: { type: Number },
          successfulTransactions: { type: Number},
          totalTransactions: { type: Number },
        },
});
const Gateway = mongoose.model('Gateways', GatewayModel);

module.exports= {Gateway}