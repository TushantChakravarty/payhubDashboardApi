const mongoose = require('mongoose');

const vpaSchema = new mongoose.Schema({
    vpa: { type: String, unique: true, index: true }
  });
  
const BlockedVPA = mongoose.model('BlockedVPA', vpaSchema);

module.exports = BlockedVPA

//maliksaqibm096@okicici