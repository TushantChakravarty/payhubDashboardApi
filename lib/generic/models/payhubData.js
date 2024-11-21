const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const payhubDataSchema = new Schema({
    balance: { type: Number },
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
    lastExecutionDate: { type: String },
    payoutsBalance: { type: Number },
    payouts: {
        last24hr: { type: Number, default: 0 },
        last24hrSuccess: { type: Number, default: 0 },
        last24hrTotal: { type: Number, default: 0 },
        yesterday: { type: Number, default: 0 },
        yesterdayTransactions: { type: Number, default: 0 },
        successfulTransactions: { type: Number, default: 0 },
        totalTransactions: { type: Number, default: 0 },
        balance:{ type: Number, default: 0 }

    },
    topups: {
        last24hr: { type: Number, default: 0 },
        last24hrSuccess: { type: Number, default: 0 },
        last24hrTotal: { type: Number, default: 0 },
        yesterday: { type: Number, default: 0 },
        yesterdayTransactions: { type: Number, default: 0 },
        successfulTransactions: { type: Number, default: 0 },
        totalNetFees: { type: Number, default: 0 },
        totalTransactions: { type: Number, default: 0 },
        totalActualTopup: { type: Number, default: 0 }
    },
    version: { type: Number, default: 0 }  // Version for optimistic concurrency control
}, { 
    timestamps: true  // Automatically creates `createdAt` and `updatedAt` fields
});

// Middleware to increment version before save
payhubDataSchema.pre('save', function(next) {
    this.version += 1;
    next();
});

module.exports = mongoose.model('PayhubData', payhubDataSchema);
