const { Transaction } = require('../../generic/models/TransactionData'); // Adjust the path accordingly
const moment = require('moment-timezone');


async function createTransaction(tx)
{
    const newTransaction = new Transaction(tx);
    
    // Save the transaction
    newTransaction.save()
        .then(transaction => {
            // Create a main document with a reference to the transaction
            // const mainDoc = new MainModel({
            //     transactions: [transaction._id]
            // });
    
            // // Save the main document
            // return mainDoc.save();
        })
        .then(mainDoc => {
            //console.log('Main document with reference to transaction saved:', mainDoc);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

async function getTransaction(txId) {
  try {
    const transaction = await Transaction.aggregate([
      {
        $match: {
          transactionId: txId
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $limit: 1
      }
    ]);

    if (transaction.length === 0) {
      //throw new Error('Transaction not found');
      return null
    }

    //console.log('Found transaction:', transaction[0]);
    return transaction[0];
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function getTransactionData(txId) {
  try {
    const transaction = await Transaction.findOne(
      { transactionId: txId },
      null,  // This represents the projection, which we're leaving as null to fetch all fields
      { sort: { createdAt: -1 } }  // Sorting by createdAt in descending order to get the latest one
    );

    if (!transaction) {
      return null;  // Return null if no transaction found
    }

    return transaction;  // Return the found transaction
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}



async function getTransactionGateway(txId) {
  try {
    const transaction = await Transaction.aggregate([
      {
        $match: {
          transactionId: txId
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $limit: 1
      }
    ]);

    if (transaction.length === 0) {
      // Transaction not found
      return null;
    }

    console.log('Found transaction:', transaction[0]);
    return {gateway:transaction[0].gateway,status:transaction[0].status}
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}



async function getAllTransactions(skip, limit) {
    try {
      const result = await Transaction.aggregate([
        {
          $sort: { _id: -1 } // Assuming _id is a unique identifier
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ]);
  
      if (!result || result.length === 0) {
        throw new Error('No result found');
      }
      console.log(result)
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error; // Propagate the error to the caller
    }
  }


  async function getTransactionsSummaryYesterday() {
    try {
      // Get yesterday's start and end dates in IST
      const utcStartDate = moment().subtract(1, 'days').startOf('day').toISOString();
      const utcEndDate = moment().subtract(1, 'days').endOf('day').toISOString();
  
      // Convert UTC dates to IST
      const istStartDate = moment(utcStartDate).tz('Asia/Kolkata').toISOString();
      const istEndDate = moment(utcEndDate).tz('Asia/Kolkata').toISOString();
  
      const yesterdayTransactions = await Transaction.aggregate([
        {
          $match: {
            "transaction_date": {
              $gte: istStartDate,
              $lte: istEndDate,
            },
            "status": "success",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            totalAmount: 1,
            transactionCount: 1
          }
        }
      ]);
  
      // If there are no transactions yesterday, return 0 values
    console.log(yesterdayTransactions)
      return yesterdayTransactions.length > 0 ? yesterdayTransactions[0] : { totalAmount: 0, transactionCount: 0 };
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
  
  async function getTransactionsByStatusAndGateway(status,gateway) {
    try {
      // Convert startDate to IST
   
  //console.log('hit')
      const result = await Transaction.aggregate([
        {
          $match: {
            "status":status,
            "gateway":gateway

          }
        }
      ]);
  
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }



  async function testPerformance() {
    const start = Date.now(); // Start time
  
    const data = await getTransaction('451898433'); // Call the function
  
    const end = Date.now(); // End time
    const timeTaken = end - start; // Calculate the difference in milliseconds
  
    console.log(`Data:`,data);
    console.log(`Time taken: ${timeTaken} ms`); // Log the time taken
  }
module.exports={
    createTransaction,

    getTransaction,

    getAllTransactions,

    getTransactionGateway,

    getTransactionsSummaryYesterday,

    getTransactionsByStatusAndGateway,

    getTransactionData,

    testPerformance
  }