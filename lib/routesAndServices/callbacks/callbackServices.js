const dao = require("../admin/adminDao");
const usrConst = require("../utils/userConstants");
const mapper = require("../utils/userMapper");
const appUtils = require("../../appUtils");
const { callbackPayin } = require("../../gateways/callback");
//const moment = require('moment');
const payoutDao = require("../payouts/payoutsDao");

const adminDao = require("../admin/adminDao");
const {
  updateTransactionStatus,
} = require("../utils/transactionDao");
const { getTransaction } = require("../transactionsDao/TransactionDao");
const { saveCallback } = require("./callbacksDao");
const { updateGatewayDetailsAtomic, updateGatewayDetailsFailedAtomic } = require("../gateway/gatewayDao");
const { updatePayhubData } = require("../utils/payhubDao");

//payouts callback
async function pinwalletPayoutCallback(details) {
  console.log("pinwallet payout", details)
  if (details) {
    //   {
    //     "date": "",
    //     "amount": "100",
    //     "mobileNumber": "xxxxxxx893",
    //     "transaction_id": "xxxxxxxxx",
    //     "rrn": "xxxxxxxxxxxx",
    //     "description": "Transaction status success",
    //     "emailid": "xxx@xxx.com",
    //     "transactionId_type": "UPI/IMPS",
    //     "status": "success"
    // }
    const transaction = await payoutDao.getPayoutDataById(details?.transaction_id)
    if (transaction) {

      const updateObj = {
        status: details?.status.toLowerCase(),
        utr: details?.rrn
      }

      const updated = await payoutDao.updateTransactionStatus(details?.transaction_id, updateObj)
      if (updated)
        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, "success")
      else
        return mapper.responseMappingWithData(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError, "unable to update transaction ")

    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    }


  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

  }
}

//paytmePayouts
async function paytmePayoutCallback(details) {
  console.log("paytme payout", details)
  if (details) {
    const transaction = await payoutDao.getPayoutDataById(details?.transaction_id)
    if (transaction) {

      const updateObj = {
        status: details?.status.toLowerCase(),
        utr: details?.rrn ? details?.rrn : ''
      }
      const txQuery = {
        transactionId: details?.transaction_id
      }
      const adminQuery = {
        emailId: 'samir123@payhub'
      }
      const user = await payoutDao.getUserDataByTxId(txQuery)
      const admin = await adminDao.getUserDetails(adminQuery)
      if (user) {
        const userQuery = {
          uuid: user?._id
        }
        if (details?.status?.toLowerCase() == 'success') {

          const updateObj = {
            payoutBalance: Number(user.payoutBalance) - Number(details?.amount),
            $set: {

              "payoutsData.last24hr": Number(user.payoutsData.last24hr) + Number(details?.amount),
              "payoutsData.last24hrSuccess": Number(user.payoutsData.last24hrSuccess) + 1,
              "payoutsData.last24hrTotal": Number(user.payoutsData.last24hrTotal) + 1,
              "payoutsData.totalTransactions": Number(user.payoutsData.totalTransactions) + 1,
              "payoutsData.successfulTransactions": Number(user.payoutsData.successfulTransactions) + 1,

            }
          }
          const adminUpdateObj = {
            payoutsBalance: Number(admin.payoutsBalance) - Number(details?.amount),
            $set: {

              "payouts.last24hr": Number(admin.payouts.last24hr) + Number(details?.amount),
              "payouts.last24hrSuccess": Number(admin.payouts.last24hrSuccess) + 1,
              "payouts.last24hrTotal": Number(admin.payouts.last24hrTotal) + 1,
              "payouts.totalTransactions": Number(admin.payouts.totalTransactions) + 1,
              "payouts.successfulTransactions": Number(admin.payouts.successfulTransactions) + 1,

            }
          }
          payoutDao.updateAdminProfile({ emailId: 'samir123@payhub' }, adminUpdateObj)
          payoutDao.updateUserProfile(userQuery, updateObj)

        } else {
          const updateObj = {
            $set: {

              "payoutsData.last24hrTotal": Number(user.payoutsData.last24hrTotal) + 1,
              "payoutsData.totalTransactions": Number(user.payoutsData.totalTransactions) + 1,

            }
          }
          const adminUpdateObj = {
            $set: {

              "payouts.last24hrTotal": Number(admin.payouts.last24hrTotal) + 1,
              "payouts.totalTransactions": Number(admin.payouts.totalTransactions) + 1,

            }
          }
          payoutDao.updateUserProfile(userQuery, updateObj)
          payoutDao.updateAdminProfile({ emailId: 'samir123@payhub' }, adminUpdateObj)

        }
      }
      if (user.payoutCallbackUrl) {
        const callBackDetails = {
          transaction_id: details?.transaction_id,
          amount: details?.amount,
          status: details?.status?.toLowerCase(),
          transaction_date: transaction?.transaction_date

        }
        callbackPayin(callBackDetails, user.payoutCallbackUrl)
      }
      const updated = await payoutDao.updateTransactionStatus(details?.transaction_id, updateObj)
      if (updated)
        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, "success")
      else
        return mapper.responseMappingWithData(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError, "unable to update transaction ")

    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    }


  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

  }
}

async function cashfreePayoutCallback(details) {
 
 
  if (details) {
    const Transaction = await payoutDao.getPayoutDataById(details?.transferId)
    const transaction = Transaction[0]?Transaction[0]:false
    if (!transaction) {
      callbackPayin(details, "https://payhubsandbox.onrender.com/callback/cashfreePayoutStatus")
        .catch((error) => {
          console.log(error)
        })
      return { message: 'forwaded to sandbox' }
    }
    if (transaction) {

      const updateObj = {
        status: details?.event?.toLowerCase() == 'transfer_success'?'success':'failed',
        utr: details?.utr ? details?.utr : ''
      }
      const txQuery = {
        transactionId: details?.transferId
      }
      const adminQuery = {
        emailId: 'samir123@payhub'
      }
      const user = await payoutDao.getUserDataByTxId(txQuery)
      const admin = await adminDao.getUserDetails(adminQuery)
      if (user) {
        const userQuery = {
          uuid: user?._id
        }
        if (details?.event?.toLowerCase() == 'transfer_success') {

          const updateObj = {
            payoutBalance: Number(user.payoutBalance) - Number(transaction?.amount),
            $set: {

              "payoutsData.last24hr": Number(user.payoutsData.last24hr) + Number(transaction?.amount),
              "payoutsData.last24hrSuccess": Number(user.payoutsData.last24hrSuccess) + 1,
              "payoutsData.last24hrTotal": Number(user.payoutsData.last24hrTotal) + 1,
              "payoutsData.totalTransactions": Number(user.payoutsData.totalTransactions) + 1,
              "payoutsData.successfulTransactions": Number(user.payoutsData.successfulTransactions) + 1,

            }
          }
          const adminUpdateObj = {
            payoutsBalance: Number(admin.payoutsBalance) - Number(transaction?.amount),
            $set: {

              "payouts.last24hr": Number(admin.payouts.last24hr) + Number(transaction?.amount),
              "payouts.last24hrSuccess": Number(admin.payouts.last24hrSuccess) + 1,
              "payouts.last24hrTotal": Number(admin.payouts.last24hrTotal) + 1,
              "payouts.totalTransactions": Number(admin.payouts.totalTransactions) + 1,
              "payouts.successfulTransactions": Number(admin.payouts.successfulTransactions) + 1,

            }
          }
          console.log(adminUpdateObj,updateObj,transaction)
          payoutDao.updateAdminProfile({ emailId: 'samir123@payhub' }, adminUpdateObj)
          payoutDao.updateUserProfile(userQuery, updateObj)

        } else {
          const updateObj = {
            $set: {

              "payoutsData.last24hrTotal": Number(user.payoutsData.last24hrTotal) + 1,
              "payoutsData.totalTransactions": Number(user.payoutsData.totalTransactions) + 1,

            }
          }
          const adminUpdateObj = {
            $set: {

              "payouts.last24hrTotal": Number(admin.payouts.last24hrTotal) + 1,
              "payouts.totalTransactions": Number(admin.payouts.totalTransactions) + 1,

            }
          }
          payoutDao.updateUserProfile(userQuery, updateObj)
          payoutDao.updateAdminProfile({ emailId: 'samir123@payhub' }, adminUpdateObj)

        }
      }
      if (user.payoutCallbackUrl) {
        const callBackDetails = {
          transaction_id: details?.transferId,
          amount: transaction?.amount,
          status: details?.event?.toLowerCase()=='transfer_success'?'success':"failed",
          transaction_date: transaction?.transaction_date

        }
        callbackPayin(callBackDetails, user.payoutCallbackUrl)
      }
      const updated = await payoutDao.updateTransactionStatus(details?.transferId, updateObj)
      if (updated)
        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, "success")
      else
        return mapper.responseMappingWithData(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError, "unable to update transaction ")

    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    }


  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

  }
}

async function kwikpaisaPayoutCallback(details) {
 console.log(details)
 
  if (details) {
    const Transaction = await payoutDao.getPayoutDataById(details?.unique_system_order_id)
    const transaction = Transaction[0]?Transaction[0]:false
    if (!transaction) {
      callbackPayin(details, "https://payhubsandbox.onrender.com/callback/cashfreePayoutStatus")
        .catch((error) => {
          console.log(error)
        })
      return { message: 'forwaded to sandbox' }
    }
    if (transaction) {

      const updateObj = {
        status:details?.status?.toLowerCase() === "success" ? "success" : "failed",
      utr: details?.tranfer_rrn_number || "",
      }
      const txQuery = {
        transactionId: details?.unique_system_order_id
      }
      const adminQuery = {
        emailId: 'samir123@payhub'
      }
      const user = await payoutDao.getUserDataByTxId(txQuery)
      const admin = await adminDao.getUserDetails(adminQuery)
      if (user) {
        const userQuery = {
          uuid: user?._id
        }
        if (details?.status?.toLowerCase() === "success") {

          const updateObj = {
            $set: {

              "payoutsData.last24hr": Number(user.payoutsData.last24hr) + Number(transaction?.amount),
              "payoutsData.last24hrSuccess": Number(user.payoutsData.last24hrSuccess) + 1,
              "payoutsData.last24hrTotal": Number(user.payoutsData.last24hrTotal) + 1,
              "payoutsData.totalTransactions": Number(user.payoutsData.totalTransactions) + 1,
              "payoutsData.successfulTransactions": Number(user.payoutsData.successfulTransactions) + 1,

            }
          }
          const adminUpdateObj = {
           // payoutsBalance: Number(admin.payoutsBalance) - Number(transaction?.amount),
            $set: {

              "payouts.last24hr": Number(admin.payouts.last24hr) + Number(transaction?.amount),
              "payouts.last24hrSuccess": Number(admin.payouts.last24hrSuccess) + 1,
              "payouts.last24hrTotal": Number(admin.payouts.last24hrTotal) + 1,
              "payouts.totalTransactions": Number(admin.payouts.totalTransactions) + 1,
              "payouts.successfulTransactions": Number(admin.payouts.successfulTransactions) + 1,

            }
          }
          console.log(adminUpdateObj,updateObj,transaction)
          payoutDao.updateAdminProfile({ emailId: 'samir123@payhub' }, adminUpdateObj)
          payoutDao.updateUserProfile(userQuery, updateObj)

        } else {
          const updateObj = {
            payoutBalance: Number(user.payoutBalance) + Number(transaction?.amount),
            $set: {

              "payoutsData.last24hrTotal": Number(user.payoutsData.last24hrTotal) + 1,
              "payoutsData.totalTransactions": Number(user.payoutsData.totalTransactions) + 1,

            }
          }
          const adminUpdateObj = {
            payoutsBalance: Number(admin.payoutsBalance) + Number(transaction?.amount),
            $set: {

              "payouts.last24hrTotal": Number(admin.payouts.last24hrTotal) + 1,
              "payouts.totalTransactions": Number(admin.payouts.totalTransactions) + 1,

            }
          }
          payoutDao.updateUserProfile(userQuery, updateObj)
          payoutDao.updateAdminProfile({ emailId: 'samir123@payhub' }, adminUpdateObj)

        }
      }
      if (user.payoutCallbackUrl) {
        const callBackDetails = {
          transaction_id:details?.unique_system_order_id,
          amount: transaction?.amount,
          status: details?.status?.toLowerCase() === "success" ? "success" : "failed",
          transaction_date: transaction?.transaction_date,
          utr: details?.tranfer_rrn_number,


        }
        console.log(user.offrampCallback)

        callbackPayin(callBackDetails, user.payoutCallbackUrl)
        .catch((error)=>{
          console.log(error)
        })
        if(user.offrampCallback)
        {
          console.log('offramp callback sent')
          callbackPayin(callBackDetails, user.offrampCallback)
          .catch((error)=>{
            console.log(error)
          })
        }
      }
      const updated = await payoutDao.updateTransactionStatus(details?.unique_system_order_id, updateObj)
      if (updated)
        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, "success")
      else
        return mapper.responseMappingWithData(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError, "unable to update transaction ")

    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    }


  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

  }
}

//payins callbacks


async function saveTxPaytme(details) {
  console.log("paytme", details);
  if (details) {
    const query = {
      transactionId: details.transaction_id,
    };
    let updateObj = {
      status: details.status == 1 ? 'success' : details.status == 2 ? 'failed' : "pending",
      utr: details.rrn,
    };
    let adminQuery = {
      emailId: "samir123@payhub",
    };
    const transaction = await getTransaction(details.transaction_id);
    const admin = await dao.getUserDetails(adminQuery);
    const gatewayData = await adminDao.getGatewayDetails("paytmE");
    const response = await dao.getUserBalance2(query);
    if (details.amount && details.status == 1) {
      const balance = response[0].balance;
      const user24hr = response[0].last24hr;
      const yesterday = response[0].yesterday;
      const admin24hr = admin.last24hr;
      const adminBalance = admin.balance;
      let adminUpdate = {
        last24hr: Number(admin24hr) + Number(details.amount),
        balance: Number(adminBalance) + Number(details.amount),
        totalTransactions: Number(admin.totalTransactions) + 1,
        successfulTransactions: Number(admin.successfulTransactions) + 1,
        last24hrSuccess: Number(admin.last24hrSuccess) + 1,
        last24hrTotal: Number(admin.last24hrTotal) + 1,
      };
      const feeCollected =
        Number(gatewayData.feeCollected24hr) +
        (Number(response[0].platformFee) > 0 ? Number(details.amount) * (Number(response[0].platformFee) / 100) : 0);
      const totalFeeCollected =
        Number(gatewayData.totalFeeCollected) +
        (Number(response[0].platformFee) > 0 ? Number(details.amount) * (Number(response[0].platformFee) / 100) : 0);
      console.log(feeCollected, totalFeeCollected);
      let gatewayUpdate = {
        last24hr: Number(gatewayData.last24hr) + Number(details.amount),
        last24hrSuccess: Number(gatewayData.last24hrSuccess) + 1,
        successfulTransactions: Number(gatewayData.successfulTransactions) + 1,
        totalVolume: Number(gatewayData.totalVolume) + Number(details.amount),
        feeCollected24hr: feeCollected,
        totalFeeCollected: totalFeeCollected,
      };
      let updateObj = {
        balance: Number(details.amount) + Number(balance),
        utr: details.rrn,
        last24hr: Number(user24hr) + Number(details.amount),
        totalTransactions: Number(response[0].totalTransactions) + 1,
        successfulTransactions: Number(response[0].successfulTransactions) + 1,
        last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
        last24hrTotal: Number(response[0].last24hrTotal) + 1,
        todayFee: Number(response[0].platformFee) > 0 ? Number(response[0].todayFee) +
          Number(details.amount) * (Number(response[0].platformFee) / 100) : 0,
      };
      const txData = {
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: "success",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        utr: details.rrn,
        transaction_date: transaction.transaction_date,
      };
      const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
      let callBackDetails = {
        transaction_id: details.transaction_id,
        status: "success",
        amount: details.amount,
        utr: details.rrn,
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        date: transaction.transaction_date,
        encryptedData: encryptedData,
      };
      console.log("callback details..", callBackDetails);
      await dao.updateProfile(adminQuery, adminUpdate);
      await dao.updateUserProfile2(query, updateObj);
      await dao.updateGatewayDetails("paytmE", gatewayUpdate);

      callbackPayin(callBackDetails, response[0].callbackUrl).catch((e) => console.log(e));
    } else if (details.status == 2) {
      //const response = await dao.getUserBalance2(query);
      const txData = {
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: "failed",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        utr: details.rrn,
        transaction_date: transaction.transaction_date,
      };
      const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
      let callBackDetails = {
        transaction_id: details.transaction_id,
        status: "failed",
        amount: details.amount,
        utr: details.rrn ? details.rrn : "",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        date: transaction.transaction_date,
        encryptedData: encryptedData,
      };
      let adminUpdate = {
        totalTransactions: Number(admin.totalTransactions) + 1,
        last24hrTotal: Number(admin.last24hrTotal) + 1,
      };
      updateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
      updateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1;
      await dao.updateProfile(adminQuery, adminUpdate);
      await dao.updateUserProfile2(query, updateObj);
      callbackPayin(callBackDetails, response[0].callbackUrl);
    }

    saveCallback(details.transaction_id, 'paytmE', details)

    return updateTransactionStatus(details.transaction_id, updateObj);
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
}

async function callbackPgbroPayin(details) {
  console.log("pgbro", details);
  if (details) {
    const query = {
      transactionId: details.transaction_id,
    };
    let updateObj = {
      status: details.status,
      utr: details.transaction_ref_no,
    };
    let adminQuery = {
      emailId: "samir123@payhub",
    };
    const transaction = await getTransaction(details.transaction_id);
    const admin = await dao.getUserDetails(adminQuery);
    const gatewayData = await adminDao.getGatewayDetails("pgbro");
    const response = await dao.getUserBalance2(query);
    if (details.amount && details.status == 'success') {
      const balance = response[0].balance;
      const user24hr = response[0].last24hr;
      const yesterday = response[0].yesterday;
      const admin24hr = admin.last24hr;
      const adminBalance = admin.balance;
      let adminUpdate = {
        last24hr: Number(admin24hr) + Number(details.amount),
        balance: Number(adminBalance) + Number(details.amount),
        totalTransactions: Number(admin.totalTransactions) + 1,
        successfulTransactions: Number(admin.successfulTransactions) + 1,
        last24hrSuccess: Number(admin.last24hrSuccess) + 1,
        last24hrTotal: Number(admin.last24hrTotal) + 1,
      };
      const feeCollected =
        Number(gatewayData.feeCollected24hr) +
        (Number(response[0].platformFee) > 0 ? Number(details.amount) * (Number(response[0].platformFee) / 100) : 0);
      const totalFeeCollected =
        Number(gatewayData.totalFeeCollected) +
        (Number(response[0].platformFee) > 0 ? Number(details.amount) * (Number(response[0].platformFee) / 100) : 0);
      console.log(feeCollected, totalFeeCollected);
      let gatewayUpdate = {
        last24hr: Number(gatewayData.last24hr) + Number(details.amount),
        last24hrSuccess: Number(gatewayData.last24hrSuccess) + 1,
        successfulTransactions: Number(gatewayData.successfulTransactions) + 1,
        totalVolume: Number(gatewayData.totalVolume) + Number(details.amount),
        feeCollected24hr: feeCollected,
        totalFeeCollected: totalFeeCollected,
      };
      let updateObj = {
        balance: Number(details.amount) + Number(balance),
        utr: details.rrn,
        last24hr: Number(user24hr) + Number(details.amount),
        totalTransactions: Number(response[0].totalTransactions) + 1,
        successfulTransactions: Number(response[0].successfulTransactions) + 1,
        last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
        last24hrTotal: Number(response[0].last24hrTotal) + 1,
        todayFee: Number(response[0].platformFee) > 0 ? Number(response[0].todayFee) +
          Number(details.amount) * (Number(response[0].platformFee) / 100) : 0,
      };
      const txData = {
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: "success",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        utr: details.rrn,
        transaction_date: transaction.transaction_date,
      };
      const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
      let callBackDetails = {
        transaction_id: details.transaction_id,
        status: "success",
        amount: details.amount,
        utr: details.rrn,
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        date: transaction.transaction_date,
        encryptedData: encryptedData,
      };
      console.log("callback details..", callBackDetails);
      await dao.updateProfile(adminQuery, adminUpdate);
      await dao.updateUserProfile2(query, updateObj);
      await dao.updateGatewayDetails("pgbro", gatewayUpdate);

      callbackPayin(callBackDetails, response[0].callbackUrl).catch((e) => console.log(e));
    } else if (details.status == "failed") {
      //const response = await dao.getUserBalance2(query);
      const txData = {
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: "failed",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        utr: details.rrn,
        transaction_date: transaction.transaction_date,
      };
      const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
      let callBackDetails = {
        transaction_id: details.transaction_id,
        status: "failed",
        amount: details.amount,
        utr: details.rrn ? details.rrn : "",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        date: transaction.transaction_date,
        encryptedData: encryptedData,
      };
      let adminUpdate = {
        totalTransactions: Number(admin.totalTransactions) + 1,
        last24hrTotal: Number(admin.last24hrTotal) + 1,
      };
      updateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
      updateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1;
      await dao.updateProfile(adminQuery, adminUpdate);
      await dao.updateUserProfile2(query, updateObj);
      callbackPayin(callBackDetails, response[0].callbackUrl);
    }

    saveCallback(details.transaction_id, 'pgbro', details)

    return updateTransactionStatus(details.transaction_id, updateObj);
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
}

async function callbackRazorpayPayin(details) {
  console.log("razorpay", details);
  if (details) {
    const query = {
      transactionId: details.id,
    };
    let updateObj = {
      status: details?.status=='paid'?'success':'failed',
      utr: details.rrn
    };
    let adminQuery = {
      emailId: "samir123@payhub",
    };
    const transaction = await getTransaction(details.id);
    const admin = await dao.getUserDetails(adminQuery);
    const gatewayData = await adminDao.getGatewayDetails("pgbro");
    const response = await dao.getUserBalance2(query);
    const amount = Number(details.amount)/100
    if (details.amount && details.status == 'paid') {
      const balance = response[0].balance;
      const user24hr = response[0].last24hr;
      const yesterday = response[0].yesterday;
      const admin24hr = admin.last24hr;
      const adminBalance = admin.balance;
      let adminUpdate = {
        last24hr: Number(admin24hr) + Number(amount),
        balance: Number(adminBalance) + Number(amount),
        totalTransactions: Number(admin.totalTransactions) + 1,
        successfulTransactions: Number(admin.successfulTransactions) + 1,
        last24hrSuccess: Number(admin.last24hrSuccess) + 1,
        last24hrTotal: Number(admin.last24hrTotal) + 1,
      };
      const feeCollected =
        Number(gatewayData.feeCollected24hr) +
        (Number(response[0].platformFee) > 0 ? Number(amount) * (Number(response[0].platformFee) / 100) : 0);
      const totalFeeCollected =
        Number(gatewayData.totalFeeCollected) +
        (Number(response[0].platformFee) > 0 ? Number(amount) * (Number(response[0].platformFee) / 100) : 0);
      console.log(feeCollected, totalFeeCollected);
      let gatewayUpdate = {
        last24hr: Number(gatewayData.last24hr) + Number(amount),
        last24hrSuccess: Number(gatewayData.last24hrSuccess) + 1,
        successfulTransactions: Number(gatewayData.successfulTransactions) + 1,
        totalVolume: Number(gatewayData.totalVolume) + Number(amount),
        feeCollected24hr: feeCollected,
        totalFeeCollected: totalFeeCollected,
      };
      let updateObj = {
        balance: Number(amount) + Number(balance),
        utr: details.rrn,
        last24hr: Number(user24hr) + Number(amount),
        totalTransactions: Number(response[0].totalTransactions) + 1,
        successfulTransactions: Number(response[0].successfulTransactions) + 1,
        last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
        last24hrTotal: Number(response[0].last24hrTotal) + 1,
        todayFee: Number(response[0].platformFee) > 0 ? Number(response[0].todayFee) +
          Number(amount) * (Number(response[0].platformFee) / 100) : 0,
      };
      const txData = {
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: "success",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        utr: details.rrn,
        transaction_date: transaction.transaction_date,
      };
      const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
      let callBackDetails = {
        transaction_id: details.id,
        status: "success",
        amount: amount,
        utr: details.rrn,
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        date: transaction.transaction_date,
        encryptedData: encryptedData,
      };
      console.log("callback details..", callBackDetails);
      await dao.updateProfile(adminQuery, adminUpdate);
      await dao.updateUserProfile2(query, updateObj);
      await dao.updateGatewayDetails("pgbro", gatewayUpdate);

      callbackPayin(callBackDetails, response[0].callbackUrl).catch((e) => console.log(e));
    } else if (details.status == "failed") {
      //const response = await dao.getUserBalance2(query);
      const txData = {
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: "failed",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        utr: details.rrn,
        transaction_date: transaction.transaction_date,
      };
      const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
      let callBackDetails = {
        transaction_id: details.id,
        status: "failed",
        amount: amount,
        utr: details.rrn ? details.rrn : "",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        date: transaction.transaction_date,
        encryptedData: encryptedData,
      };
      let adminUpdate = {
        totalTransactions: Number(admin.totalTransactions) + 1,
        last24hrTotal: Number(admin.last24hrTotal) + 1,
      };
      updateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
      updateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1;
      await dao.updateProfile(adminQuery, adminUpdate);
      await dao.updateUserProfile2(query, updateObj);
      callbackPayin(callBackDetails, response[0].callbackUrl);
    }

    saveCallback(details.id, 'pgbro', details)

    return updateTransactionStatus(details.id, updateObj);
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
}

async function saveTxAirpay(details) {
  console.log('update check')
  if (details) {
    const query = {
      transactionId: details.APTRANSACTIONID,
    };
    const status = details.TRANSACTIONPAYMENTSTATUS == "RISK"||details.TRANSACTIONPAYMENTSTATUS == "SUCCESS"?"success":"failed"
    let updateObj = {
      status: status,
      utr: details.RRN,
    };
    let adminQuery = {
      emailId: "samir123@payhub",
    };
    const transaction = await getTransaction(details.APTRANSACTIONID);
    const admin = await dao.getUserDetails(adminQuery);
    const gatewayData = await adminDao.getGatewayDetails("airpay");

    const response = await dao.getUserBalance2(query);
    if (details.AMOUNT && (details.TRANSACTIONPAYMENTSTATUS == "SUCCESS"||details.TRANSACTIONPAYMENTSTATUS == "RISK")) {
      const balance = response[0].balance;
      const user24hr = response[0].last24hr;
      const admin24hr = admin.last24hr;
      const adminBalance = admin.balance;
      let adminUpdate = {
        last24hr: Number(admin24hr) + Number(details.AMOUNT),
        balance: Number(adminBalance) + Number(details.AMOUNT),
        totalTransactions: Number(admin.totalTransactions) + 1,
        successfulTransactions: Number(admin.successfulTransactions) + 1,
        last24hrSuccess: Number(admin.last24hrSuccess) + 1,
        last24hrTotal: Number(admin.last24hrTotal) + 1,
      };
      let payhubUpdate = {
        $inc: {
          last24hr: Number(details.AMOUNT),
          balance: Number(details.AMOUNT),
          totalTransactions: 1,
          successfulTransactions: 1,
          last24hrSuccess: 1,
          last24hrTotal: 1,
        },
      };
      const feeCollected =
        Number(gatewayData.feeCollected24hr) +
        (Number(response[0].platformFee) > 0 ? Number(details.AMOUNT) * (Number(response[0].platformFee) / 100) : 0);
      const totalFeeCollected =
        Number(gatewayData.totalFeeCollected) +
        (Number(response[0].platformFee) > 0 ? Number(details.AMOUNT) * (Number(response[0].platformFee) / 100) : 0);
      let gatewayUpdate = {
        last24hr: Number(gatewayData.last24hr) + Number(details.AMOUNT),
        last24hrSuccess: Number(gatewayData.last24hrSuccess) + 1,
        successfulTransactions: Number(gatewayData.successfulTransactions) + 1,
        totalVolume: Number(gatewayData.totalVolume) + Number(details.AMOUNT),
        feeCollected24hr: feeCollected,
        totalFeeCollected: totalFeeCollected,
      };
      let updateObj = {
        balance: Number(details.AMOUNT) + Number(balance),
        utr: details.RRN,
        last24hr: Number(user24hr) + Number(details.AMOUNT),
        totalTransactions: Number(response[0].totalTransactions) + 1,
        successfulTransactions: Number(response[0].successfulTransactions) + 1,
        last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
        last24hrTotal: Number(response[0].last24hrTotal) + 1,
        todayFee: Number(response[0].platformFee) > 0 ? Number(response[0].todayFee) +
          Number(details.AMOUNT) * (Number(response[0].platformFee) / 100) : 0,
      };
      const txData = {
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: details.TRANSACTIONPAYMENTSTATUS == "RISK"?"SUCCESS":"SUCCESS",
        phone: transaction.phone,
        username: transaction.username,
        upiId: details?.CUSTOMERVPA?details?.CUSTOMERVPA:transaction.upiId,
        utr: details.RRN,
        transaction_date: transaction.transaction_date,
      };
      const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
      let callBackDetails = {
        transaction_id: details.APTRANSACTIONID,
        status: details.TRANSACTIONPAYMENTSTATUS == "RISK"?"SUCCESS":"SUCCESS",
        amount: details.AMOUNT,
        utr: details.RRN,
        phone: transaction.phone,
        username: transaction.username,
        upiId: details?.CUSTOMERVPA?details?.CUSTOMERVPA:transaction.upiId,
        date: transaction.transaction_date,
        encryptedData: encryptedData,
      };
      await dao.updateProfile(adminQuery, adminUpdate);
      await dao.updateUserProfile2(query, updateObj);
      await dao.updateGatewayDetails("airpay", gatewayUpdate);
      await updateGatewayDetailsAtomic("airpay", details, feeCollected, totalFeeCollected)
      await updatePayhubData(payhubUpdate)

      callbackPayin(callBackDetails, response[0].callbackUrl).catch((e) => console.log(e));
    } else {
      let payhubUpdate = {
        $inc: {
          totalTransactions: 1,
          last24hrTotal: 1,
        },
      };
      //const response = await dao.getUserBalance2(query);
      const txData = {
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: "failed",
        phone: transaction.phone,
        username: transaction.username,
        upiId: details?.CUSTOMERVPA?details?.CUSTOMERVPA:transaction.upiId,
        utr: details.RRN,
        transaction_date: transaction.transaction_date,
      };
      const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
      let callBackDetails = {
        transaction_id: details.APTRANSACTIONID,
        status: "failed",
        amount: details.AMOUNT,
        utr: details.RRN ? details.RRN : "",
        phone: transaction.phone,
        username: transaction.username,
        upiId: details?.CUSTOMERVPA?details?.CUSTOMERVPA:transaction.upiId,
        date: transaction.transaction_date,
        encryptedData: encryptedData,
      };
      let adminUpdate = {
        totalTransactions: Number(admin.totalTransactions) + 1,
        last24hrTotal: Number(admin.last24hrTotal) + 1,
      };
      updateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
      updateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1;
      await dao.updateProfile(adminQuery, adminUpdate);
      await dao.updateUserProfile2(query, updateObj);
      await updateGatewayDetailsFailedAtomic('airpay')
      await updatePayhubData(payhubUpdate)

      callbackPayin(callBackDetails, response[0].callbackUrl);
    }
    saveCallback(details.APTRANSACTIONID, 'airpay', details);
    
    return updateTransactionStatus(details.APTRANSACTIONID, updateObj);
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
}
// async function saveTxAirpay(details) {
//  // console.log('update check');
//   if (details) {
//     const query = {
//       transactionId: details.APTRANSACTIONID,
//     };
//     const status = details.TRANSACTIONPAYMENTSTATUS == "RISK" || details.TRANSACTIONPAYMENTSTATUS == "SUCCESS" ? "success" : "failed";
//     let updateObj = {
//       status: status,
//       utr: details.RRN,
//     };
//     let adminQuery = {
//       emailId: "samir123@payhub",
//     };
    
//     // Fetch necessary details
//     const transaction = await getTransaction(details.APTRANSACTIONID);
//     const admin = await dao.getUserDetails(adminQuery);
//     const gatewayData = await adminDao.getGatewayDetails("airpay");
//     const response = await dao.getUserBalance2(query);

//     if (details.AMOUNT && (status === "success")) {
//       const platformFee = Number(response[0].platformFee) > 0 ? (Number(details.AMOUNT) * (Number(response[0].platformFee) / 100)) : 0;

//       // Admin update object using atomic increments
//       let adminUpdate = {
//         $inc: {
//           last24hr: Number(details.AMOUNT),
//           balance: Number(details.AMOUNT),
//           totalTransactions: 1,
//           successfulTransactions: 1,
//           last24hrSuccess: 1,
//           last24hrTotal: 1,
//         },
//       };

//       // Gateway update object using atomic increments
//       let gatewayUpdate = {
//         $inc: {
//           last24hr: Number(details.AMOUNT),
//           last24hrSuccess: 1,
//           successfulTransactions: 1,
//           totalVolume: Number(details.AMOUNT),
//           feeCollected24hr: platformFee,
//           totalFeeCollected: platformFee,
//         },
//       };

//       // User update object using atomic increments
//       let userUpdate = {
//         $inc: {
//           balance: Number(details.AMOUNT),
//           last24hr: Number(details.AMOUNT),
//           totalTransactions: 1,
//           successfulTransactions: 1,
//           last24hrSuccess: 1,
//           last24hrTotal: 1,
//           todayFee: platformFee,
//         },
//         $set: {
//           utr: details.RRN,
//         },
//       };

//       // Prepare callback details and transaction data
//       const txData = {
//         transaction_id: transaction.transactionId,
//         amount: transaction.amount,
//         status: "SUCCESS",
//         phone: transaction.phone,
//         username: transaction.username,
//         upiId: transaction.upiId,
//         utr: details.RRN,
//         transaction_date: transaction.transaction_date,
//       };

//       const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
//       let callBackDetails = {
//         ...txData,
//         encryptedData: encryptedData,
//       };

//       // Perform atomic updates
//       await dao.updateProfileCallback(adminQuery, adminUpdate);
//       await dao.updateUserProfileCallback(query, userUpdate);
//       await dao.updateGatewayDetailsCallback("airpay", gatewayUpdate);
//       await updateGatewayDetailsAtomic("airpay", details, feeCollected, totalFeeCollected)
//       await updatePayhubData(adminUpdate)
//       // Trigger the callback
//       callbackPayin(callBackDetails, response[0].callbackUrl).catch((e) => console.log(e));
      
//     } else {
//       // Failed transaction path
//       const txData = {
//         transaction_id: transaction.transactionId,
//         amount: transaction.amount,
//         status: "failed",
//         phone: transaction.phone,
//         username: transaction.username,
//         upiId: transaction.upiId,
//         utr: details.RRN,
//         transaction_date: transaction.transaction_date,
//       };

//       const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
//       let callBackDetails = {
//         ...txData,
//         encryptedData: encryptedData,
//       };

//       // Admin update for failed transaction
//       let adminUpdate = {
//         $inc: {
//           totalTransactions: 1,
//           last24hrTotal: 1,
//         },
//       };

//       let userUpdate = {
//         $inc: {
//           totalTransactions: 1,
//           last24hrTotal: 1,
//         },
//         $set: {
//           utr: details.RRN || "",
//         },
//       };

//       // Perform atomic updates for failed transactions
//       await dao.updateProfileCallback(adminQuery, adminUpdate);
//       await dao.updateUserProfileCallback(query, userUpdate);
//       await updateGatewayDetailsFailedAtomic('airpay')
//       // Trigger the callback for a failed transaction
//       callbackPayin(callBackDetails, response[0].callbackUrl);
//     }

//     // Save callback and update transaction status
//     saveCallback(details.APTRANSACTIONID, 'airpay', details);
//     return updateTransactionStatus(details.APTRANSACTIONID, updateObj);
    
//   } else {
//     return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
//   }
// }


async function saveTxKwikpaisa(details) {
  console.log('update check')
  if (details) {
    const query = {
      transactionId: details?.order_data?.order_id.toString(),
    };
    const status = details?.order_data?.payment_data?.payment_status.toLowerCase()== "success"?"success":"failed"
    let updateObj = {
      status: status,
      utr: details.order_data?.payment_data.bank_refrance_number,
    };
    let adminQuery = {
      emailId: "samir123@payhub",
    };
    const transaction = await getTransaction(query.transactionId);
    const admin = await dao.getUserDetails(adminQuery);
    const gatewayData = await adminDao.getGatewayDetails("kwikpaisa");

    const response = await dao.getUserBalance2(query);
    const amount = details.order_data?.purchase_details?.order_amount
    if (amount && status == "success") {
      const balance = response[0].balance;
      const user24hr = response[0].last24hr;
      const admin24hr = admin.last24hr;
      const adminBalance = admin.balance;
      let adminUpdate = {
        last24hr: Number(admin24hr) + Number(amount),
        balance: Number(adminBalance) + Number(amount),
        totalTransactions: Number(admin.totalTransactions) + 1,
        successfulTransactions: Number(admin.successfulTransactions) + 1,
        last24hrSuccess: Number(admin.last24hrSuccess) + 1,
        last24hrTotal: Number(admin.last24hrTotal) + 1,
      };
      const feeCollected =
        Number(gatewayData.feeCollected24hr) +
        (Number(response[0].platformFee) > 0 ? Number(amount) * (Number(response[0].platformFee) / 100) : 0);
      const totalFeeCollected =
        Number(gatewayData.totalFeeCollected) +
        (Number(response[0].platformFee) > 0 ? Number(amount) * (Number(response[0].platformFee) / 100) : 0);
      let gatewayUpdate = {
        last24hr: Number(gatewayData.last24hr) + Number(amount),
        last24hrSuccess: Number(gatewayData.last24hrSuccess) + 1,
        successfulTransactions: Number(gatewayData.successfulTransactions) + 1,
        totalVolume: Number(gatewayData.totalVolume) + Number(amount),
        feeCollected24hr: feeCollected,
        totalFeeCollected: totalFeeCollected,
      };
      let updateObj = {
        balance: Number(amount) + Number(balance),
        utr: details.order_data?.payment_data.bank_refrance_number,
        last24hr: Number(user24hr) + Number(amount),
        totalTransactions: Number(response[0].totalTransactions) + 1,
        successfulTransactions: Number(response[0].successfulTransactions) + 1,
        last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
        last24hrTotal: Number(response[0].last24hrTotal) + 1,
        todayFee: Number(response[0].platformFee) > 0 ? Number(response[0].todayFee) +
          Number(amount) * (Number(response[0].platformFee) / 100) : 0,
      };
      const txData = {
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: details.TRANSACTIONPAYMENTSTATUS == "RISK"?"SUCCESS":"SUCCESS",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        utr: details.order_data?.payment_data.bank_refrance_number,
        transaction_date: transaction.transaction_date,
      };
      const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
      let callBackDetails = {
        transaction_id: details.APTRANSACTIONID,
        status: details.TRANSACTIONPAYMENTSTATUS == "RISK"?"SUCCESS":"SUCCESS",
        amount: details.AMOUNT,
        utr: details.order_data?.payment_data.bank_refrance_number,
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        date: transaction.transaction_date,
        encryptedData: encryptedData,
      };
      await dao.updateProfile(adminQuery, adminUpdate);
      await dao.updateUserProfile2(query, updateObj);
      await dao.updateGatewayDetails("kwikpaisa", gatewayUpdate);
      await updateGatewayDetailsAtomic("kwikpaisa", details, feeCollected, totalFeeCollected)

      callbackPayin(callBackDetails, response[0].callbackUrl).catch((e) => console.log(e));
      if(response[0].onrampCallback)
      {
        callbackPayin(txData, response[0].onrampCallback);
      }
    } else {
      //const response = await dao.getUserBalance2(query);
      const txData = {
        transaction_id: transaction.transactionId,
        amount: transaction.amount,
        status: "failed",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        utr: details.order_data?.payment_data.bank_refrance_number,
        transaction_date: transaction.transaction_date,
      };
      const encryptedData = appUtils.encryptParameters(JSON.stringify(txData), response[0].encryptionKey);
      let callBackDetails = {
        transaction_id: details.APTRANSACTIONID,
        status: "failed",
        amount: amount,
        utr: details.order_data?.payment_data.bank_refrance_number ? details.order_data?.payment_data.bank_refrance_number: "",
        phone: transaction.phone,
        username: transaction.username,
        upiId: transaction.upiId,
        date: transaction.transaction_date,
        encryptedData: encryptedData,
      };
      let adminUpdate = {
        totalTransactions: Number(admin.totalTransactions) + 1,
        last24hrTotal: Number(admin.last24hrTotal) + 1,
      };
      updateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
      updateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1;
      await dao.updateProfile(adminQuery, adminUpdate);
      await dao.updateUserProfile2(query, updateObj);
      callbackPayin(callBackDetails, response[0].callbackUrl);
      if(response[0].onrampCallback)
      {
        callbackPayin(txData, response[0].onrampCallback);
      }
    }
    saveCallback(query.transactionId, 'kwikpaisa', details);
    
    return updateTransactionStatus(query.transactionId, updateObj);
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
}

module.exports = {
  pinwalletPayoutCallback,

  paytmePayoutCallback,

  saveTxPaytme,

  cashfreePayoutCallback,

  callbackPgbroPayin,

  callbackRazorpayPayin,

  saveTxAirpay,

  saveTxKwikpaisa,

  kwikpaisaPayoutCallback
}