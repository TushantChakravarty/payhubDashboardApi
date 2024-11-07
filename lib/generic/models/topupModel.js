const mongoose = require('mongoose')
const constants = require('../../constants')


const Schema = new mongoose.Schema({
  merchantId:{type: mongoose.Schema.Types.ObjectId,},//merchant detail
  merchantEmailId:{ type:String  ,required :true},//merchant detail
  merchantName:{type:String,required:true},//merchant detail
  grossAmount:{ type:Number,required:true},// Actual amount paid by merchant
  grossAmountCurrency:{type:String,required:true,default: 'INR'},//gross amount currency code ,currently i am taking it just to make our system scalable 
  deductedFees:{type:Number,required:true},// deducted fees  from the above gross amount
  deductedFeesCurrencyCode:{type:String,required:true,default: 'INR'}, // deducted fees currency code
  deductedFeesPercentage:{type:Number,required:true},// deducted fees in percentage
  currencyRate:{type:Number,required:true},// currency rate  of the transaction currency with respect to base currency
  currencyCode:{type:String,required:true,default: 'USDT'},// currency code
  currencyNetCharge:{type:Number,required:true}, //  net charge after deducting all the fees
  payoutBalance:{type:Number,required:true}, //payout balance  to be credited into user's wallet
  payoutCurrency:{type:String,required:true,default: 'INR'},//payout wallet currency 
  remark:{type:String},//remark,
  status:{type:String,default:"success"},
  transaction_date:{type:String}
}, {
  versionKey: false,
  timeStamp: true,
  strict: true
})

module.exports = mongoose.model('TopupTransactions', Schema);
