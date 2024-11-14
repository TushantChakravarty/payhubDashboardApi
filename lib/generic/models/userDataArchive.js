const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userArchiveSchema = new Schema({
    date: { type: String, required: true },  // Archive date in "YYYY-MM-DD" format
    emailId: { type: String, required: true },
    first_name: { type: String },
    last_name: { type: String },
    business_name: { type: String },
    business_type: { type: String },
    balance: { type: Number, default: 0 },
    payoutBalance: { type: Number, default: 0 },
    assigned: { type: Boolean, default: false },
    payoutsActive: { type: Boolean, default: false },
    sandbox: { type: Boolean, default: false },
    production: { type: Boolean, default: false },
    onrampCallback: { type: String },
    offrampCallback: { type: String },
    gateway: { type: String },
    callbackUrl: { type: String, default: "" },
    payoutCallbackUrl: { type: String, default: "" },
    redirectUrl: { type: String, default: "" },
    premium: { type: String },
    premiumGateway: { type: String },
    payoutGateway: { type: String },
    last24hr: { type: Number, default: 0 },
    last24hrSuccess: { type: Number, default: 0 },
    last24hrTotal: { type: Number, default: 0 },
    yesterday: { type: Number, default: 0 },
    yesterdayTransactions: { type: Number, default: 0 },
    successfulTransactions: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    todayFee: { type: Number, default: 0 },
    yesterdayFee: { type: Number, default: 0 },
    encryptionKey: { type: String },
    isBanned: { type: Boolean, default: false },
    payinLimit: { type: Number, default: 0 },
    payoutLimit: { type: Number, default: 0 },
    supportApp: { type: String, default: 'whatsapp' },
    payoutsData: {
        last24hr: { type: Number, default: 0 },
        last24hrSuccess: { type: Number, default: 0 },
        last24hrTotal: { type: Number, default: 0 },
        yesterday: { type: Number, default: 0 },
        yesterdayTransactions: { type: Number, default: 0 },
        successfulTransactions: { type: Number, default: 0 },
        totalTransactions: { type: Number, default: 0 },
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
        totalActualTopup: { type: Number, default: 0 },
    },
    version: { type: Number, default: 0 },  // Version for optimistic concurrency control
    createdAt: { type: Date, default: Date.now }  // Timestamp for when the archive record was created
}, {
    timestamps: false  // Disable automatic timestamps; only `createdAt` is used explicitly
});

module.exports = mongoose.model('UserArchive', userArchiveSchema);
