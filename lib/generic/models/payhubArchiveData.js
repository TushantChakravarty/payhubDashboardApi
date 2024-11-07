const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const payhubArchiveSchema = new Schema({
    date: { type: String, required: true },  // e.g., "YYYY-MM-DD" format for the archival date
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
        totalTransactions: { type: Number, default: 0 }
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
    createdAt: { type: Date, default: Date.now }  // Timestamp for when the archival record was created
}, {
    timestamps: false // Disable automatic timestamps since only `createdAt` is used explicitly
});

module.exports = mongoose.model('PayhubArchive', payhubArchiveSchema);
