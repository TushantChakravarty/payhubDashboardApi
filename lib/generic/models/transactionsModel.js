const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionsDataSchema = new Schema({
    transactions: [
        {
            transactionId: { type: String },
            merchant_ref_no: { type: String },
            amount: { type: Number },
            currency: { type: String },
            country: { type: String },
            status: { type: String },
            hash: { type: String },
            payout_type: { type: String },
            message: { type: String },
            transaction_date: { type: String },
            gateway: { type: String },
            utr: { type: String },
            phone: { type: String },
            username: { type: String },
            upiId:{type:String},
            customer_email:{type:String},
            business_name:{type:String}
        }
    ],
});

module.exports = mongoose.model('transactionsData', transactionsDataSchema);
