const moment = require("moment-timezone");
const transactionsModel = require("../../generic/models/transactionsModel");
const userModel = require("../../generic/models/userModel");
const fs = require('fs');
const path = require('path');
const { Transaction, MainModel, PayoutTransaction } = require("../../generic/models/TransactionData"); // Adjust the path accordingly
let BaseDao = require("../../dao/BaseDao");
const { getUserId } = require("../user/userDao");
const { s3 } = require("../../config/awsConfig");
const ObjectId = require("mongoose").Types.ObjectId;
const transactionDao = new BaseDao(transactionsModel);
const userDao = new BaseDao(userModel);
const { PassThrough } = require('stream');

function generateCSV(data)
{
  const formatDateAndTime = (date) => ({
    formattedTime: new Date(date).toLocaleTimeString(),
    formattedDate: new Date(date).toLocaleDateString(),
  });

  const csvContent = [
    ["Time", "Date", "Merchant", "Gateway", "Amount", "Status", "UTR", "TXID"],
    ...data.map(({ transaction_date, amount, business_name, gateway, status, utr, transactionId }) => [
      formatDateAndTime(transaction_date).formattedTime || '',
      formatDateAndTime(transaction_date).formattedDate || '',
      business_name ? business_name : merchantInfo.find(m => m.email_id === activeMerchant)?.business_name,
      gateway,
      amount || '',
      status ? status === "IN-PROCESS" ? "pending" : status === "fail" ? "failed" : status.toLowerCase() : '',
      utr || '',
      transactionId || ''
    ]),
  ].map(row => row.join(',')).join('\n');

  // Specify the path where the CSV should be saved
  const filePath = path.join(__dirname, 'transactions.csv');

  // Write the CSV content to a file
  fs.writeFile(filePath, csvContent, (err) => {
    if (err) {
      console.error('Error writing CSV file:', err);
    } else {
      console.log(`CSV file saved at ${filePath}`);
    }
  });
}

// Function to stream data to S3
async function uploadCsvStreamToS3(readableStream) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME, // Your bucket name
    Key: `transactions_${Date.now()}.csv`, // File name to save in S3
    Body: readableStream, // Streaming the CSV data
    ContentType: 'text/csv',
  };

  // Uploading the stream to S3
  try {
    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully. URL: ${data.Location}`);
    return data.Location;
  } catch (err) {
    console.error('Error uploading to S3:', err);
    throw new Error('Upload failed');
  }
}

// Function to convert a transaction document into CSV format
function transactionToCsvRow(transaction) {
  const formatDateAndTime = (date) => ({
    formattedTime: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date)),
    
    formattedDate: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date)),
  });

  const { formattedTime, formattedDate } = formatDateAndTime(transaction.transaction_date);
  const status = transaction?.status === "IN-PROCESS" ? "pending" : transaction?.status === "fail" ? "failed" : transaction?.status?.toLowerCase();

  return `${formattedTime},${formattedDate},${transaction.business_name || ''},${transaction.gateway || ''},${transaction.amount || ''},${status},${transaction.utr || ''},${transaction.transactionId || ''}\n`;
}

function transactionToCsvRowMerchant(transaction) {
  const formatDateAndTime = (date) => ({
    formattedTime: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date)),
    
    formattedDate: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date)),
  });

  const { formattedTime, formattedDate } = formatDateAndTime(transaction.transaction_date);
  const status = transaction?.status === "IN-PROCESS" ? "pending" : transaction?.status === "fail" ? "failed" : transaction?.status?.toLowerCase();

  return `${formattedTime},${formattedDate},${transaction.amount || ''},${status},${transaction.utr || ''},${transaction.transactionId || ''}\n`;
}


async function updateTransactionsData(updateData) {
  const targetObjectId = "6575f177435fd406e1991f05";
  const filter = { _id: ObjectId(targetObjectId) };

  // Update the document by pushing the single transaction data
  transactionsModel.updateOne(
    filter,
    { $push: { transactions: updateData } },
    function (err, result) {
      if (err) {
        console.error("Error updating document:", err);
      } else {
        console.log("Document updated successfully");
      }
    }
  );
}

// async function updateTransactionStatus(transactionId, updateData) {

//     const targetObjectId = '6575f177435fd406e1991f05';
//     const filter = {
//         _id: ObjectId(targetObjectId),
//         'transactions.transactionId': transactionId,
//       };

//       const update = {
//         $set: {
//           'transactions.$.status': updateData.status,
//           'transactions.$.utr': updateData.utr,
//           // Add other fields you want to update
//         },
//       };

//       const result = await transactionDao.updateOne(filter, update);

//       if (result.modifiedCount > 0) {
//         console.log('Document updated successfully');
//       } else {
//         console.log('No document matched the criteria');
//       }
// }
async function updateTransactionStatus(transactionId, updateData) {
  try {
    const filter = {
      transactionId: transactionId,
    };

    const update = {
      $set: {
        status: updateData.status,
        utr: updateData.utr,
        reason: updateData?.reason,
        code: updateData?.code,
        // Add other fields you want to update
      },
    };

    const options = {
      new: true, // Return the modified document
    };

    const updatedTransaction = await Transaction.findOneAndUpdate(
      filter,
      update,
      options
    );

    if (updatedTransaction) {
      //console.log('Transaction updated successfully:', updatedTransaction);
      return updatedTransaction;
    } else {
      console.log("No transaction matched the criteria");
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// async function getAllTransactions(skip,limit) {

//   const result = await transactionDao.aggregate([
//     {
//       $match: { _id: ObjectId('6575f177435fd406e1991f05') }
//     },
//     {
//       $project: {
//         reversedTransactions: { $reverseArray: "$transactions" }
//       }
//     },
//     {
//       $project: {
//         paginatedTransactions: { $slice: ["$reversedTransactions", skip, limit] }
//       }
//     }
//   ]);

//   // Access the reversed and paginated transactions
//   const reversedTransactions = result[0].reversedTransactions;
//   const paginatedTransactions = result[0].paginatedTransactions;

//   return paginatedTransactions;
// }

async function getAllTransactions(skip, limit) {
  try {
    const paginatedTransactions = await Transaction.aggregate([
      {
        $sort: { _id: -1 }, // Assuming _id is a sortable field
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    return paginatedTransactions;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getCompleteTransactions() {
  const result = await transactionDao.aggregate([
    {
      $match: { _id: ObjectId("6575f177435fd406e1991f05") },
    },
  ]);

  // Access the reversed and paginated transactions
  const reversedTransactions = result[0];
  console.log(reversedTransactions);
  reversedTransactions.map(item);

  //const paginatedTransactions = result[0].paginatedTransactions;

  return reversedTransactions;
}

async function getAllTransactionsData(limit, skip, statusFilter) {
  try {
    const paginatedTransactions = await Transaction.aggregate([
      {
        $sort: { _id: -1 }, // Assuming _id is a sortable field
      },
      {
        $match: { status: statusFilter }, // Add this stage to filter by status
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    return paginatedTransactions ? paginatedTransactions : [];
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// async function getTotalVolume(statusFilter) {
//   const result = await transactionDao.aggregate([
//     {
//       $match: { _id: ObjectId('6575f177435fd406e1991f05') }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $match: { "transactions.status": statusFilter }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }
async function getTotalVolume(statusFilter) {
  try {
    const result = await Transaction.aggregate([
      {
        $match: { status: statusFilter },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
async function getTotalPayoutVolume(statusFilter) {
  try {
    // if (statusFilter === "IN-PROCESS") {
    //   statusFilter = "pending"
    // }
    // else if (statusFilter === "failed") {
    //   statusFilter = "pending"
    // }

    const result = await PayoutTransaction.aggregate([
      {
        $match: { status: statusFilter },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getDataById(id) {
  try {
    const result = await Transaction.findOne({
      $or: [{ transactionId: id }, { utr: id }],
    });

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTransactionById(id) {
  const result = await transactionDao.aggregate([
    {
      $match: { _id: ObjectId("6575f177435fd406e1991f05") },
    },
    {
      $unwind: "$transactions",
    },
    {
      $match: {
        $or: [{ "transactions.transactionId": id }],
      },
    },
    {
      $group: {
        _id: null,
        transaction: { $first: "$transactions" }, // Use $first to get the first matching transaction
      },
    },
  ]);

  // Access the matching transaction directly
  const matchingTransaction = result[0] ? result[0].transaction : null;

  return matchingTransaction;
}

async function getAllMerchantTransactions() {
  const indianTimeZone = "Asia/Kolkata";

  const result = await transactionDao.findOne({
    _id: ObjectId("6575f177435fd406e1991f05"),
  });

  return result.transactions;
}

// async function getTotalVolumeByGatewayAndStatus(status, gateway) {
//   let gatewayFilter;
//   if (gateway === 'paythrough') {
//     gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
//   } else {
//     gatewayFilter = gateway;
//   }

//   const result = await transactionDao.aggregate([
//     {
//       $match: { _id: ObjectId('6575f177435fd406e1991f05') }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $match: {
//         $and: [
//           { "transactions.status": status },
//           { "transactions.gateway": gatewayFilter }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
//   }

async function getTotalVolumeByGatewayAndStatus(status, gateway) {
  try {
    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const result = await Transaction.aggregate([
      {
        $match: {
          status: status,
          gateway: gatewayFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}


async function getTotalPayoutVolumeByGatewayAndStatus(status, gateway) {
  try {
    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const result = await PayoutTransaction.aggregate([
      {
        $match: {
          status: status,
          gateway: gatewayFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// async function getTotalVolumeByGatewayAndDate(status, gateway, startDate, endDate) {
//   // Convert startDate to IST
//   const istStartDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
//   // Convert endDate to IST
//   const istEndDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();

//   let gatewayFilter;
//   if (gateway === 'paythrough') {
//     gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
//   } else {
//     gatewayFilter = gateway;
//   }

//   const result = await transactionDao.aggregate([
//     {
//       $match: { _id: ObjectId('6575f177435fd406e1991f05') }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $match: {
//         $and: [
//           { "transactions.status": status },
//           { "transactions.gateway": gatewayFilter },
//           { "transactions.transaction_date": { $gte: istStartDate, $lte: istEndDate } }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }

async function getTotalVolumeByGatewayAndDate(
  status,
  gateway,
  startDate,
  endDate
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const result = await Transaction.aggregate([
      {
        $match: {
          status: status,
          gateway: gatewayFilter,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTotalPayoutVolumeByGatewayAndDate(
  status,
  gateway,
  startDate,
  endDate
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const result = await Transaction.aggregate([
      {
        $match: {
          status: status,
          gateway: gatewayFilter,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// async function getTotalVolumeByDate(status, startDate, endDate) {
//   // Convert startDate to IST
//   const istStartDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
//   // Convert endDate to IST
//   const istEndDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();

//   // let gatewayFilter;
//   // if (gateway === 'paythrough') {
//   //   gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
//   // } else {
//   //   gatewayFilter = gateway;
//   // }

//   const result = await transactionDao.aggregate([
//     {
//       $match: { _id: ObjectId('6575f177435fd406e1991f05') }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $match: {
//         $and: [
//           { "transactions.status": status },
//           { "transactions.transaction_date": { $gte: istStartDate, $lte: istEndDate } }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }

async function getTotalVolumeByDate(status, startDate, endDate) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const result = await Transaction.aggregate([
      {
        $match: {
          status: status,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTotalPayoutVolumeByDate(status, startDate, endDate) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const result = await PayoutTransaction.aggregate([
      {
        $match: {
          status: status,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// async function getTotalVolumeByDateWithTime(status, startDate, endDate, startTime, endTime) {
//   // Convert startDate to IST
//   const istStartDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
//   // Convert endDate to IST
//   const istEndDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();

//   const result = await transactionDao.aggregate([
//     {
//       $match: { _id: ObjectId('6575f177435fd406e1991f05') }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $addFields: {
//         istTransactionDate: {
//           $dateToString: {
//             format: '%Y-%m-%dT%H:%M:%S.%LZ',
//             date: { $toDate: "$transactions.transaction_date" },
//             timezone: 'Asia/Kolkata'
//           }
//         }
//       }
//     },
//     {
//       $match: {
//         $and: [
//           { "transactions.status": status },
//           { "transactions.transaction_date": { $gte: istStartDate, $lte: istEndDate } },
//           {
//             $expr: {
//               $and: [
//                 { $gte: ["$istTransactionDate", `${startDate}T${startTime}.000Z`] },
//                 { $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`] }
//               ]
//             }
//           }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }

async function getTotalVolumeByDateWithTime(
  status,
  startDate,
  endDate,
  startTime,
  endTime
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const result = await Transaction.aggregate([
      {
        $match: {
          status: status,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $addFields: {
          istTransactionDate: {
            $dateToString: {
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
              date: { $toDate: "$transaction_date" },
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              {
                $gte: ["$istTransactionDate", `${startDate}T${startTime}.000Z`],
              },
              { $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTotalPayoutVolumeByDateWithTime(
  status,
  startDate,
  endDate,
  startTime,
  endTime
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const result = await PayoutTransaction.aggregate([
      {
        $match: {
          status: status,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $addFields: {
          istTransactionDate: {
            $dateToString: {
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
              date: { $toDate: "$transaction_date" },
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              {
                $gte: ["$istTransactionDate", `${startDate}T${startTime}.000Z`],
              },
              { $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
// async function getTotalVolumeByGatewayAndDateWithTime(status, gateway, startDate, endDate, startTime, endTime) {
//   // Convert startDate to IST
//   const istStartDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
//   // Convert endDate to IST
//   const istEndDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();

//   let gatewayFilter;
//   if (gateway === 'paythrough') {
//     gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
//   } else {
//     gatewayFilter = gateway;
//   }

//   const result = await transactionDao.aggregate([
//     {
//       $match: { _id: ObjectId('6575f177435fd406e1991f05') }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $addFields: {
//         istTransactionDate: {
//           $dateToString: {
//             format: '%Y-%m-%dT%H:%M:%S.%LZ',
//             date: { $toDate: "$transactions.transaction_date" },
//             timezone: 'Asia/Kolkata'
//           }
//         }
//       }
//     },
//     {
//       $match: {
//         $and: [
//           { "transactions.status": status },
//           { "transactions.gateway": gatewayFilter },
//           { "transactions.transaction_date": { $gte: istStartDate, $lte: istEndDate } },
//           {
//             $expr: {
//               $and: [
//                 { $gte: ["$istTransactionDate", `${startDate}T${startTime}.000Z`] },
//                 { $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`] }
//               ]
//             }
//           }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }
async function getTotalVolumeByGatewayAndDateWithTime(
  status,
  gateway,
  startDate,
  endDate,
  startTime,
  endTime
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const result = await Transaction.aggregate([
      {
        $match: {
          status: status,
          gateway: gatewayFilter,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $addFields: {
          istTransactionDate: {
            $dateToString: {
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
              date: { $toDate: "$transaction_date" },
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      {
        $match: {
          $and: [
            { status: status },
            { gateway: gatewayFilter },
            { transaction_date: { $gte: istStartDate, $lte: istEndDate } },
            {
              $expr: {
                $and: [
                  {
                    $gte: [
                      "$istTransactionDate",
                      `${startDate}T${startTime}.000Z`,
                    ],
                  },
                  {
                    $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`],
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
async function getTotalPayoutVolumeByGatewayAndDateWithTime(
  status,
  gateway,
  startDate,
  endDate,
  startTime,
  endTime
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const result = await PayoutTransaction.aggregate([
      {
        $match: {
          status: status,
          gateway: gatewayFilter,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $addFields: {
          istTransactionDate: {
            $dateToString: {
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
              date: { $toDate: "$transaction_date" },
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      {
        $match: {
          $and: [
            { status: status },
            { gateway: gatewayFilter },
            { transaction_date: { $gte: istStartDate, $lte: istEndDate } },
            {
              $expr: {
                $and: [
                  {
                    $gte: [
                      "$istTransactionDate",
                      `${startDate}T${startTime}.000Z`,
                    ],
                  },
                  {
                    $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`],
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTransactionsByDate(startDate, endDate, limit, skip) {
  try {
    // Convert startDate to IST
    console.log('hit')
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const result = await Transaction.aggregate([
      {
        $match: {
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
    console.log(result)
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadTransactionsCsvByDate(query) {
  try {
    // Convert startDate and endDate to IST
    const istStartDate = moment.tz(query.startDate, "Asia/Kolkata").startOf("day").toISOString();
    const istEndDate = moment.tz(query.endDate, "Asia/Kolkata").endOf("day").toISOString();

    // Create a readable stream from the MongoDB cursor
    const cursor = Transaction.find({
      transaction_date: { $gte: istStartDate, $lte: istEndDate },
    }).cursor();

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Merchant,Gateway,Amount,Status,UTR,TXID\n");

    cursor.on('data', (doc) => {
      // Convert the document to a CSV row and write to the stream
      passThroughStream.write(transactionToCsvRow(doc));
    });

    cursor.on('end', () => {
      // End the stream when all data has been processed
      passThroughStream.end();
    });

    cursor.on('error', (error) => {
      console.error("Error while streaming data from MongoDB:", error);
      throw error;
    });

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadTransactionsCsvByDateAndStatus(query) {
  try {
    // Convert startDate and endDate to IST
    const istStartDate = moment.tz(query.startDate, "Asia/Kolkata").startOf("day").toISOString();
    const istEndDate = moment.tz(query.endDate, "Asia/Kolkata").endOf("day").toISOString();

    // Create a readable stream from the MongoDB cursor
    const cursor = Transaction.find({
      transaction_date: { $gte: istStartDate, $lte: istEndDate },
      status:query.status
    }).cursor();

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Merchant,Gateway,Amount,Status,UTR,TXID\n");

    cursor.on('data', (doc) => {
      // Convert the document to a CSV row and write to the stream
      passThroughStream.write(transactionToCsvRow(doc));
    });

    cursor.on('end', () => {
      // End the stream when all data has been processed
      passThroughStream.end();
    });

    cursor.on('error', (error) => {
      console.error("Error while streaming data from MongoDB:", error);
      throw error;
    });

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadMerchantTransactionsCsvByDate(query) {
  try {
    // Convert startDate and endDate to IST
    const istStartDate = moment.tz(query.startDate, "Asia/Kolkata").startOf("day").toISOString();
    const istEndDate = moment.tz(query.endDate, "Asia/Kolkata").endOf("day").toISOString();
    const userId = await getUserId(query.emailId);
      if(!userId)
      {
        throw 'user not found';
      }
    // Create a readable stream from the MongoDB cursor
    const cursor = Transaction.find({
      uuid:userId,
      transaction_date: { $gte: istStartDate, $lte: istEndDate },
    }).cursor();

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Merchant,Gateway,Amount,Status,UTR,TXID\n");

    cursor.on('data', (doc) => {
      // Convert the document to a CSV row and write to the stream
      passThroughStream.write(transactionToCsvRow(doc));
    });

    cursor.on('end', () => {
      // End the stream when all data has been processed
      passThroughStream.end();
    });

    cursor.on('error', (error) => {
      console.error("Error while streaming data from MongoDB:", error);
      throw error;
    });

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadMerchantTransactionsCsvByDateAndStatus(query) {
  try {
    // Convert startDate and endDate to IST
    const istStartDate = moment.tz(query.startDate, "Asia/Kolkata").startOf("day").toISOString();
    const istEndDate = moment.tz(query.endDate, "Asia/Kolkata").endOf("day").toISOString();
    const userId = await getUserId(query.emailId);
      if(!userId)
      {
        throw 'user not found';
      }
    // Create a readable stream from the MongoDB cursor
    const cursor = Transaction.find({
      uuid:userId,
      transaction_date: { $gte: istStartDate, $lte: istEndDate },
      status:query.status
    }).cursor();

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Merchant,Gateway,Amount,Status,UTR,TXID\n");

    cursor.on('data', (doc) => {
      // Convert the document to a CSV row and write to the stream
      passThroughStream.write(transactionToCsvRow(doc));
    });

    cursor.on('end', () => {
      // End the stream when all data has been processed
      passThroughStream.end();
    });

    cursor.on('error', (error) => {
      console.error("Error while streaming data from MongoDB:", error);
      throw error;
    });

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadAllTransactionsCsv() {
  try {
    // Create a readable stream from the MongoDB cursor
    const cursor = Transaction.find({}).cursor(); // No date range, fetch all transactions

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Merchant,Gateway,Amount,Status,UTR,TXID\n");

    // Manually read from the cursor
    let doc;
    while ((doc = await cursor.next()) !== null) {
      // Write each document to the stream
      passThroughStream.write(transactionToCsvRow(doc));
    }

    // End the stream when all data has been processed
    passThroughStream.end();

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadAllMerchantTransactionsCsv(query) {
  try {
    const userId = await getUserId(query.emailId
    );
    if(!userId)
    {
      throw 'user not found';
    }
    // Create a readable stream from the MongoDB cursor, filtering by emailId
    const cursor = Transaction.find({ uuid: userId }).cursor(); // Filter by emailId

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Merchant,Gateway,Amount,Status,UTR,TXID\n");

    // Manually read from the cursor
    let doc;
    while ((doc = await cursor.next()) !== null) {
      // Write each document to the stream
      passThroughStream.write(transactionToCsvRow(doc));
    }

    // End the stream when all data has been processed
    passThroughStream.end();

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadAllMerchantTransactionsByStatusCsv(query) {
  try {
    const userId = await getUserId(query.emailId
    );
    if(!userId)
    {
      throw 'user not found';
    }
    // Create a readable stream from the MongoDB cursor, filtering by emailId
    const cursor = Transaction.find({ uuid: userId, status:query.status }).cursor(); // Filter by emailId

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Merchant,Gateway,Amount,Status,UTR,TXID\n");

    // Manually read from the cursor
    let doc;
    while ((doc = await cursor.next()) !== null) {
      // Write each document to the stream
      passThroughStream.write(transactionToCsvRow(doc));
    }

    // End the stream when all data has been processed
    passThroughStream.end();

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
async function downloadAllTransactionsByStatus(query) {
  try {
   
    // Create a readable stream from the MongoDB cursor, filtering by emailId
    const cursor = Transaction.find({status:query.status }).cursor(); // Filter by emailId

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Merchant,Gateway,Amount,Status,UTR,TXID\n");

    // Manually read from the cursor
    let doc;
    while ((doc = await cursor.next()) !== null) {
      // Write each document to the stream
      passThroughStream.write(transactionToCsvRow(doc));
    }

    // End the stream when all data has been processed
    passThroughStream.end();

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTransactionsByDateAndStatus(startDate, endDate, status, limit, skip) {
  try {
    // Convert startDate to IST
    console.log('hit status')
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const result = await Transaction.aggregate([
      {
        $match: {
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
          status: status,
        },
        
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
     
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTransactionsCsvByDateAndStatus(startDate, endDate, status) {
  try {
    // Convert startDate to IST
    console.log('hit status')
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const result = await Transaction.aggregate([
      {
        $match: {
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
          status: status,
        },
      },
    ]);
    generateCSV(result)
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

//user
async function downloadUserTransactionsCsv(query) {
  try {
    const userId = await getUserId(query.emailId
    );
    if(!userId)
    {
      throw 'user not found';
    }
    // Create a readable stream from the MongoDB cursor, filtering by emailId
    const cursor = Transaction.find({ uuid: userId }).sort({ createdAt: -1 }).cursor(); // Filter by emailId

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Amount,Status,UTR,TXID\n");

    // Manually read from the cursor
    let doc;
    while ((doc = await cursor.next()) !== null) {
      // Write each document to the stream
      passThroughStream.write(transactionToCsvRowMerchant(doc));
    }

    // End the stream when all data has been processed
    passThroughStream.end();

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadUserTransactionsCsvWithStatus(query) {
  try {
    const userId = await getUserId(query.emailId
    );
    if(!userId)
    {
      throw 'user not found';
    }
    // Create a readable stream from the MongoDB cursor, filtering by emailId
    const cursor = Transaction.find({ uuid: userId, status:query.status }).sort({ createdAt: -1 }).cursor();// Filter by emailId

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Amount,Status,UTR,TXID\n");

    // Manually read from the cursor
    let doc;
    while ((doc = await cursor.next()) !== null) {
      // Write each document to the stream
      passThroughStream.write(transactionToCsvRowMerchant(doc));
    }

    // End the stream when all data has been processed
    passThroughStream.end();

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadUserTransactionsByDateCsv(query) {
  try {
    // Convert startDate and endDate to IST
    const istStartDate = moment.tz(query.startDate, "Asia/Kolkata").startOf("day").toISOString();
    const istEndDate = moment.tz(query.endDate, "Asia/Kolkata").endOf("day").toISOString();
    const userId = await getUserId(query.emailId);
      if(!userId)
      {
        throw 'user not found';
      }
    // Create a readable stream from the MongoDB cursor
    const cursor = Transaction.find({
      uuid:userId,
      transaction_date: { $gte: istStartDate, $lte: istEndDate },
    }).cursor();

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Amount,Status,UTR,TXID\n");

    cursor.on('data', (doc) => {
      // Convert the document to a CSV row and write to the stream
      passThroughStream.write(transactionToCsvRowMerchant(doc));
    });

    cursor.on('end', () => {
      // End the stream when all data has been processed
      passThroughStream.end();
    });

    cursor.on('error', (error) => {
      console.error("Error while streaming data from MongoDB:", error);
      throw error;
    });

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function downloadUserTransactionsByDateWithStatusCsv(query) {
  try {
    // Convert startDate and endDate to IST
    const istStartDate = moment.tz(query.startDate, "Asia/Kolkata").startOf("day").toISOString();
    const istEndDate = moment.tz(query.endDate, "Asia/Kolkata").endOf("day").toISOString();
    const userId = await getUserId(query.emailId);
      if(!userId)
      {
        throw 'user not found';
      }
    // Create a readable stream from the MongoDB cursor
    const cursor = Transaction.find({
      uuid:userId,
      transaction_date: { $gte: istStartDate, $lte: istEndDate },
      status:query.status
    }).cursor();

    // PassThrough stream to pipe data directly to S3
    const passThroughStream = new PassThrough();

    // CSV header
    passThroughStream.write("Time,Date,Amount,Status,UTR,TXID\n");

    cursor.on('data', (doc) => {
      // Convert the document to a CSV row and write to the stream
      passThroughStream.write(transactionToCsvRowMerchant(doc));
    });

    cursor.on('end', () => {
      // End the stream when all data has been processed
      passThroughStream.end();
    });

    cursor.on('error', (error) => {
      console.error("Error while streaming data from MongoDB:", error);
      throw error;
    });

    // Upload the CSV stream to S3 while streaming
    const csvUrl = await uploadCsvStreamToS3(passThroughStream);
    return csvUrl; // Return the URL of the uploaded CSV file

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}


// async function getTotalVolumeMerchant(emailId, statusFilter) {
//   const result = await userDao.aggregate([
//     {
//       $match: { emailId: emailId }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $match: { "transactions.status": statusFilter }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }
async function getTotalVolumeMerchant(emailId, statusFilter) {
  try {
    const userId = await getUserId(emailId);
    const result = await Transaction.aggregate([
      {
        $match: {
          uuid: userId, // Assuming uuid is a string representation of the user's Object ID
          status: statusFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTotalPayoutVolumeMerchant(emailId, statusFilter) {
  try {
    const userId = await getUserId(emailId);
    const result = await PayoutTransaction.aggregate([
      {
        $match: {
          uuid: userId, // Assuming uuid is a string representation of the user's Object ID
          status: statusFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// async function getTotalVolumeMerchantWithGateway(emailId, statusFilter,gateway) {
//   let gatewayFilter;
//     if (gateway === 'paythrough') {
//       gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
//     } else {
//       gatewayFilter = gateway;
//     }
//   const result = await userDao.aggregate([
//     {
//       $match: { emailId: emailId }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $match: {
//         $and: [
//           { "transactions.status": statusFilter },
//           { "transactions.gateway": gatewayFilter }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }

async function getTotalVolumeMerchantWithGateway(
  emailId,
  statusFilter,
  gateway
) {
  try {
    const userId = await getUserId(emailId);
    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const result = await Transaction.aggregate([
      {
        $match: { uuid: userId, status: statusFilter, gateway: gatewayFilter },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTotalPayoutVolumeMerchantWithGateway(
  emailId,
  statusFilter,
  gateway
) {
  try {
    const userId = await getUserId(emailId);
    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const result = await PayoutTransaction.aggregate([
      {
        $match: { uuid: userId, status: statusFilter, gateway: gatewayFilter },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// async function getTotalMerchantVolumeByGatewayAndDate(emailId,status, gateway, startDate, endDate) {
//   // Convert startDate to IST
//   const istStartDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
//   // Convert endDate to IST
//   const istEndDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();

//   let gatewayFilter;
//   if (gateway === 'paythrough') {
//     gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
//   } else {
//     gatewayFilter = gateway;
//   }

//   const result = await userDao.aggregate([
//     {
//       $match: { emailId: emailId }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $match: {
//         $and: [
//           { "transactions.status": status },
//           { "transactions.gateway": gatewayFilter },
//           { "transactions.transaction_date": { $gte: istStartDate, $lte: istEndDate } }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }

async function getTotalMerchantVolumeByGatewayAndDate(
  emailId,
  status,
  gateway,
  startDate,
  endDate
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const userId = await getUserId(emailId);
    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const result = await Transaction.aggregate([
      {
        $match: {
          uuid: userId,
          status: status,
          gateway: gatewayFilter,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
async function getTotalPayoutMerchantVolumeByGatewayAndDate(
  emailId,
  status,
  gateway,
  startDate,
  endDate
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const userId = await getUserId(emailId);
    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const result = await PayoutTransaction.aggregate([
      {
        $match: {
          uuid: userId,
          status: status,
          gateway: gatewayFilter,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
// async function getTotalMerchantVolumeByDate(emailId,status, startDate, endDate) {
//   // Convert startDate to IST
//   const istStartDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
//   // Convert endDate to IST
//   const istEndDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();

//   const result = await userDao.aggregate([
//     {
//       $match: { emailId: emailId }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $match: {
//         $and: [
//           { "transactions.status": status },
//           { "transactions.transaction_date": { $gte: istStartDate, $lte: istEndDate } }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }

async function getTotalMerchantVolumeByDate(
  emailId,
  status,
  startDate,
  endDate
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const userId = await getUserId(emailId);

    const result = await Transaction.aggregate([
      {
        $match: {
          uuid: userId,
          status: status,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTotalPayoutMerchantVolumeByDate(
  emailId,
  status,
  startDate,
  endDate
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const userId = await getUserId(emailId);

    const result = await PayoutTransaction.aggregate([
      {
        $match: {
          uuid: userId,
          status: status,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// async function getTotalMerchantVolumeByGatewayAndDateWithTime(emailId,status, gateway, startDate, endDate, startTime, endTime) {
//   // Convert startDate to IST
//   const istStartDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
//   // Convert endDate to IST
//   const istEndDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();

//   let gatewayFilter;
//   if (gateway === 'paythrough') {
//     gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
//   } else {
//     gatewayFilter = gateway;
//   }

//   const result = await userDao.aggregate([
//     {
//       $match: { emailId: emailId }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $addFields: {
//         istTransactionDate: {
//           $dateToString: {
//             format: '%Y-%m-%dT%H:%M:%S.%LZ',
//             date: { $toDate: "$transactions.transaction_date" },
//             timezone: 'Asia/Kolkata'
//           }
//         }
//       }
//     },
//     {
//       $match: {
//         $and: [
//           { "transactions.status": status },
//           { "transactions.gateway": gatewayFilter },
//           { "transactions.transaction_date": { $gte: istStartDate, $lte: istEndDate } },
//           {
//             $expr: {
//               $and: [
//                 { $gte: ["$istTransactionDate", `${startDate}T${startTime}.000Z`] },
//                 { $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`] }
//               ]
//             }
//           }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }

async function getTotalMerchantVolumeByGatewayAndDateWithTime(
  emailId,
  status,
  gateway,
  startDate,
  endDate,
  startTime,
  endTime
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const userId = await getUserId(emailId);

    const result = await Transaction.aggregate([
      {
        $match: { uuid: userId, status: status },
      },
      {
        $addFields: {
          istTransactionDate: {
            $dateToString: {
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
              date: { $toDate: "$transaction_date" },
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      {
        $match: {
          $and: [
            { status: status },
            { gateway: gatewayFilter },
            { transaction_date: { $gte: istStartDate, $lte: istEndDate } },
            {
              $expr: {
                $and: [
                  {
                    $gte: [
                      "$istTransactionDate",
                      `${startDate}T${startTime}.000Z`,
                    ],
                  },
                  {
                    $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`],
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTotalPayoutMerchantVolumeByGatewayAndDateWithTime(
  emailId,
  status,
  gateway,
  startDate,
  endDate,
  startTime,
  endTime
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    let gatewayFilter;
    if (gateway === "paythrough") {
      gatewayFilter = { $in: ["paythrough", "paythroughIntent"] };
    } else {
      gatewayFilter = gateway;
    }

    const userId = await getUserId(emailId);

    const result = await PayoutTransaction.aggregate([
      {
        $match: { uuid: userId, status: status },
      },
      {
        $addFields: {
          istTransactionDate: {
            $dateToString: {
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
              date: { $toDate: "$transaction_date" },
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      {
        $match: {
          $and: [
            { status: status },
            { gateway: gatewayFilter },
            { transaction_date: { $gte: istStartDate, $lte: istEndDate } },
            {
              $expr: {
                $and: [
                  {
                    $gte: [
                      "$istTransactionDate",
                      `${startDate}T${startTime}.000Z`,
                    ],
                  },
                  {
                    $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`],
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// async function getTotalMerchantVolumeByDateWithTime(emailId,status, startDate, endDate, startTime, endTime) {
//   // Convert startDate to IST
//   const istStartDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toISOString();
//   // Convert endDate to IST
//   const istEndDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toISOString();

//   const result = await userDao.aggregate([
//     {
//       $match: { emailId: emailId }
//     },
//     {
//       $unwind: "$transactions"
//     },
//     {
//       $addFields: {
//         istTransactionDate: {
//           $dateToString: {
//             format: '%Y-%m-%dT%H:%M:%S.%LZ',
//             date: { $toDate: "$transactions.transaction_date" },
//             timezone: 'Asia/Kolkata'
//           }
//         }
//       }
//     },
//     {
//       $match: {
//         $and: [
//           { "transactions.status": status },
//           { "transactions.transaction_date": { $gte: istStartDate, $lte: istEndDate } },
//           {
//             $expr: {
//               $and: [
//                 { $gte: ["$istTransactionDate", `${startDate}T${startTime}.000Z`] },
//                 { $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`] }
//               ]
//             }
//           }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalVolume: { $sum: "$transactions.amount" },
//         totalCount: { $sum: 1 } // Count the number of transactions
//       }
//     }
//   ]);

//   // Access the total volume and total count directly
//   const totalVolume = result[0] ? result[0].totalVolume : 0;
//   const totalCount = result[0] ? result[0].totalCount : 0;

//   return { totalVolume, totalCount };
// }

async function getTotalMerchantVolumeByDateWithTime(
  emailId,
  status,
  startDate,
  endDate,
  startTime,
  endTime
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const userId = await getUserId(emailId);

    const result = await Transaction.aggregate([
      {
        $match: { uuid: userId, status: status },
      },
      {
        $addFields: {
          istTransactionDate: {
            $dateToString: {
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
              date: { $toDate: "$transaction_date" },
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      {
        $match: {
          $and: [
            { transaction_date: { $gte: istStartDate, $lte: istEndDate } },
            {
              $expr: {
                $and: [
                  {
                    $gte: [
                      "$istTransactionDate",
                      `${startDate}T${startTime}.000Z`,
                    ],
                  },
                  {
                    $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`],
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getTotalPayoutMerchantVolumeByDateWithTime(
  emailId,
  status,
  startDate,
  endDate,
  startTime,
  endTime
) {
  try {
    // Convert startDate to IST
    const istStartDate = moment
      .tz(startDate, "Asia/Kolkata")
      .startOf("day")
      .toISOString();
    // Convert endDate to IST
    const istEndDate = moment
      .tz(endDate, "Asia/Kolkata")
      .endOf("day")
      .toISOString();

    const userId = await getUserId(emailId);

    const result = await PayoutTransaction.aggregate([
      {
        $match: { uuid: userId, status: status },
      },
      {
        $addFields: {
          istTransactionDate: {
            $dateToString: {
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
              date: { $toDate: "$transaction_date" },
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      {
        $match: {
          $and: [
            { transaction_date: { $gte: istStartDate, $lte: istEndDate } },
            {
              $expr: {
                $and: [
                  {
                    $gte: [
                      "$istTransactionDate",
                      `${startDate}T${startTime}.000Z`,
                    ],
                  },
                  {
                    $lte: ["$istTransactionDate", `${endDate}T${endTime}.000Z`],
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount" },
          totalCount: { $sum: 1 }, // Count the number of transactions
        },
      },
    ]);

    // Access the total volume and total count directly
    const totalVolume = result[0] ? result[0].totalVolume : 0;
    const totalCount = result[0] ? result[0].totalCount : 0;

    return { totalVolume, totalCount };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function findParticularTx(status, gateway) {
  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          customer_email: { $regex: /.*@yaripay\.com$/i }, // Match any email ending with @yaripay.com
        },
      },
    ]);

    // // Convert the result to a string (for writing to a .txt file)
    // const resultContent = JSON.stringify(result, null, 2);

    // // Define the file path for the .txt file
    // const filePath = path.join(__dirname, 'transactions.txt');

    // // Write the result to a .txt file
    // fs.writeFile(filePath, resultContent, (err) => {
    //   if (err) {
    //     console.error('Error writing TXT file:', err);
    //   } else {
    //     console.log(`TXT file saved at ${filePath}`);
    //   }
    // });
    generateCSV(result)

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

/*
// transactionsModel.create({ transactions: reversed.reverse() }, function(err, result) {
                //     if (err) {
                //         console.error('Error inserting data:', err);
                //     } else {
                //         console.log('Data inserted successfully:', result);
                //     }
                
                //     // Close the connection after insertion
                // });
                //updateTransactionsData(reversed[0])
*/

module.exports = {
  updateTransactionsData,

  updateTransactionStatus,

  getAllTransactions,

  getAllTransactionsData,

  getAllMerchantTransactions,

  getTotalVolume,

  getTotalPayoutVolume,

  getDataById,

  getTransactionById,

  getTotalVolumeByGatewayAndStatus,

  getTotalVolumeByGatewayAndDate,

  getTotalVolumeByGatewayAndDateWithTime,

  getTransactionsByDate,

  getTransactionsByDateAndStatus,

  getTotalVolumeByDate,

  getTotalPayoutVolumeByDate,

  getTotalVolumeMerchant,

  getTotalVolumeMerchantWithGateway,

  getTotalMerchantVolumeByGatewayAndDate,

  getTotalMerchantVolumeByDate,

  getTotalMerchantVolumeByGatewayAndDateWithTime,

  getTotalMerchantVolumeByDateWithTime,

  getTotalVolumeByDateWithTime,

  getTotalPayoutVolumeByDateWithTime,

  getCompleteTransactions,

  getTotalPayoutVolumeByGatewayAndStatus,

  getTotalPayoutVolumeByGatewayAndDate,

  getTotalPayoutVolumeByGatewayAndDateWithTime,

  getTotalPayoutVolumeMerchant,

  getTotalPayoutMerchantVolumeByDate,

  getTotalPayoutVolumeMerchantWithGateway,

  getTotalPayoutMerchantVolumeByGatewayAndDate,

  getTotalPayoutMerchantVolumeByDateWithTime,

  getTotalPayoutMerchantVolumeByGatewayAndDateWithTime,

  findParticularTx,

  downloadTransactionsCsvByDate,

  downloadAllTransactionsCsv,

  downloadAllMerchantTransactionsCsv,

  downloadAllMerchantTransactionsByStatusCsv,

  downloadAllTransactionsByStatus,

  downloadTransactionsCsvByDateAndStatus,

  downloadMerchantTransactionsCsvByDate,

  downloadMerchantTransactionsCsvByDateAndStatus,

  downloadUserTransactionsCsv,

  downloadUserTransactionsCsvWithStatus,

  downloadUserTransactionsByDateCsv,

  downloadUserTransactionsByDateWithStatusCsv
};