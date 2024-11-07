const mongoose = require('mongoose')
let BaseDao = require('../../../dao/BaseDao')
const Admin = require('../../../generic/models/adminModel')
const user =  require('../../../generic/models/userModel');
const { PayoutTransaction } = require('../../../generic/models/TransactionData');
const adminDao = new BaseDao(Admin);
const usrDao = new BaseDao(user)
const ObjectId = require('mongoose').Types.ObjectId;
const moment = require('moment-timezone');


async function getAllMerchantPayouts(query) {
    try {
      const User = await usrDao.findOne({
        emailId: query?.emailId,
      });
      const uuid = User._id
      const paginatedTransactions = await PayoutTransaction.aggregate([
        {
          $match: {
            uuid: String(uuid),
          },
        },
        {
          $sort: { _id: -1 },
        },
        {
          $skip: query.skip,
        },
        {
          $limit: query.limit,
        },
        {
          $project: {
            uuid: 1,
            transactionId: 1,
            amount: 1,
            currency: 1,
            country: 1,
            status: 1,
            transaction_date: 1,
            utr: 1,
            phone: 1,
            customer_name: 1,
            upiId: 1,
            account_number: 1,
            account_name: 1,
            ifsc_code: 1,
            bank_name: 1,
            customer_email: 1,
          },
        },
      ]);
      return paginatedTransactions;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async function getPayoutDataById(query) {
    const User = await usrDao.findOne({
      emailId: query?.emailId,
    });
    const uuid = User._id
    try {
      const result = await PayoutTransaction.aggregate([
        {
          $match: {
            $or: [
              { transactionId: query?.id },
              { utr: query?.id },
            ],
            uuid: String(uuid),
          },
        },
        {
          $project: {
            uuid: 1,
            transactionId: 1,
            amount: 1,
            currency: 1,
            country: 1,
            status: 1,
            transaction_date: 1,
            utr: 1,
            phone: 1,
            customer_name: 1,
            upiId: 1,
            account_number: 1,
            account_name: 1,
            ifsc_code: 1,
            bank_name: 1,
            customer_email: 1,
          },
        },
      ]);
  
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async function getPayoutsByDateMerchant(startDate, endDate, emailId) {
    try {
      // Convert startDate to IST'
      const User = await usrDao.findOne({
        emailId: emailId,
      });
      const uuid = User._id
      
      const istStartDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
      // Convert endDate to IST
      const istEndDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();
  
      const result = await PayoutTransaction.aggregate([
        {
          $match: {
            "uuid":String(uuid),
            "transaction_date": { $gte: istStartDate, $lte: istEndDate }
          }
        }
      ]);
  
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async function getPayoutsByStatusMerchant(emailId, status,limit,skip) {
    try {
      // Convert startDate to IST'
      const User = await usrDao.findOne({
        emailId: emailId,
      });
      const uuid = User._id
      
     
      const result = await PayoutTransaction.aggregate([
        {
          $match: {
            "uuid":String(uuid),
            "status":status
          }
        },
        {
          $skip:skip
        },
        {
          $limit:limit
        }
      ]);
  
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async function getPayoutsByDateWithStatusMerchant(startDate, endDate, emailId, status) {
    try {
      // Convert startDate to IST'
      const User = await usrDao.findOne({
        emailId: emailId,
      });
      const uuid = User._id
      
      const istStartDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
      // Convert endDate to IST
      const istEndDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();
  
      const result = await PayoutTransaction.aggregate([
        {
          $match: {
            "uuid":String(uuid),
            "transaction_date": { $gte: istStartDate, $lte: istEndDate },
            "status":status
          }
        }
      ]);
  
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }


  module.exports={
    getAllMerchantPayouts,

    getPayoutDataById,

    getPayoutsByDateMerchant,

    getPayoutsByDateWithStatusMerchant,

    getPayoutsByStatusMerchant
  }