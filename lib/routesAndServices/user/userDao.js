
const mongoose = require('mongoose')
let BaseDao = require('../../dao/BaseDao')
const constants = require('../../constants')
const moment = require("moment-timezone");

const User = require('../../generic/models/userModel');
const userModel = require('../../generic/models/userModel');
const { Transaction } = require('../../generic/models/TransactionData'); // Adjust the path accordingly
const Topup = require('../../generic/models/topupModel')
const UserArchive = require("../../generic/models/userDataArchive")
const usrDao = new BaseDao(User);




/*#################################            Load modules end            ########################################### */


/**
 * Get user details
 * @param {Object} query query to find user details
 */
async function getUserDetails(query) {
  const user = await User.aggregate([
      { $match: query },
      // Add any additional stages you need in the pipeline
      // For example, you might want to add a $lookup stage to populate referenced documents
      // { $lookup: { from: 'otherCollection', localField: 'someField', foreignField: 'someField', as: 'fieldName' } },
      // More stages can be added as per your requirements
  ])
  //console.log(user)
  return user[0]?user[0]:null
}

async function getUserAccount(query) {
  // Ensure emailId is compared case-insensitively
  let queryLowerCase = {
    emailId: query.emailId.toLowerCase()
  };
  
  const users = await User.aggregate([
    {
      $match: {
        $or: [
          { emailId: query.emailId }, // Match original case
          { emailId: queryLowerCase.emailId } // Match lower case
        ]
      }
    }
  ]);
  
  const user = users.length > 0 ? users[0] : null;
  
  return user;
}

async function getUserId(query) {
    const response = await usrDao.findOne({emailId:query})
  return String(response._id)
}

async function getUserIdWithName(query) {
  const response = await usrDao.findOne({emailId:query})
  const data = {
    userId:String(response._id),
    name: response.business_name? String(response?.business_name):''
  }
return data
}


/**
 * Create user
 * @param {Object} obj user details to be registered
 */
function createUser(obj) {

    let userObj = new User(obj)
    return usrDao.save(userObj)
}




/**
 * Update user profile
 * @param {Object} query mongo query to find user to update
 * @param {Object} updateDetails details to be updated
 */
function updateProfile(query, updateDetails) {

    let update = {}
    update['$set'] = updateDetails

    let options = {
        new: true
    }
    
    return usrDao.findOneAndUpdate(query, update, options)
}

function updateProfileDetails(query, updateDetails) {
  delete updateDetails.apiKey
  delete updateDetails.emailId
  let update = {}
  update['$set'] = updateDetails

  let options = {
      new: true
  }
  
  return usrDao.findOneAndUpdate(query, update, options)
}

async function updateWallet(query, updateDetails) {

    let update = {}
    update['$push'] = updateDetails

    let options = {
        new: true
    }
    
    
    return usrDao.findOneAndUpdate(query, {$push:{accounts:updateDetails}},{safe: true, upsert: true, new : true})
    
}

async function updateTransaction(query, updateDetails) {

    let update = {}
    update['$push'] = updateDetails

    let options = {
        new: true
    }
    
    
    return usrDao.findOneAndUpdate(query, {$push:{transactions:updateDetails}},{safe: true, upsert: true, new : true})
    
}

async function updatePayouts(query, updateDetails) {

  let update = {}
  update['$push'] = updateDetails

  let options = {
      new: true
  }
  
  
  return usrDao.findOneAndUpdate(query, {$push:{payouts:updateDetails}},{safe: true, upsert: true, new : true})
  
}

async function getAllWallets(details){
  const data = await usrDao.findOne(details)
  //console.log(data)
  return data
}

async function getAllTransactions(details){
    const data = await usrDao.findOne(details)
    //console.log(data)
    return data
  }
  async function getAllUserSettlements(details){
    const query = {
      emailId: details.emailId,
    };
    
    const data = await usrDao.findOne(query);
    // console.log(data);
    
    const { settlements } = data;
    
    // Pagination parameters
    // const page = details.skip; // the page you want to retrieve
    // const pageSize = details.limit; // the number of items per page
    
    // Calculate the starting index based on pagination parameters
    // const startIndex = (page ) * pageSize;
    
    // Use Array.slice() to get a portion of the settlements array
    const paginatedSettlements = settlements
    

    return paginatedSettlements
  }
  async function getAllUserTopups(details){
    const query = {
      emailId: details.emailId,
    };
    
    const data = await Topup.find({merchantEmailId:details.emailId})
    
    

    return data
  }
  async function getAllUsers() {
    const data = await User.aggregate([
        {
            $project: {
                transactions: 0, // Exclude the 'transactions' field
            }
        }
    ])

    return data;
}
  async function getAllUsersTransactions(){
    const data = await usrDao.find()
    //console.log(data)
    return data
  }

  async function getAllMerchantStats()
  {
    const merchantDetails = usrDao.aggregate([
      {
        $project: {
          _id: 0,
          business_name: '$business_name',
          emailId: '$emailId',
          todayVolume: { $toDouble: '$last24hr' },
          todayTransactions: { $toDouble: '$last24hrTotal' },
          yesterdayVolume: { $toDouble: '$yesterday' },
          yesterdayTransactions: { $toDouble: '$yesterdayTransactions' },
          walletBalance: { $toDouble: '$balance' },
          todayFee: { $toDouble: '$todayFee' },
          yesterdayFee: { $toDouble: '$yesterdayFee' }
        }
      }
    ]);
    
    // The result is an array of objects with the specified projection
    console.log(merchantDetails);
    
    return merchantDetails
  }

  async function getAllMerchantStats2()
  {
    const merchantDetails = usrDao.aggregate([
      {
        $project: {
          _id: 0,
          merchant_name: '$business_name', // Use the correct field name in your collection
          emailId: '$emailId',
          todaysVolume: { $toDouble: '$last24hr' }, // Convert to double if necessary
          todaysTransaction: { $toDouble: '$last24hrSuccess' }, // Convert to integer if necessary
          yesterdaysVolume: { $toDouble: '$yesterday' }, // Convert to integer if necessary
          balance: { $toDouble: '$balance' }, // Convert to integer if necessary
          payoutBalance:{$toDouble:'$payoutBalance'} // convert to integer if necessary
        }
      }
    ]);
    
    // The result is an array of objects with the specified projection
   // console.log(merchantDetails);
    
    return merchantDetails
  }

  async function getAllPayoutMerchantStats()
  {
    const merchantDetails = usrDao.aggregate([
      {
        $match: {
            payoutsActive: true // Filter documents where payoutActive is true
        }
    },
    {
      $project: {
        _id: 0,
        merchant_name: '$business_name', // Use the correct field name in your collection
        emailId: '$emailId',
        todaysPayout: { $toDouble: '$payoutsData.last24hr' }, // Convert to double if necessary
        todaysTransaction: { $toDouble: '$payoutsData.last24hrSuccess' }, // Convert to integer if necessary
        yesterdaysPayout: { $toDouble: '$payoutsData.yesterday' }, // Convert to integer if necessary
        payoutBalance: { $toDouble: '$payoutBalance' }, // Convert to integer if necessary
        totalTransactions: { $toDouble: '$payoutsData.totalTransactions' } // Convert to integer if necessary
      }
    }
    ]);
    
    // The result is an array of objects with the specified projection
   // console.log(merchantDetails);
    
    return merchantDetails
  }

  async function getAllMerchantsData()
  {
    const users = usrDao.aggregate([
      {
        $project: {
          _id: 0,
          emailId: '$emailId',
          first_name: '$first_name',
          last_name: '$last_name',
          payinGateway: '$gateway',
          payoutGateway: '$payoutGateway',
          balance: '$balance',
          platformFee: '$platformFee',
          business_name: '$business_name',
          is_Banned: '$isBanned',
          payinLimit:'$payinLimit',
          payoutLimit:'$payoutLimit',
          payoutsActive: { $ifNull: ["$payoutsActive", false] }        }
      }
    ]);
    
    // The result is an array of objects with the specified projection
   // console.log(users);
    return users
  }

  async function getAllUsersTransactionsPaginated(skip, limit ) {
    try {
      const allUsers = await usrDao.find({}, { _id: 0 });
      
      // Extract all transactions from users
      const allTransactions = allUsers.reduce((transactions, user) => {
          if (user.transactions && Array.isArray(user.transactions)) {
              transactions.push(...user.transactions);
          }
          return transactions;
      }, []);

      // Ensure skip and limit values are within bounds
      const startIndex = Math.min(skip, allTransactions.length);
      const endIndex = Math.min(startIndex + limit, allTransactions.length);

      const paginatedTransactions = allTransactions.reverse().slice(startIndex, endIndex);

      return paginatedTransactions;
  } catch (error) {
      console.error("Error in getAllUsersTransactionsPaginated:", error);
      throw error;  // Propagate the error for handling at a higher level if needed
  }
}

  async function getAllUserTransactions(details){
    const data = await usrDao.findOne(details)
    //console.log(data)
    return data
  }

  async function getUserTransactionsData(details) {
    try {
      let query = {
        emailId: details.emailId
      };
  
      const user = await usrDao.findOne(query);
  
      if (!user) {
        return null; // User not found
      }
  
      // Assuming the user model has a field 'uuid' that represents the user identifier
      const userId = user._id;
  
      const userTransactions = await Transaction.aggregate([
        {
          $match: { uuid: String(userId) }
        },
        {
          $sort: { transaction_date: -1 } // Sort transactions by date in descending order
        },
        {
          $skip: details.skip
        },
        {
          $limit: details.limit
        },
        {
          $project: {
            transactionId: "$transactionId",
            merchant_ref_no: "$merchant_ref_no",
            amount: "$amount",
            currency: "$currency",
            country: "$country",
            status: "$status",
            payout_type: "$payout_type",
            message: "$message",
            transaction_date: "$transaction_date",
            phone: "$phone",
            username: "$username",
            utr: "$utr"
          }
        }
      ]);
  
      //console.log('tx', userTransactions);
  
      return userTransactions;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
  
  

  async function getTransactionsByStatus(details){
    let query = {
      emailId:details.emailId
    }
    const user = await usrDao.findOne(query)
    //console.log(data)
   // console.log(details)
    if (!user) {
      return null; // User not found
  }
  const userIdObj = user._id;
  //console.log(userIdObj);

  // Parse the input dates using moment and set the timezone to IST
 

  // Aggregate pipeline to filter transactions within the date range and with the specified status
  const transactions = await Transaction.aggregate([
    {
      $match: {
        uuid: String(userIdObj),
        "status": details?.status
      },
    },
    {
      $sort: { transaction_date: -1 } // Sort transactions by date in descending order
    },
    {
      $project: {
        transactionId: "$transactionId",
        merchant_ref_no: "$merchant_ref_no",
        amount: "$amount",
        currency: "$currency",
        country: "$country",
        status: "$status",
        payout_type: "$payout_type",
        message: "$message",
        transaction_date: "$transaction_date",
        phone: "$phone",
        username: "$username",
        utr: "$utr"
      }
    },
    {
      $skip: details?.skip // replace skipValue with your desired value
    },
    {
      $limit: details?.limit // replace limitValue with your desired value
    }
  ]);

  if (transactions.length === 0) {
    //throw new Error("No transactions found within the specified date range and status");
    console.log("No transactions found within the specified date range and status")
  }

  return transactions?transactions:[];


//   const transactions = user.transactions.filter(t => t.status === details.status);
//   const paginated = transactions.slice(details.skip, details.skip + details.limit)
//     .map(transaction => ({
//       _id: transaction._id,
//       transactionId: transaction.transactionId,
//       merchant_ref_no: transaction.merchant_ref_no,
//       amount: transaction.amount,
//       currency: transaction.currency,
//       country: transaction.country,
//       status: transaction.status,
//       payout_type: transaction.payout_type,
//       message: transaction.message,
//       transaction_date: transaction.transaction_date,
//       phone: transaction.phone,
//       username: transaction.username,
//       utr: transaction.utr,
//     }));

// // Now 'paginated' contains the transactions with the specified status and is paginated.
// //console.log(paginated);

// // Return 'paginated' or do further processing as needed.
// return paginated;
    
  }
  async function updateTransactionData(userId, transactionId, updateData)
  {
    const user = await usrDao.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Find the transaction by its ID and update it
    const transaction = user.transactions.find(t => t.transactionId === transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update the transaction data
    Object.assign(transaction, updateData);

    // Save the updated user document
   const response = await user.save();
   return response
  }

  async function getTransactionByDate(UserId, startDate, endDate,limit, skip) {
    try {
     
  
    const user = await usrDao.findOne(UserId);
    if (!user) {
      throw new Error("User not found");
    }
    const userId = user._id;
    console.log(userId);

    // Parse the input dates using moment and set the timezone to IST
    const startDateTime = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
    const endDateTime = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();

    // Debug: Check the parsed moment objects with IST timezone
    console.log("Parsed moment objects in IST:", startDateTime.toString(), endDateTime.toString());

    // Aggregate pipeline to filter transactions within the date range using Transaction model
    const transactions = await Transaction.aggregate([
      {
        $match: {
          uuid: String(userId),
          "transaction_date": { $gte: startDateTime, $lte: endDateTime }
        },
        
      },
      {
        $skip: skip // replace skipValue with your desired value
      },
      {
        $limit: limit // replace limitValue with your desired value
      },
      {
        $project: {
          transactionId: "$transactionId",
          merchant_ref_no: "$merchant_ref_no",
          amount: "$amount",
          currency: "$currency",
          country: "$country",
          status: "$status",
          payout_type: "$payout_type",
          message: "$message",
          transaction_date: "$transaction_date",
          phone: "$phone",
          username: "$username",
          utr: "$utr"
        }
      }
    ]);

    if (transactions.length === 0) {
      console.log("No transactions found within the specified date range");
      return []
    }

    return transactions;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
  //   const user = await usrDao.findOne(userId);
  //   if (!user) {
  //     throw new Error('User not found');
  //   }
  
  //   // Find the transaction by date and update it
  //   //console.log('Input dates:', startDate, endDate);

  //   // Parse the input dates into Date objects
  //   const startParts = startDate.split('-');
  //   const endParts = endDate.split('-');
  
  //   if (startParts.length !== 3 || endParts.length !== 3) {
  //      new Error('Invalid date format');
  //   }
  
  //   // Debug: Check the parsed date parts
  //   //console.log('Parsed date parts:', startParts, endParts);
  
  //   const startDateTime = new Date(
  //     Date.UTC(
  //       parseInt(startParts[0], 10),
  //       parseInt(startParts[1], 10) - 1,
  //       parseInt(startParts[2], 10),
  //       0,
  //       0,
  //       0,
  //       0
  //     )
  //   );
  
  //   const endDateTime = new Date(
  //     Date.UTC(
  //       parseInt(endParts[0], 10),
  //       parseInt(endParts[1], 10) - 1,
  //       parseInt(endParts[2], 10),
  //       23,
  //       59,
  //       59,
  //       999
  //     )
  //   );
  
  //   // Debug: Check the parsed Date objects
  //  // console.log('Parsed Date objects:', startDateTime, endDateTime);
  
  //   // Filter transactions within the date range
  //   const transactions = user.transactions.filter((t) => {
  //     const transactionDate = new Date(t.transaction_date);
  
  //     // Debug: Check the transaction date
  //    // console.log('Transaction date:', transactionDate);
  
  //     // Perform date comparison
  //     return (
  //       transactionDate >= startDateTime && transactionDate <= endDateTime
  //     );
  //   });

   
  
  //   if (transactions.length === 0) {
  //      new Error('No transactions found within the specified date range');
  //   }

  //   const updated = transactions.map(transaction => ({
  //     _id: transaction._id,
  //     transactionId: transaction.transactionId,
  //     merchant_ref_no: transaction.merchant_ref_no,
  //     amount: transaction.amount,
  //     currency: transaction.currency,
  //     country: transaction.country,
  //     status: transaction.status,
  //     payout_type: transaction.payout_type,
  //     message: transaction.message,
  //     transaction_date: transaction.transaction_date,
  //     phone: transaction.phone,
  //     username: transaction.username,
  //     utr: transaction.utr,
  //   }));
  
  //   return updated;
  }
  async function fetchTxDetail(userId, transactionId)
  {
    const user = await usrDao.findOne(userId);
    if (!user) {
       new Error('User not found');
    }

    // Find the transaction by its ID and update it
    const UserId = user._id;

    const transaction = await Transaction.aggregate([
      {
        $match: {
          uuid: String(UserId),
          $or: [
            { "transactionId": transactionId },
            { "utr": transactionId }
          ]
        }
      },
      {
        $sort: { "transaction_date": -1 } // Sort transactions by date in descending order
      }
    ]);
    //console.log(transaction)
    if (!transaction) {
       new Error('Transaction not found');
    }

    // Update the transaction data
    //console.log(transaction)
   return transaction[0]
  }

  async function fetchTxDetailNew(userId, transactionId) {
    const user = await usrDao.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }
  
    // Find the transaction by its ID and update it
    const UserId = user._id;
  
    const transaction = await Transaction.aggregate([
      {
        $match: {
          uuid: String(UserId),
          transactionId: transactionId
        }
      },
      {
        $sort: { "transaction_date": -1 } // Sort transactions by date in descending order
      }
    ]);
  
    if (!transaction || transaction.length === 0) {
      throw new Error('Transaction not found');
    }
  
    // Return the first transaction in the result set
    return transaction[0];
  }
  
function getWalletdetail(query){

    return usrDao.Find({
        $and: [
            { "_id": { $ne: `${query._id}` } },
          { "walletAddress":`${query.walletAddress}`} ,
          
        ]
      })
}

async function getUser(details){
  const data = await usrDao.findOne(details)
  //console.log(data)
  return data
}

async function getAllTransactionWithSuccessStatus(data, details) {
  try {
    let query = {
      emailId: data.emailId
    };

    console.log(details);

    const user = await usrDao.findOne(query);

    if (!user) {
      throw new Error('User not found');
    }
    // Assuming the user model has a field 'uuid' that represents the user identifier
    const userId = String(user._id)
    console.log("user",userId)

    const userTransactions = await Transaction.aggregate([
      {
        $match: { uuid: userId, "status": 'success' }
      },
      {
        $sort: { "transaction_date": 1 } // Sort transactions by date in ascending order
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $toDate: "$transaction_date" },
              timezone: "Asia/Kolkata"
            }
          },
          volume: { $sum: "$amount" },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id",
          volume: 1,
          transactionCount: 1,
          _id: 0
        }
      }
    ]);
    let paginated =userTransactions.sort((a, b) => moment(a.date, 'YYYY-MM-DD') - moment(b.date, 'YYYY-MM-DD'));
    paginated = paginated.slice(details.skip, details.skip + details.limit);
    

    if (paginated.length === 0) {
      console.log('No transactions found with the specified status');
    }

    return paginated;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}


async function getDataByUtr(details)
{
  try {
    let query = {
      emailId: details.emailId
    };

    const user = await usrDao.findOne(query);

    if (!user) {
      return null; // User not found
    }

    // Assuming the user model has a field 'uuid' that represents the user identifier
    const userId = user._id;

    const userTransactions = await Transaction.aggregate([
      {
        $match: {
          uuid: String(userId),
          $or: [
            { "transactionId": details.utr },
            { "utr": details.utr }
          ]
        }
      },
      {
        $sort: { "transaction_date": -1 } // Sort transactions by date in descending order
      }
    ]);

    console.log('tx', userTransactions);

    return userTransactions;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function getTransactionsByStatusAndDate(details)
{
 
    let query = {
      emailId:details.emailId
    }
    const user = await usrDao.findOne(query)
    //console.log(data)
   // console.log(details)
    if (!user) {
      return null; // User not found
  }
  const userIdObj = user._id;
  //console.log(userIdObj);

  // Parse the input dates using moment and set the timezone to IST
  const startDateTime = moment.tz(details.startDate, 'Asia/Kolkata').startOf('day').toISOString();
    const endDateTime = moment.tz(details.endDate, 'Asia/Kolkata').endOf('day').toISOString();

  // Aggregate pipeline to filter transactions within the date range and with the specified status
  const transactions = await Transaction.aggregate([
    {
      $match: {
        uuid: String(userIdObj),
        "status": details?.status,
        "transaction_date": { $gte: startDateTime, $lte: endDateTime },
      },
    },
    {
      $project: {
        transactionId: "$transactionId",
        merchant_ref_no: "$merchant_ref_no",
        amount: "$amount",
        currency: "$currency",
        country: "$country",
        status: "$status",
        payout_type: "$payout_type",
        message: "$message",
        transaction_date: "$transaction_date",
        phone: "$phone",
        username: "$username",
        utr: "$utr"
      }
    },
    {
      $skip: details?.skip // replace skipValue with your desired value
    },
    {
      $limit: details?.limit // replace limitValue with your desired value
    }
  ]);

 

  


  if (transactions.length === 0) {
    //throw new Error("No transactions found within the specified date range and status");
    console.log("No transactions found within the specified date range and status")
  }

  return transactions?transactions:[];



  
}

async function archiveUserDailyData(dailyData) {
  try {
      const currentDate = new Date().toISOString().slice(0, 10);  // Today's date in "YYYY-MM-DD" format
      console.log('Current date for archiving:', currentDate);
      console.log('Received daily data:', dailyData);

      // Check if an archive record already exists for the current date
      const existingArchive = await UserArchive.findOne({ date: currentDate });
      console.log('Existing archive record found:', existingArchive);

      if (existingArchive) {
          console.log(`Archive data for ${currentDate} already exists.`);
          return existingArchive;  // Return the existing document if found
      }

      // Prepare and save the archival data if no existing record is found
      const archiveData = {
          date: currentDate,
          emailId:dailyData.emailId||"",
          business_name:dailyData.business_name||"",
          balance: dailyData.balance || 0,
          last24hr: dailyData.last24hr || 0,
          yesterday: dailyData.yesterday || 0,
          totalVolume: dailyData.totalVolume || 0,
          successfulTransactions: dailyData.successfulTransactions || 0,
          last24hrSuccess: dailyData.last24hrSuccess || 0,
          last24hrTotal: dailyData.last24hrTotal || 0,
          totalTransactions: dailyData.totalTransactions || 0,
          platformFee: dailyData.platformFee || 0,
          feeCollected24hr: dailyData.feeCollected24hr || 0,
          totalFeeCollected: dailyData.totalFeeCollected || 0,
          lastExecutionDate: dailyData.lastExecutionDate || "",
          payoutsBalance: dailyData.payoutsBalance || 0,
          payouts: dailyData.payouts || {},  // Sub-document
          topups: dailyData.topups || {},    // Sub-document
          createdAt: new Date()
      };
      
      console.log("Prepared archive data:", archiveData);

      const archiveRecord = new UserArchive(archiveData);
      console.log('Attempting to save archive record...');
      await archiveRecord.save();

      console.log('Daily data archived successfully:', archiveRecord);
      return archiveRecord;

  } catch (error) {
      console.error('Error archiving daily data:', error.message, error.stack);
      throw error;  // Re-throw the error for handling elsewhere if needed
  }
}


module.exports = {

 
    getUserDetails,

    createUser,

    updateWallet,
    
    updateProfile,
    
    getWalletdetail,

    getAllWallets,

    updateTransaction,

    getAllTransactions,

    getAllUsersTransactions,

    updateTransactionData,

    fetchTxDetail,

    getAllUserTransactions,

    getUser,

    getUserTransactionsData,

    getTransactionByDate,

    getTransactionsByStatus,

    updatePayouts,

    getAllUserSettlements,

    getAllTransactionWithSuccessStatus,

    getAllUsersTransactionsPaginated,

    getAllMerchantsData,

    getAllMerchantStats,

    getAllMerchantStats2,

    getUserId,

    getDataByUtr,

    getAllUsers,

    getTransactionsByStatusAndDate,

    getUserAccount,

    getAllPayoutMerchantStats,

    getAllUserTopups,

    updateProfileDetails,

    fetchTxDetailNew,

    getUserIdWithName,

    archiveUserDailyData
    

}