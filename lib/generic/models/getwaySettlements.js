const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const GatewaySettlementsModel= new Schema({
    uuid:{type:String},
    amount: { type: Number },
    currency: { type: String },
    country: { type: String },
    transaction_date: { type: String },
    notes: { type: String },
    ref_no: { type: String },
    feeCharged: { type: Number },
    feePercentage:{ type: Number },
    netFees:{ type: Number },
    amountSettled: { type: Number },
    usdt: {type:Number},
    usdtRate:{ type: Number },
    bankFees: { type: Number },
    netBankFees:{ type: Number },
    netGst :{type:Number},
    refund :{type:Number},
    chargeback :{type:Number},
    rolling_reserve:{type:Number},
    misc:{type:Number},
    gst:{type:Number}
});
const GatewaySettlements = mongoose.model('GatewaySettlements', GatewaySettlementsModel);

module.exports= {GatewaySettlements}