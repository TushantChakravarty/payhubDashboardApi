/*#################################            Load modules start            ########################################### */
const fs = require("fs");
const path = require("path");

const {Settlements} = require("../../generic/models/settlementsModel")

const dao = require("./adminDao");
const usrConst = require("../utils/userConstants");
const mapper = require("../utils/userMapper");
const constants = require("../../constants");
const appUtils = require("../../appUtils");
const jwtHandler = require("../../jwtHandler");
const ObjectId = require("mongoose").Types.ObjectId;
const appUtil = require("../../appUtils");
const userDao = require("../user/userDao");
const mongoose = require("mongoose");
const { response } = require("express");
const { callbackPayin } = require("../../gateways/callback");
const { getUserId } = require("../user/userDao");

const { s3 } = require("../../config/awsConfig");

const { PassThrough } = require("stream");

const Sales = require("../../generic/models/salesModel");
const User = require("../../generic/models/userModel");
// const Admin = require("../../generic/models/adminModel")
const IpWhitelist = require("../../generic/models/IpWhitelistingModel");
const TopupTransactions = require("../../generic/models/topupModel");
const Admin = require("../../generic/models/adminModel");
//const moment = require('moment');
const moment = require("moment-timezone");
const {
  pinwalletPayout,
  generatePinWalletToken,
} = require("../../gateways/pinwallet");
const { Promise } = require("bluebird");
const adminDao = require("./adminDao");
const { decryptData } = require("../../gateways/swipeline");
const async = require("async");
const transactionsModel = require("../../generic/models/transactionsModel");
const {
  updateTransactionsData,
  updateTransactionStatus,
  getAllTransactions,
  getDataById,
  getTransactionById,
} = require("../utils/transactionDao");
const transactionDao = require("../utils/transactionDao");
const userConstants = require("../utils/userConstants");
const {
  createTransaction,
  getTransaction,
} = require("../transactionsDao/TransactionDao");
const { saveCallback } = require("../callbacks/callbacksDao");
const { createSettlements } = require("../settlements/settlementsServices");
const { addGateway } = require("../gateway/gatewayServices");
const {
  resetPasswordSandbox,
  resetPasswordSandboxAdmin,
} = require("../sandbox/sandbox");

const Joi = require("joi");
const { getAllGatewayData } = require("../utils/gatewayDao");
const { fetchPayhubData, updatePayhubData } = require("../utils/payhubDao");
const emailSchema = Joi.string()
  .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$|^[^\s@]+@[^\s@]+$/)
  .required();
// const BeeQueue = require('bee-queue');

// // Create a new queue instance
// const airpayQueue = new BeeQueue('airpay-queue');
/*#################################            Load modules end            ########################################### */

/**
 * Register user
 * @param {Object} details user details to get registered
 */

const dbUpdateQueue = async.queue(async (task, callback) => {
  try {
    const { updateFunction, query, updateObj } = task;

    // Placeholder for your actual database update logic
    console.log("inside queue");
    // Example: await updateFunction(query, details.APTRANSACTIONID, updateObj);

    // Simulate success for the example
    const userUpdated = await updateFunction(query, updateObj);

    if (userUpdated) {
      console.log("Database update successful");
    } else {
      console.log("Database update failed");
    }

    // Call the callback to indicate that the task is complete
    callback();
  } catch (error) {
    // Handle errors here
    console.error("Error in database update:", error);
    // Call the callback to indicate that the task is complete, even if there's an error
    callback(error);
  }
}, 3); // Concur

dbUpdateQueue.error((error, task) => {
  console.error("Error processing database update task:", error);
});

async function enqueueUpdateTask(updateFunction, query, updateObj) {
  return new Promise((resolve, reject) => {
    dbUpdateQueue.push({ updateFunction, query, updateObj }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function validateRequest(details) {
  let query = {
    emailId: details.emailId,
  };
  return dao.getUserDetails(query).then(async (userExists) => {
    if (userExists) {
      if (details.apiKey == userExists.apiKey) {
        return true;
      } else {
        return false;
      }
    } else {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "UnAuthorized");
    }
  });
}
async function validateBalanceRequest(details) {
  let query = {
    emailId: details.email_Id,
  };
  return dao.getUserDetails(query).then(async (userExists) => {
    if (userExists) {
      if (details.apiKey == userExists.apiKey) {
        return true;
      } else {
        return false;
      }
    } else {
      return mapper.responseMapping(
        usrConst.CODE.BadRequest,
        "User does not exist"
      );
    }
  });
}
function register(details) {
  if (!details || Object.keys(details).length == 0) {
    return mapper.responseMapping(
      usrConst.CODE.BadRequest,
      usrConst.MESSAGE.InvalidDetails
    );
  } else {
    if (details.emailId) {
      let query = {
        emailId: details.emailId,
      };

      return dao
        .getUserDetails(query)
        .then(async (userExists) => {
          if (userExists) {
            return mapper.responseMapping(
              usrConst.CODE.BadRequest,
              usrConst.MESSAGE.EmailAlreadyExists
            );
          } else {
            // let convertedPass = await appUtil.convertPass(details.password);
            // details.password = convertedPass

            // let verificationCode = Math.floor(Math.random() * (999999 - 100000) + 100000)
            // console.log({ verificationCode })

            // details.OTP = verificationCode
            // details.isEmailVerified=false

            /*
                     details.otpUpdatedAt = new Date().getTime()
                     details.createdAt = new Date().getTime()
                     details.isIdentityVerified = false
                    
                     let loginActivity = []
                     loginActivity.push({
                        
                         status: 'active'
                     })*/

            // details.loginActivity = loginActivity
            let password = appUtils.generatePassword(
              20,
              "123456789abcdefghijklmnopqrstuvwxyz"
            );
            let convertedPass = await appUtil.convertPass(password);
            details.password = convertedPass;
            const apiKey = Math.random().toString(36).slice(2);
            console.log(apiKey);

            details.apiKey = apiKey;
            details.balance = 0;
            details.gateway = "bazorpay";

            /*   let mailSent = Email.sendMessage( details.emailId)
                       console.log({ mailSent })*/

            return dao
              .createUser(details)
              .then((userCreated) => {
                if (userCreated) {
                  //             const EmailTemplate=Template.register(details.OTP)
                  // //console.log(isExist.emailId)
                  //            let mailSent = Email.sendMessage2(details.emailId,EmailTemplate)
                  //             console.log(mailSent)
                  // let filteredUserResponseFields = mapper.filteredUserResponseFields(userCreated)
                  let responseData = {
                    email: userCreated[0].emailId,
                    password: password,
                    apiKey: userCreated[0].apiKey,
                  };
                  console.log(responseData);
                  return mapper.responseMappingWithData(
                    usrConst.CODE.Success,
                    usrConst.MESSAGE.Success,
                    responseData
                  );
                } else {
                  console.log("Failed to save user");
                  return mapper.responseMapping(
                    usrConst.CODE.INTRNLSRVR,
                    usrConst.MESSAGE.internalServerError
                  );
                }
              })
              .catch((err) => {
                console.log({ err });
                return mapper.responseMapping(
                  usrConst.CODE.INTRNLSRVR,
                  usrConst.MESSAGE.internalServerError
                );
              });
          }
        })
        .catch((err) => {
          console.log({ err });
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        });
    }
  }
}

/**
 * Login
 * @param {Object} details user details
 */
function login(details) {
  if (!details.emailId && !details.password) {
    return mapper.responseMapping(
      usrConst.CODE.BadRequest,
      usrConst.MESSAGE.InvalidDetails
    );
  } else {
    let query = {};
    if (details.emailId) {
      query.emailId = details.emailId.toLowerCase();
    }
    // if (details.contactNumber) {

    //     query.contactNumber = details.contactNumber
    // }

    return dao
      .getUserDetails(query)
      .then(async (userDetails) => {
        console.log(query);
        console.log(userDetails);

        if (userDetails) {
          // if (!userDetails.isEmailVerified) {
          //     return mapper.responseMapping(401, 'Please verify your account first')
          // }

          let isValidPassword = await appUtils.verifyPassword(
            details,
            userDetails
          );
          //let isValidPassword = true;
          console.log(isValidPassword);

          if (isValidPassword) {
            let token = await jwtHandler.genUsrToken(details);
            console.log(token);
            details.token = token;
            let updateObj = {
              token: token,
            };

            return dao
              .updateProfile(query, updateObj)
              .then((userUpdated) => {
                if (userUpdated) {
                  console.log("success", userUpdated);
                  updateObj.emailId = userUpdated.emailId;
                  updateObj.apiKey = userUpdated.apiKey;
                  return mapper.responseMappingWithData(
                    usrConst.CODE.Success,
                    usrConst.MESSAGE.Success,
                    updateObj
                  );
                } else {
                  console.log("Failed to update ");
                  return mapper.responseMapping(
                    usrConst.CODE.INTRNLSRVR,
                    usrConst.MESSAGE.internalServerError
                  );
                }
              })
              .catch((err) => {
                console.log({ err });
                return mapper.responseMapping(
                  usrConst.CODE.INTRNLSRVR,
                  usrConst.MESSAGE.internalServerError
                );
              });
          } else {
            return mapper.responseMapping(
              405,
              usrConst.MESSAGE.InvalidPassword
            );
          }
        } else {
          return mapper.responseMapping(
            usrConst.CODE.DataNotFound,
            usrConst.MESSAGE.UserNotFound
          );
        }
      })
      .catch((err) => {
        console.log({ err });
        return mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        );
      });
  }
}

function resetPassword(details) {
  console.log("here");
  return validateRequest(details).then(async (response) => {
    if (response == true) {
      if (!details.emailId && !details.password && !details.newPassword) {
        return mapper.responseMapping(
          usrConst.CODE.BadRequest,
          usrConst.MESSAGE.InvalidDetails
        );
      } else {
        let query = {};
        if (details.emailId) {
          query.emailId = details.emailId.toLowerCase();
        }
        // if (details.contactNumber) {

        //     query.contactNumber = details.contactNumber
        // }

        return dao
          .getUserDetails(query)
          .then(async (userDetails) => {
            console.log(query);
            console.log(userDetails);

            if (userDetails) {
              // if (!userDetails.isEmailVerified) {
              //     return mapper.responseMapping(401, 'Please verify your account first')
              // }

              let isValidPassword = await appUtils.verifyPassword(
                details,
                userDetails
              );
              //let isValidPassword = true;
              console.log(isValidPassword);

              if (isValidPassword) {
                let token = await jwtHandler.genUsrToken(details);
                console.log(token);
                details.token = token;
                let convertedPass = await appUtil.convertPass(
                  details.newPassword
                );

                let updateObj = {
                  token: token,
                  password: convertedPass,
                };

                return dao
                  .updateProfile(query, updateObj)
                  .then(async (userUpdated) => {
                    if (userUpdated) {
                      let sandboxUpdate = {
                        emailId: details.emailId,
                        password: convertedPass,
                      };
                      const updated = await resetPasswordSandboxAdmin(
                        sandboxUpdate
                      );
                      console.log("success", userUpdated);
                      updateObj.emailId = userUpdated.emailId;
                      updateObj.newPassword = details.newPassword;
                      return mapper.responseMappingWithData(
                        usrConst.CODE.Success,
                        usrConst.MESSAGE.Success,
                        updateObj
                      );
                    } else {
                      console.log("Failed to update ");
                      return mapper.responseMapping(
                        usrConst.CODE.INTRNLSRVR,
                        usrConst.MESSAGE.internalServerError
                      );
                    }
                  })
                  .catch((err) => {
                    console.log({ err });
                    return mapper.responseMapping(
                      usrConst.CODE.INTRNLSRVR,
                      usrConst.MESSAGE.internalServerError
                    );
                  });
              } else {
                return mapper.responseMapping(
                  405,
                  usrConst.MESSAGE.InvalidPassword
                );
              }
            } else {
              return mapper.responseMapping(
                usrConst.CODE.DataNotFound,
                usrConst.MESSAGE.UserNotFound
              );
            }
          })
          .catch((err) => {
            console.log({ err });
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          });
      }
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return response;
    }
  });
}

async function getAllUserTransactions(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await dao.getAllTransactions(details);
        //console.log(response)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response.transactions
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getAllUserSettlements(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query = {
          emailId: details.email_Id,
        };
        const response = await dao.getAllUserTransactions(query);
        //console.log(response)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response.settlements.reverse()
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}
async function getUserBalance(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query = {
          emailId: details.email_Id,
        };
        const response = await dao.getAllUserTransactions(query);
        // console.log(response)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response.balance
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getAllUsersTransactions(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await userDao.getAllUsersTransactions();
        // console.log(response)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getAllMerchantsData(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await userDao.getAllMerchantsData();

        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getAllTx(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const admin = await fetchPayhubData();
        const totalTransactions = admin.totalTransactions;
        const SuccessfulTransactions = admin.successfulTransactions;
        const successRate =
          (Number(SuccessfulTransactions) / Number(totalTransactions)) * 100;
        const last24hrSuccess = Number(admin.last24hrSuccess);
        const last24hrTotal = Number(admin.last24hrTotal);
        const last24hrSuccessRate =
          (Number(last24hrSuccess) / Number(last24hrTotal)) * 100;

        console.log(totalTransactions, SuccessfulTransactions, successRate);
        let responseData = {
          yesterdayObject: { volume: admin.yesterday },
          todayObject: { volume: admin.last24hr },
          weeklyObject: { volume: admin.balance },
          totalTransactions,
          successfulTransactions: SuccessfulTransactions,
          successRate,
          last24hrSuccess,
          last24hrTotal,
          last24hrSuccessRate: last24hrSuccessRate ? last24hrSuccessRate : 0,
        };
        //console.log('admin data', responseData)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          responseData
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getAllUserTx(details) {
  const response = await userDao.getAllUsersTransactions();
  // console.log(response)
  const allTransactions = [];

  // Iterate through each user and their transactions
  for (const user of response) {
    const successfulTransactions = user.transactions.filter(
      (transaction) => transaction.status === "success"
    );
    allTransactions.push(...successfulTransactions);
  }

  // Now, allTransactions array contains all the transactions from both users
  //console.log(allTransactions);
  const currentDate = new Date().toISOString();

  // Parse the current date to get the year, month, and day
  const currentYear = parseInt(currentDate.slice(0, 4));
  const currentMonth = parseInt(currentDate.slice(5, 7));
  const currentDay = parseInt(currentDate.slice(8, 10));

  // Initialize arrays for yesterday, today, and weekly transactions
  const yesterdayTransactions = [];
  const todayTransactions = [];
  const weeklyTransactions = [];
  function isYesterday(dateString) {
    const transactionDate = moment.tz(dateString, "Asia/Kolkata"); // Convert to Indian Standard Time (IST)
    const yesterday = moment
      .tz("Asia/Kolkata")
      .subtract(1, "days")
      .startOf("day"); // Start of yesterday in IST
    const today = moment.tz("Asia/Kolkata").startOf("day"); // Start of today in IST

    return transactionDate >= yesterday && transactionDate < today; // Compare within the same day
  }

  // Function to check if a date is today
  function isToday(dateString) {
    const transactionDate = moment.tz(dateString, "Asia/Kolkata"); // Convert to Indian Standard Time (IST)
    const today = moment.tz("Asia/Kolkata"); // Get the current time in IST

    return transactionDate.isSame(today, "day");
  }

  // Function to check if a date is within the last 7 days (weekly)
  function isWithinLastWeek(dateString) {
    const date = new Date(dateString);
    const oneWeekAgo = new Date();
    oneWeekAgo.setUTCHours(0, 0, 0, 0);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return date >= oneWeekAgo && date < new Date(); // Compare within the same day
  }
  // Calculate the date one day ago
  const yesterdayDate = new Date(
    currentYear,
    currentMonth - 1,
    currentDay - 1
  ).toISOString();

  // Calculate the date one week ago
  const weeklyStartDate = new Date(
    currentYear,
    currentMonth - 1,
    currentDay - 7
  ).toISOString();

  // Iterate through all transactions
  for (const transaction of allTransactions) {
    const transactionDate = new Date(transaction.transaction_date);

    if (isToday(transactionDate)) {
      todayTransactions.push(transaction);
    }
    if (isYesterday(transactionDate)) {
      yesterdayTransactions.push(transaction);
    }
    // if (isWithinLastWeek(transactionDate)) {
    //     weeklyTransactions.push(transaction);
    // }
  }

  // Now, you have three arrays: yesterdayTransactions, todayTransactions, and weeklyTransactions
  // console.log("Yesterday's Transactions:", yesterdayTransactions);
  // console.log("Today's Transactions:", todayTransactions);
  // console.log("Weekly Transactions:", weeklyTransactions);
  function calculateTotalAmountWithSuccessStatus(transactions) {
    return transactions
      .filter((transaction) => transaction.status === "success") // Filter only successful transactions
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  // Calculate the total amount for yesterday, today, and weekly transactions with 'success' status
  const totalAmountYesterday = calculateTotalAmountWithSuccessStatus(
    yesterdayTransactions
  );
  const totalAmountToday =
    calculateTotalAmountWithSuccessStatus(todayTransactions);
  const totalAmountWeekly =
    calculateTotalAmountWithSuccessStatus(weeklyTransactions);

  // Create objects with the desired structure
  const yesterdayObject = {
    volume: totalAmountYesterday,
    transactions: yesterdayTransactions,
  };
  const todayObject = {
    volume: totalAmountToday,
    transactions: todayTransactions,
  };
  const weeklyObject = {
    volume: totalAmountWeekly,
    transactions: weeklyTransactions,
  };

  console.log("Yesterday's Object:", yesterdayObject);
  console.log("Today's Object:", todayObject);
  console.log("Weekly Object:", weeklyObject);
  // let adminQuery = {
  //     emailId: 'samir123@payhub'
  // }

  // const admin = await dao.getUserDetails(adminQuery)
  // const totalTransactions = admin.totalTransactions
  // const SuccessfulTransactions = admin.successfulTransactions
  // const successRate = (Number(SuccessfulTransactions) / Number(totalTransactions)) * 100
  // const last24hrSuccess = Number(admin.last24hrSuccess)
  // const last24hrTotal = Number(admin.last24hrTotal)
  // const last24hrSuccessRate = (Number(last24hrSuccess) / Number(last24hrTotal)) * 100

  // console.log(totalTransactions, SuccessfulTransactions, successRate)
  let responseData = {
    yesterdayObject,
    todayObject,
  };
  console.log("admin data", responseData);
  return responseData;
}

async function getLast24HourData(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let userQuery = {
          emailId: details.email_Id,
        };

        const user = await dao.getMerchantDetails(userQuery);
        //console.log(user)
        const totalTransactions = user.last24hrTotal;
        const SuccessfulTransactions = user.last24hrSuccess;
        const successRate =
          (Number(SuccessfulTransactions) / Number(totalTransactions)) * 100;
        console.log(totalTransactions, SuccessfulTransactions, successRate);
        let responseData = {
          totalTransactions,
          successfulTransactions: SuccessfulTransactions,
          successRate: successRate ? successRate : 0,
          yesterday: user.yesterday,
          balance: user.balance,
          last24hr: user.last24hr,
        };
        // console.log('admin data', responseData)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          responseData
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getProfileData(details) {
  //console.log(details)
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        if (!details.emailId)
          return mapper.responseMapping(
            usrConst.CODE.BadRequest,
            "Invalid details"
          );
        const { error } = emailSchema.validate(details.emailId);
        if (error) {
          return mapper.responseMapping(
            usrConst.CODE.BadRequest,
            "Invalid email format"
          );
        }

        const sanitizedEmail = details.emailId.replace(/[$.]/g, "");
        const query = {
          emailId: sanitizedEmail,
        };
        const response = await dao.getAllTransactions(query);
        // console.log(response)
        if (response)
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            response
          );
        else
          return mapper.responseMapping(
            usrConst.CODE.BadRequest,
            "Invalid details"
          );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getUserTransactionData(details) {
  return await validateRequest(details).then(async (response) => {
    if (response == true) {
      if (!details.emailId)
        return mapper.responseMapping(
          usrConst.CODE.BadRequest,
          "Invalid details"
        );
      const query = {
        emailId: details.emailId,
      };
      const response = await dao.getAllUserTransactions(query);
      const successfulTransactions = response.transactions.filter(
        (transaction) => transaction.status === "success"
      );
      console.log(successfulTransactions.length);
      function isYesterday(dateString) {
        const transactionDate = moment.tz(dateString, "Asia/Kolkata"); // Convert to Indian Standard Time (IST)
        const yesterday = moment
          .tz("Asia/Kolkata")
          .subtract(1, "days")
          .startOf("day"); // Start of yesterday in IST
        const today = moment.tz("Asia/Kolkata").startOf("day"); // Start of today in IST

        return transactionDate >= yesterday && transactionDate < today; // Compare within the same day
      }

      // Function to check if a date is today
      function isToday(dateString) {
        const transactionDate = moment.tz(dateString, "Asia/Kolkata"); // Convert to Indian Standard Time (IST)
        const today = moment.tz("Asia/Kolkata"); // Get the current time in IST

        return transactionDate.isSame(today, "day");
      }

      // Function to check if a date is within the last 7 days (weekly)
      function isWithinLastWeek(dateString) {
        const date = new Date(dateString);
        const oneWeekAgo = new Date();
        oneWeekAgo.setUTCHours(0, 0, 0, 0);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return date >= oneWeekAgo && date < new Date(); // Compare within the same day
      }
      // Get the current date in the same format as the 'transaction_date'
      const currentDate = new Date().toISOString();

      // Initialize arrays for yesterday, today, and weekly transactions
      const yesterdayTransactions = [];
      const todayTransactions = [];
      const weeklyTransactions = [];

      // Iterate through successful transactions
      for (const transaction of successfulTransactions) {
        const transactionDate = new Date(transaction.transaction_date);

        if (isToday(transactionDate)) {
          todayTransactions.push(transaction);
        }
        if (isYesterday(transactionDate)) {
          yesterdayTransactions.push(transaction);
        }
        if (isWithinLastWeek(transactionDate)) {
          weeklyTransactions.push(transaction);
        }
      }

      // Now, you have three arrays: yesterdayTransactions, todayTransactions, and weeklyTransactions
      //   console.log("Yesterday's Transactions:", yesterdayTransactions);
      //   console.log("Today's Transactions:", todayTransactions);
      //   console.log("Weekly Transactions:", weeklyTransactions);

      function calculateTotalAmount(transactions) {
        return transactions.reduce(
          (total, transaction) => total + transaction.amount,
          0
        );
      }

      // Calculate the total amount for yesterday, today, and weekly transactions
      const totalAmountYesterday = calculateTotalAmount(yesterdayTransactions);
      const totalAmountToday = calculateTotalAmount(todayTransactions);
      const totalAmountWeekly = calculateTotalAmount(weeklyTransactions);

      // Create objects with the desired structure
      const yesterdayObject = {
        volume: totalAmountYesterday,
        transactions: yesterdayTransactions,
      };
      const todayObject = {
        volume: totalAmountToday,
        transactions: todayTransactions,
      };
      const weeklyObject = {
        volume: totalAmountWeekly,
        transactions: weeklyTransactions,
      };

      // Now you have the three objects with the specified structure
      //   console.log("Yesterday's Object:", yesterdayObject);
      //   console.log("Today's Object:", todayObject);
      //   console.log("Weekly Object:", weeklyObject);

      let responseData = {
        yesterdayObject,
        todayObject,
        weeklyObject,
      };
      // console.log(response)
      if (responseData)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          responseData
        );
      else
        return mapper.responseMapping(
          usrConst.CODE.BadRequest,
          "Invalid details"
        );
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return response;
    }
  });
}

async function getAdminBalance(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const admin = await fetchPayhubData()
        // Display the total amount
        console.log("Total Amount from All Transactions:", admin.balance);
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          admin.balance
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getSuccessfulMerchantTransactions(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await userDao.getAllUsersTransactions();
        // console.log(response)
        const allTransactions = [];

        // Iterate through each user and their transactions
        for (const user of response) {
          const successfulTransactions = user.transactions.filter(
            (transaction) => transaction.status === "success"
          );
          allTransactions.push(...successfulTransactions);
        }

        // Now, allTransactions array contains all the transactions from both users
        //console.log(allTransactions);

        // Display the total amount
        console.log("Total Transactions:", allTransactions.length);
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          allTransactions.length
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}
async function settleMoney(details) {
  return await validateRequest(details).then(async (response) => {
    console.log(details);
    // return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, response)
    if (response == true) {
      //console.log(details)
      const timeElapsed = Date.now();
      const today = new Date(timeElapsed);

      const query = {
        emailId: details.email_Id,
      };

      let adminQuery = {
        emailId: details.emailId,
      };
      const admin = await dao.getUserDetails(adminQuery);
      const user = await dao.getUserBalance(query);

      const updateDetails = {
        uuid: String(user?._id),
        amount: details.amount,
        currency: details.currency ? details.currency : "",
        country: details.country ? details.country : "",
        transaction_date: today.toISOString(),
        ref_no: details.ref_no,
        notes: details.notes,
        feeCharged: details?.netFees,
        amountSettled: details?.netVolume, // user.platformFee > 0 ? Number(details.amount) - (Number(details.amount) * (Number(user.platformFee) / 100)) : Number(details.amount)
        usdt: details.netUSDT,
        usdtRate: details?.usdtRate,
        feePercentage: details?.feesPercentage,
        bankFees: details?.bankFees ? details?.bankFees : 0,
        netBankFees: details?.netBankFees ? details?.netBankFees : 0,
        netGst: details?.netGst ? details?.netGst : 0,
        refund: details?.refund ? details?.refund : 0,
        chargeback: details?.chargeback ? details?.chargeback : 0,
        rolling_reserve: details?.rolling_reserve
          ? details?.rolling_reserve
          : 0,
        misc: details?.misc ? details?.misc : 0,
        gst: details?.gst ? details?.gst : 0,
      };
      //(Number(user.platformFee) > 0 ? (Number(details.amount) * (Number(user.platformFee) / 100)) : 0)
      // let checkObj = {
      //     totalAmount: (Number(details.amount) - (Number(details.amount) / Number(user.platformFee)))
      // };
      // console.log(checkObj.totalAmount)
      if (Number(user.balance) < Number(details.amount)) {
        return mapper.responseMappingWithData(
          usrConst.CODE.BadRequest,
          "Low merchant balance",
          "Low merchant balance"
        );
      }
      if (Number(admin.balance) < Number(details.amount)) {
        return mapper.responseMappingWithData(
          usrConst.CODE.BadRequest,
          "Low merchant balance",
          "Low Admin balance"
        );
      }
      // if (Number(checkObj.totalAmount) > Number(user.balance)) {
      //     return mapper.responseMappingWithData(usrConst.CODE.BadRequest, "Low merchant balance", 'Low merchant balance')
      // }
      createSettlements(updateDetails);
      let payhubUpdate = {
        $inc: {
          balance: -Number(details.amount),
        },
      };
      await updatePayhubData(payhubUpdate);
      return dao.updateSettlement(query, updateDetails).then((response) => {
        if (response) {
          // return dao.getUserBalance(query).then((response) => {
          //console.log(response)

          let query = {
            emailId: details.email_Id,
          };
          // const adminProfit =
          //   response.platformFee > 0
          //     ? Number(details.amount) * (Number(response.platformFee) / 100)
          //     : 0;

          // console.log(adminProfit);
          let updateObj = {
            balance: Number(user.balance) - Number(details.amount),

            // + (response.platformFee>0?Number(details.amount) / Number(response.platformFee):Number(0)))
          };
          dao.updateProfile(adminQuery, {
            feeCollected24hr: admin.feeCollected24hr + details?.netFees,
            totalFeeCollected: admin.totalFeeCollected + details?.netFees,
            balance: Number(admin.balance) - Number(details.amount),
            totalSettlementAmount:
              Number(admin.totalSettlementAmount) + Number(details.amount),
          });
          return dao.updateUserProfile(query, updateObj).then((userUpdated) => {
            if (userUpdated) {
              console.log("user updated");
              return mapper.responseMappingWithData(
                usrConst.CODE.Success,
                usrConst.MESSAGE.Success,
                "Settlement Updated"
              );
            } else {
              return mapper.responseMappingWithData(
                usrConst.CODE.INTRNLSRVR,
                usrConst.MESSAGE.internalServerError,
                "Failed to settle user"
              );
            }
          });
          //});
        } else
          return mapper.responseMappingWithData(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError,
            "Failed to settle user"
          );
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return response;
    }
  });
}

async function updateUserProfile(details) {
  if (!details)
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  return await validateRequest(details).then(async (response) => {
    if (response == true) {
      let query = {
        emailId: details.emailId,
      };
      return dao.getUserBalance(query).then((response) => {
        // console.log(response)
        const balance = response.balance;
        console.log(balance);
        let query = {
          emailId: details.emailId,
        };
        let updateObj = {
          balance: Number(details.balance) + Number(balance),
        };
        return dao.updateUserProfile(query, updateObj).then((userUpdated) => {
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userUpdated
          );
        });
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return response;
    }
  });
}

const updateQueue = [];

async function processUpdateQueue() {
  while (updateQueue.length > 0) {
    const updateTask = updateQueue.shift();
    try {
      // Process the update task
      await updateTask();
    } catch (error) {
      // Handle errors if needed
      console.error("Error processing update task:", error);
    }
  }
}

async function enqueueUpdate(updateTask) {
  updateQueue.push(updateTask);

  // Optionally, you can trigger the queue processing immediately or schedule it as needed.
  // Here, we trigger the processing immediately.
  await processUpdateQueue();
}
///payin callbacks
async function saveTx(details) {
  // return validateRequest(details)
  //     .then((response) => {
  if (details) {
    console.log(details);
    const query = {
      transactionId: details.Data.PinWalletTransactionId,
    };
    let updateObj = {
      status: details.Data.TxnStatus.toLowerCase(),
      utr: details.transaction_ref_no,
    };

    let adminQuery = {
      emailId: "samir123@payhub",
    };
    const admin = await dao.getUserDetails(adminQuery);
    if (
      details.Data.PayerAmount &&
      details.Data.TxnStatus.toLowerCase() == "success"
    ) {
      dao.getUserBalance2(query).then((response) => {
        console.log("My balance", response[0].balance);
        const balance = response[0].balance;
        const user24hr = response[0].last24hr;
        const yesterday = response[0].yesterday;

        console.log(balance);

        let updateObj = {
          balance: Number(details.Data.PayerAmount) + Number(balance),
          last24hr: Number(user24hr) + Number(details.Data.PayerAmount),
          utr: details.transaction_ref_no,
          totalTransactions: Number(response[0].totalTransactions) + 1,
          successfulTransactions:
            Number(response[0].successfulTransactions) + 1,
          last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
          last24hrTotal: Number(response[0].last24hrTotal) + 1,
        };
        const admin24hr = admin.last24hr;
        const adminBalance = admin.balance;
        let adminUpdate = {
          last24hr: Number(admin24hr) + Number(details.Data.PayerAmount),
          balance: Number(adminBalance) + Number(details.Data.PayerAmount),
          totalTransactions: Number(admin.totalTransactions) + 1,
          successfulTransactions: Number(admin.successfulTransactions) + 1,
          last24hrSuccess: Number(admin.last24hrSuccess) + 1,
          last24hrTotal: Number(admin.last24hrTotal) + 1,
        };
        dao.updateProfile(adminQuery, adminUpdate);

        dao.updateUserProfile2(query, updateObj);
        callbackPayin(details, response[0].callbackUrl);
      });
      // updateObj.balance = details.PayerAmount
      // let updatedBalance = details.balance
      // updateObj.balance = updatedBalance
      //  dao.updateProfile(query, updateObj)
    } else {
      dao.getUserBalance2(query).then((response) => {
        // console.log('My balance',response[0].balance)
        // const balance = response[0].balance
        // console.log(balance)

        // let updateObj = {
        //     balance: Number(details.Data.PayerAmount) + Number(balance)
        // }
        let adminUpdate = {
          totalTransactions: Number(admin.totalTransactions) + 1,
          last24hrTotal: Number(admin.last24hrTotal) + 1,
        };
        updateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
        (updateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1),
          dao.updateUserProfile2(query, updateObj);
        dao.updateProfile(adminQuery, adminUpdate);
        callbackPayin(details, response[0].callbackUrl);
      });
    }

    return dao
      .updateTransactions(query, details.Data.PinWalletTransactionId, updateObj)
      .then((userUpdated) => {
        if (userUpdated) {
          //console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            "success"
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
  // })
}

async function saveTxBazapay(details) {
  // return validateRequest(details)
  //     .then((response) => {
  if (details) {
    console.log("bazarpay", details);
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
    const admin = await dao.getUserDetails(adminQuery);
    const gatewayData = await adminDao.getGatewayDetails("bazarpay");
    const transaction = await getTransaction(details.transaction_id);
    if (!transaction) {
      callbackPayin(
        details,
        "https://payhubsandbox.onrender.com/admin/savetxbazarpay"
      ).catch((error) => {
        console.log(error);
      });
      return { message: "forwaded to sandbox" };
    }

    if (
      details.amount &&
      details.status.toLowerCase() == "success" &&
      transaction
    ) {
      dao.getUserBalance2(query).then(async (response) => {
        console.log("My balance", response[0].balance);
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
        console.log(response[0].callbackUrl);
        console.log(balance);
        const feeCollected =
          Number(gatewayData.feeCollected24hr) +
          (Number(response[0].platformFee) > 0
            ? Number(details.amount) * (Number(response[0].platformFee) / 100)
            : 0);
        const totalFeeCollected =
          Number(gatewayData.totalFeeCollected) +
          (Number(response[0].platformFee) > 0
            ? Number(details.amount) * (Number(response[0].platformFee) / 100)
            : 0);

        let gatewayUpdate = {
          last24hr: Number(gatewayData.last24hr) + Number(details.amount),
          last24hrSuccess: Number(gatewayData.last24hrSuccess) + 1,
          successfulTransactions:
            Number(gatewayData.successfulTransactions) + 1,
          totalVolume: Number(gatewayData.totalVolume) + Number(details.amount),
          feeCollected24hr: feeCollected,
          totalFeeCollected: totalFeeCollected,
        };

        let updateObj = {
          balance: Number(details.amount) + Number(balance),
          utr: details.transaction_ref_no,
          last24hr: Number(user24hr) + Number(details.amount),
          totalTransactions: Number(response[0].totalTransactions) + 1,
          successfulTransactions:
            Number(response[0].successfulTransactions) + 1,
          last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
          last24hrTotal: Number(response[0].last24hrTotal) + 1,
          todayFee:
            Number(response[0].platformFee) > 0
              ? Number(details.amount) * (Number(response[0].platformFee) / 100)
              : 0,

          // yesterday: Number(yesterday) + Number(details.amount)
        };
        const txData = {
          transaction_id: transaction.transactionId,
          amount: transaction.amount,
          status: details.status,
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          utr: details.transaction_ref_no,
          transaction_date: transaction.transaction_date,
        };
        // console.log('txData',txData)
        // console.log('encKey',response[0].encryptionKey)
        const encryptedData = appUtils.encryptParameters(
          JSON.stringify(txData),
          response[0].encryptionKey
        );
        console.log("encryptedData", encryptedData);
        // const decryptedData = appUtils.decryptParameters(encryptedData,response[0].encryptionKey)
        // console.log('decryptedData',decryptedData)
        let callBackDetails = {
          transaction_id: details.transaction_id,
          status: details.status,
          amount: details.amount,
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          date: transaction.transaction_date,
          utr: details.transaction_ref_no,
          encryptedData: encryptedData,
        };
        console.log(callBackDetails);
        console.log(updateObj);
        console.log(adminUpdate);
        await dao.updateProfile(adminQuery, adminUpdate);
        await dao.updateUserProfile2(query, updateObj);
        await dao.updateGatewayDetails("bazarpay", gatewayUpdate);
        await callbackPayin(callBackDetails, response[0].callbackUrl).catch(
          (e) => console.log(e)
        );
      });
      // updateObj.balance = details.PayerAmount
      // let updatedBalance = details.balance
      // updateObj.balance = updatedBalance
      //  dao.updateProfile(query, updateObj)
    } else {
      dao.getUserBalance2(query).then(async (response) => {
        // console.log('My balance',response[0].balance)
        // const balance = response[0].balance
        // console.log(response[0].callbackUrl)
        // console.log(balance)

        // let updateObj = {
        //     balance: Number(details.amount) + Number(balance)
        // }
        const txData = {
          transaction_id: transaction.transactionId,
          amount: transaction.amount,
          status: details.status,
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          utr: details.transaction_ref_no ? details.transaction_ref_no : "",
          transaction_date: transaction.transaction_date,
        };
        const encryptedData = appUtils.encryptParameters(
          JSON.stringify(txData),
          response[0].encryptionKey
        );
        let callBackDetails = {
          transaction_id: details.transaction_id,
          status: details.status,
          amount: details.amount,
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          utr: details.transaction_ref_no,
          date: transaction.transaction_date,
          encryptedData: encryptedData,
        };
        let adminUpdate = {
          totalTransactions: Number(admin.totalTransactions) + 1,
          last24hrTotal: Number(admin.last24hrTotal) + 1,
        };
        updateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
        updateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1;
        // let callBackDetails = {
        //     transaction_id: details.transaction_id,
        //     status: details.status,
        //     amount: details.amount,
        //     date: details.transaction_date
        // }
        console.log(callBackDetails);
        console.log(updateObj);
        await dao.updateProfile(adminQuery, adminUpdate);
        await dao.updateUserProfile2(query, updateObj);
        await callbackPayin(callBackDetails, response[0].callbackUrl).catch(
          (e) => console.log(e)
        );
      });
    }

    return (
      updateTransactionStatus(details.transaction_id, updateObj)
        // dao
        //   .updateTransactions(query, details.transaction_id, updateObj)
        .then((userUpdated) => {
          if (userUpdated) {
            // console.log('success', userUpdated)

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              "success"
            );
          } else {
            console.log("Failed to update ");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        })
    );
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
  // })
}

async function saveTxIntentpay(details) {
  // return validateRequest(details)
  //     .then((response) => {
  if (details) {
    console.log("intentpay", details);
    const query = {
      transactionId: details.transaction_id,
    };
    let updateObj = {
      status: details.status,
    };
    if (details.amount) {
      dao.getUserBalance2(query).then((response) => {
        console.log("My balance", response[0].balance);
        const balance = response[0].balance;
        console.log(balance);

        let updateObj = {
          balance: Number(details.amount) + Number(balance),
        };
        dao.updateUserProfile2(query, updateObj);
      });
      // updateObj.balance = details.PayerAmount
      // let updatedBalance = details.balance
      // updateObj.balance = updatedBalance
      //  dao.updateProfile(query, updateObj)
    }

    return dao
      .updateTransactions(query, details.transaction_id, updateObj)
      .then((userUpdated) => {
        if (userUpdated) {
          //console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            "success"
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
  // })
}

//latest
async function saveTxPaythrough(details) {
  // return validateRequest(details)
  //     .then((response) => {
  if (details) {
    console.log("paythrough", details);
    const query = {
      transactionId: details.transaction_id,
    };
    let UpdateObj = {
      status: details.status,
      utr: details.invoice_id,
    };
    let adminQuery = {
      emailId: "samir123@payhub",
    };

    const transaction = await getTransaction(details.transaction_id); //dao.getTransactionDetails(details.transaction_id)
    //console.log(transaction);
    if (!transaction) {
      callbackPayin(
        details,
        "https://payhubsandbox.onrender.com/admin/savetxpaythrough"
      ).catch((error) => {
        console.log(error);
      });
      return { message: "forwaded to sandbox" };
    }
    const admin = await dao.getUserDetails(adminQuery);
    const gatewayData = await adminDao.getGatewayDetails("paythrough");

    if (details.total_amount && details.status == "success") {
      dao.getUserBalance2(query).then(async (response) => {
        //console.log("My balance", response);
        const balance = response[0].balance;
        const user24hr = response[0].last24hr;
        const yesterday = response[0].yesterday;
        const admin24hr = admin.last24hr;
        const adminBalance = admin.balance;
        let adminUpdate = {
          last24hr: Number(admin24hr) + Number(details.total_amount),
          balance: Number(adminBalance) + Number(details.total_amount),
          totalTransactions: Number(admin.totalTransactions) + 1,
          successfulTransactions: Number(admin.successfulTransactions) + 1,
          last24hrSuccess: Number(admin.last24hrSuccess) + 1,
          last24hrTotal: Number(admin.last24hrTotal) + 1,
        };
        const feeCollected =
          Number(gatewayData.feeCollected24hr) +
          (Number(response[0].platformFee) > 0
            ? Number(details.total_amount) *
              (Number(response[0].platformFee) / 100)
            : 0);
        const totalFeeCollected =
          Number(gatewayData.totalFeeCollected) +
          (Number(response[0].platformFee) > 0
            ? Number(details.total_amount) *
              (Number(response[0].platformFee) / 100)
            : 0);
        let gatewayUpdate = {
          last24hr: Number(gatewayData.last24hr) + Number(details.total_amount),
          last24hrSuccess: Number(gatewayData.last24hrSuccess) + 1,
          successfulTransactions:
            Number(gatewayData.successfulTransactions) + 1,
          totalVolume:
            Number(gatewayData.totalVolume) + Number(details.total_amount),
          feeCollected24hr: feeCollected,
          totalFeeCollected: totalFeeCollected,
        };
        //console.log(balance);

        let updateObj = {
          balance: Number(details.total_amount) + Number(balance),
          utr: details.invoice_id,
          last24hr: Number(user24hr) + Number(details.total_amount),
          totalTransactions: Number(response[0].totalTransactions) + 1,
          successfulTransactions:
            Number(response[0].successfulTransactions) + 1,
          last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
          last24hrTotal: Number(response[0].last24hrTotal) + 1,
          todayFee:
            Number(response[0].platformFee) > 0
              ? Number(response[0].todayFee) +
                Number(details.total_amount) *
                  (Number(response[0].platformFee) / 100)
              : 0,
        };
        // const apiKey = appUtils.decryptText(response[0].apiKey)
        //console.log('APIkEY',response[0].apiKey)
        const txData = {
          transaction_id: transaction.transactionId,
          amount: transaction.amount,
          status: details.status,
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          utr: details.invoice_id,
          transaction_date: transaction.transaction_date,
        };
        // console.log('txData',txData)
        // console.log('encKey',response[0].encryptionKey)
        const encryptedData = appUtils.encryptParameters(
          JSON.stringify(txData),
          response[0].encryptionKey
        );
        console.log("encryptedData", encryptedData);
        // const decryptedData = appUtils.decryptParameters(encryptedData,response[0].encryptionKey)
        // console.log('decryptedData',decryptedData)
        //let status = String(response[0]._id )=="65b15605decb9496398e7576"
        //console.log('status',status)
        let callBackDetails = {
          transaction_id: details.transaction_id,
          status: details.status,
          amount: details.total_amount,
          date: transaction.transaction_date,
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          utr: details.invoice_id,
          encryptedData: encryptedData,
        };
        // console.log("callback details", callBackDetails);
        // console.log("callback url", response[0].callbackUrl);

        dao.updateProfile(adminQuery, adminUpdate);
        dao.updateUserProfile2(query, updateObj);
        dao.updateGatewayDetails("paythrough", gatewayUpdate);
        callbackPayin(callBackDetails, response[0].callbackUrl).catch(
          (error) => {
            console.log(error);
          }
        );

        //updateTransactionStatus(details.transaction_id, UpdateObj),
        //dao.updateTransactions(query, details.transaction_id, UpdateObj),
      });
      // updateObj.balance = details.PayerAmount
      // let updatedBalance = details.balance
      // updateObj.balance = updatedBalance
      //  dao.updateProfile(query, updateObj)
    } else {
      dao.getUserBalance2(query).then(async (response) => {
        // console.log('My balance',response[0].balance)
        // const balance = response[0].balance
        // console.log(response[0].callbackUrl)
        // console.log(balance)

        // let updateObj = {
        //     balance: Number(details.amount) + Number(balance)
        // }
        const txData = {
          transaction_id: transaction.transactionId,
          amount: transaction.amount,
          status: details.status,
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          utr: details.invoice_id,
          transaction_date: transaction.transaction_date,
        };
        const encryptedData = appUtils.encryptParameters(
          JSON.stringify(txData),
          response[0].encryptionKey
        );
        let callBackDetails = {
          transaction_id: details.transaction_id,
          status: details.status,
          amount: details.total_amount,
          utr: details.invoice_id,
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          date: transaction.transaction_date,
          encryptedData: encryptedData,
        };

        // console.log("callback details", callBackDetails);
        // console.log("callback url", response[0].callbackUrl);

        let adminUpdate = {
          totalTransactions: Number(admin.totalTransactions) + 1,
          last24hrTotal: Number(admin.last24hrTotal) + 1,
        };
        UpdateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
        UpdateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1;

        dao.updateProfile(adminQuery, adminUpdate);
        dao.updateUserProfile2(query, UpdateObj);
        callbackPayin(callBackDetails, response[0].callbackUrl).catch(
          (error) => {
            console.log(error);
          }
        );

        //dao.updateTransactions(query, details.transaction_id, UpdateObj),
      });
    }
    saveCallback(details.transaction_id, "paythrough", details);
    return (
      updateTransactionStatus(details.transaction_id, UpdateObj)
        // dao.updateTransactions(query, details.transaction_id, updateObj)
        .then((userUpdated) => {
          console.log("success", userUpdated);
          if (userUpdated) {
            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              "success"
            );
          } else {
            console.log("Failed to update ");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        })
    );
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
  // })
}

// async function saveTxAirpay(details) {
//   // console.log("Airpay", details);
//   // console.log("type", typeof details.TRANSACTIONID);
//   // return validateRequest(details)
//   //     .then((response) => {
//   if (details) {
//     const query = {
//       transactionId: details.APTRANSACTIONID,
//     };
//     let updateObj = {
//       status: details.TRANSACTIONPAYMENTSTATUS.toLowerCase(),
//       utr: details.RRN,
//     };
//     let adminQuery = {
//       emailId: "samir123@payhub",
//     };
//     const transaction = await getTransaction(details.APTRANSACTIONID);
//     // console.log(transaction)
//     const admin = await dao.getUserDetails(adminQuery);
//     const gatewayData = await adminDao.getGatewayDetails("airpay");
//     console.log(gatewayData);
//     if (details.AMOUNT && details.TRANSACTIONPAYMENTSTATUS == "SUCCESS") {
//       console.log('in here')
//       dao.getUserBalance2(query).then(async (response) => {
//         console.log("My balance", response[0].balance);
//         const balance = response[0].balance;
//         const user24hr = response[0].last24hr;
//         const yesterday = response[0].yesterday;
//         const admin24hr = admin.last24hr;
//         const adminBalance = admin.balance;
//         let adminUpdate = {
//           last24hr: Number(admin24hr) + Number(details.AMOUNT),
//           balance: Number(adminBalance) + Number(details.AMOUNT),
//           totalTransactions: Number(admin.totalTransactions) + 1,
//           successfulTransactions: Number(admin.successfulTransactions) + 1,
//           last24hrSuccess: Number(admin.last24hrSuccess) + 1,
//           last24hrTotal: Number(admin.last24hrTotal) + 1,
//         };
//         const feeCollected =
//           Number(gatewayData.feeCollected24hr) +
//           (Number(response[0].platformFee) > 0
//             ? Number(details.AMOUNT) * (Number(response[0].platformFee) / 100)
//             : 0);
//         const totalFeeCollected =
//           Number(gatewayData.totalFeeCollected) +
//           (Number(response[0].platformFee) > 0
//             ? Number(details.AMOUNT) * (Number(response[0].platformFee) / 100)
//             : 0);
//         console.log(feeCollected, totalFeeCollected);
//         let gatewayUpdate = {
//           last24hr: Number(gatewayData.last24hr) + Number(details.AMOUNT),
//           last24hrSuccess: Number(gatewayData.last24hrSuccess) + 1,
//           successfulTransactions:
//             Number(gatewayData.successfulTransactions) + 1,
//           totalVolume: Number(gatewayData.totalVolume) + Number(details.AMOUNT),
//           feeCollected24hr: feeCollected,
//           totalFeeCollected: totalFeeCollected,
//         };
//         console.log("gateway update", gatewayUpdate);

//         let updateObj = {
//           balance: Number(details.AMOUNT) + Number(balance),
//           utr: details.RRN,
//           last24hr: Number(user24hr) + Number(details.AMOUNT),
//           totalTransactions: Number(response[0].totalTransactions) + 1,
//           successfulTransactions:
//             Number(response[0].successfulTransactions) + 1,
//           last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
//           last24hrTotal: Number(response[0].last24hrTotal) + 1,
//           todayFee:
//             Number(response[0].platformFee) > 0
//               ? Number(response[0].todayFee) +
//                 Number(details.AMOUNT) * (Number(response[0].platformFee) / 100)
//               : 0,
//         };
//         console.log("updateObj", updateObj);
//         const txData = {
//           transaction_id: transaction.transactionId,
//           amount: transaction.amount,
//           status: details.TRANSACTIONPAYMENTSTATUS,
//           phone: transaction.phone,
//           username: transaction.username,
//           upiId: transaction.upiId,
//           utr: details.RRN,
//           transaction_date: transaction.transaction_date,
//         };
//         // console.log('txData',txData)
//         // console.log('encKey',response[0].encryptionKey)
//         const encryptedData = appUtils.encryptParameters(
//           JSON.stringify(txData),
//           response[0].encryptionKey
//         );
//         let callBackDetails = {
//           transaction_id: details.APTRANSACTIONID,
//           status: details.TRANSACTIONPAYMENTSTATUS,
//           amount: details.AMOUNT,
//           utr: details.RRN,
//           phone: transaction.phone,
//           username: transaction.username,
//           upiId: transaction.upiId,
//           date: transaction.transaction_date,
//           encryptedData: encryptedData,
//         };
//         console.log("callback details..", callBackDetails);
//          dao.updateProfile(adminQuery, adminUpdate);
//          dao.updateUserProfile2(query, updateObj);
//          dao.updateGatewayDetails("airpay", gatewayUpdate);

//         callbackPayin(callBackDetails, response[0].callbackUrl).catch(
//           (e) => console.log(e)
//         );

//         // await enqueueUpdateTask(dao.updateProfile, adminQuery, adminUpdate);
//         // await enqueueUpdateTask(dao.updateUserProfile2, query, updateObj);
//         // await enqueueUpdateTask(dao.updateGatewayDetails, 'airpay', gatewayUpdate);
//       });
//       // updateObj.balance = details.PayerAmount
//       // let updatedBalance = details.balance
//       // updateObj.balance = updatedBalance
//       //  dao.updateProfile(query, updateObj)
//     } else {
//       dao.getUserBalance2(query).then(async (response) => {
//         // console.log('My balance',response[0].balance)
//         // const balance = response[0].balance
//         // console.log(response[0].callbackUrl)
//         // console.log(balance)

//         // let updateObj = {
//         //     balance: Number(details.amount) + Number(balance)
//         // }
//         const txData = {
//           transaction_id: transaction.transactionId,
//           amount: transaction.amount,
//           status: "failed", //details.TRANSACTIONPAYMENTSTATUS,
//           phone: transaction.phone,
//           username: transaction.username,
//           upiId: transaction.upiId,
//           utr: details.RRN,
//           transaction_date: transaction.transaction_date,
//         };
//         // console.log('txData',txData)
//         // console.log('encKey',response[0].encryptionKey)
//         const encryptedData = appUtils.encryptParameters(
//           JSON.stringify(txData),
//           response[0].encryptionKey
//         );
//         let callBackDetails = {
//           transaction_id: details.APTRANSACTIONID,
//           status: "failed", //details.TRANSACTIONPAYMENTSTATUS,
//           amount: details.AMOUNT,
//           utr: details.RRN ? details.RRN : "",
//           phone: transaction.phone,
//           username: transaction.username,
//           upiId: transaction.upiId,
//           date: transaction.transaction_date,
//           encryptedData: encryptedData,
//         };

//         //console.log('callback details', callBackDetails)
//         let adminUpdate = {
//           totalTransactions: Number(admin.totalTransactions) + 1,
//           last24hrTotal: Number(admin.last24hrTotal) + 1,
//         };
//         updateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
//         updateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1
//           dao.updateProfile(adminQuery, adminUpdate);

//         dao.updateUserProfile2(query, updateObj);

//          callbackPayin(callBackDetails, response[0].callbackUrl);
//         // await enqueueUpdateTask(dao.updateProfile, adminQuery, adminUpdate);
//         // await enqueueUpdateTask(dao.updateUserProfile2, query, updateObj);
//       });
//     }
//     saveCallback(details.APTRANSACTIONID,'airpay',details)

//     return  updateTransactionStatus(details.APTRANSACTIONID, updateObj)
//     // dao
//     //   .updateTransactions(query, details.APTRANSACTIONID, updateObj)
//       .then((userUpdated) => {
//         if (userUpdated) {
//           //console.log('success', userUpdated)

//           return mapper.responseMappingWithData(
//             usrConst.CODE.Success,
//             usrConst.MESSAGE.Success,
//             "success"
//           );
//         } else {
//           console.log("Failed to update ");
//           return mapper.responseMapping(
//             usrConst.CODE.INTRNLSRVR,
//             usrConst.MESSAGE.internalServerError
//           );
//         }
//       });
//   } else {
//     return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
//   }
//   // })
// }

async function saveTxSwipeline(details) {
  console.log("swipeline", details);
  const decrypted = decryptData(details.data);
  const decryptedData = JSON.parse(decrypted);
  console.log(decryptedData.txnStatus);
  // console.log('type', typeof (details.TRANSACTIONID))
  // return validateRequest(details)
  //     .then((response) => {
  if (details) {
    const query = {
      transactionId: decryptedData.txnId,
    };
    let updateObj = {
      status: decryptedData.txnStatus.toLowerCase(),
      utr: decryptedData.custRefNo,
    };
    let adminQuery = {
      emailId: "samir123@payhub",
    };
    const transaction = await getTransaction(decryptedData.txnId);
    // console.log(transaction)
    const admin = await dao.getUserDetails(adminQuery);
    const gatewayData = await adminDao.getGatewayDetails("swipeline");
    console.log(gatewayData);
    if (decryptedData.amount && decryptedData.txnStatus == "success") {
      dao.getUserBalance2(query).then((response) => {
        console.log("My balance", response[0].balance);
        const balance = response[0].balance;
        const user24hr = response[0].last24hr;
        const yesterday = response[0].yesterday;
        const admin24hr = admin.last24hr;
        const adminBalance = admin.balance;
        let adminUpdate = {
          last24hr: Number(admin24hr) + Number(decryptedData.amount),
          balance: Number(adminBalance) + Number(decryptedData.amount),
          totalTransactions: Number(admin.totalTransactions) + 1,
          successfulTransactions: Number(admin.successfulTransactions) + 1,
          last24hrSuccess: Number(admin.last24hrSuccess) + 1,
          last24hrTotal: Number(admin.last24hrTotal) + 1,
        };
        const feeCollected =
          Number(gatewayData.feeCollected24hr) +
          (Number(response[0].platformFee) > 0
            ? Number(decryptedData.amount) *
              (Number(response[0].platformFee) / 100)
            : 0);
        const totalFeeCollected =
          Number(gatewayData.totalFeeCollected) +
          (Number(response[0].platformFee) > 0
            ? Number(decryptedData.amount) *
              (Number(response[0].platformFee) / 100)
            : 0);
        console.log(feeCollected, totalFeeCollected);
        let gatewayUpdate = {
          last24hr: Number(gatewayData.last24hr) + Number(decryptedData.amount),
          last24hrSuccess: Number(gatewayData.last24hrSuccess) + 1,
          successfulTransactions:
            Number(gatewayData.successfulTransactions) + 1,
          totalVolume:
            Number(gatewayData.totalVolume) + Number(decryptedData.amount),
          feeCollected24hr: feeCollected,
          totalFeeCollected: totalFeeCollected,
        };
        console.log("gateway update", gatewayUpdate);

        let updateObj = {
          balance: Number(decryptedData.amount) + Number(balance),
          utr: decryptedData.custRefNo,
          last24hr: Number(user24hr) + Number(decryptedData.amount),
          totalTransactions: Number(response[0].totalTransactions) + 1,
          successfulTransactions:
            Number(response[0].successfulTransactions) + 1,
          last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
          last24hrTotal: Number(response[0].last24hrTotal) + 1,
          todayFee:
            Number(response[0].platformFee) > 0
              ? Number(response[0].todayFee) +
                Number(decryptedData.amount) *
                  (Number(response[0].platformFee) / 100)
              : 0,
        };
        console.log("updateObj", updateObj);
        const txData = {
          transaction_id: transaction.transactionId,
          amount: transaction.amount,
          status: decryptedData.txnStatus.toLowerCase(),
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          utr: decryptedData.custRefNo,
          transaction_date: transaction.transaction_date,
        };
        // console.log('txData',txData)
        // console.log('encKey',response[0].encryptionKey)
        const encryptedData = appUtils.encryptParameters(
          JSON.stringify(txData),
          response[0].encryptionKey
        );
        let callBackDetails = {
          transaction_id: decryptedData.txnId,
          status: decryptedData.txnStatus,
          amount: decryptedData.amount,
          utr: decryptedData.custRefNo,
          date: transaction.transaction_date,
          encryptedData: encryptedData,
        };
        console.log("callback url", response[0].callbackUrl);
        console.log("callback details", callBackDetails);
        dao.updateProfile(adminQuery, adminUpdate);
        dao.updateUserProfile2(query, updateObj);
        dao.updateGatewayDetails("swipeline", gatewayUpdate);
        callbackPayin(callBackDetails, response[0].callbackUrl).catch(
          (error) => {
            console.log(error);
          }
        );
      });
      // updateObj.balance = details.PayerAmount
      // let updatedBalance = details.balance
      // updateObj.balance = updatedBalance
      //  dao.updateProfile(query, updateObj)
    } else {
      dao.getUserBalance2(query).then((response) => {
        // console.log('My balance',response[0].balance)
        // const balance = response[0].balance
        // console.log(response[0].callbackUrl)
        // console.log(balance)

        // let updateObj = {
        //     balance: Number(details.amount) + Number(balance)
        // }
        const txData = {
          transaction_id: transaction.transactionId,
          amount: transaction.amount,
          status: decryptedData.txnStatus.toLowerCase(),
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          utr: decryptedData.custRefNo,
          transaction_date: transaction.transaction_date,
        };
        // console.log('txData',txData)
        // console.log('encKey',response[0].encryptionKey)
        const encryptedData = appUtils.encryptParameters(
          JSON.stringify(txData),
          response[0].encryptionKey
        );
        let callBackDetails = {
          transaction_id: decryptedData.txnId,
          status: decryptedData.txnStatus,
          amount: decryptedData.amount,
          utr: decryptedData.custRefNo ? decryptedData.custRefNo : "",
          date: transaction.transaction_date,
          encryptedData: encryptedData,
        };

        console.log("callback details", callBackDetails);
        let adminUpdate = {
          totalTransactions: Number(admin.totalTransactions) + 1,
          last24hrTotal: Number(admin.last24hrTotal) + 1,
        };
        updateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
        (updateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1),
          dao.updateProfile(adminQuery, adminUpdate);

        dao.updateUserProfile2(query, updateObj);

        callbackPayin(callBackDetails, response[0].callbackUrl);
      });
    }

    return (
      updateTransactionStatus(decryptedData.txnId, updateObj)
        // dao
        // .updateTransactions(query, decryptedData.txnId, updateObj)
        .then((userUpdated) => {
          if (userUpdated) {
            //console.log('success', userUpdated)

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              "success"
            );
          } else {
            console.log("Failed to update ");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        })
    );
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
  // })
}

async function saveTxPhonepe(details) {
  console.log("phonepe", details);
  const decodedString = Buffer.from(details.response, "base64").toString(
    "utf-8"
  );

  // Parse the JSON data
  const decoded = JSON.parse(decodedString);

  console.log(decoded);
  // const decoded ={
  //     "success": true,
  //     "code": "PAYMENT_SUCCESS",
  //     "message": "Your payment is successful.",
  //     "data": {
  //       "merchantId": "M15N4WTCAKP9",
  //       "merchantTransactionId": "376290099",
  //       "transactionId": "T2311272242489074970293",
  //       "amount": 500,
  //       "status": "COMPLETED",
  //       "responseCode": "SUCCESS",
  //       "paymentInstruction": {
  //         "type": "UPI",
  //         "utr": "333154593144",
  //         "cardNetwork": null,
  //         "authorizationCode": null,
  //         "amount": 500
  //       }
  //     }
  //   }

  if (details) {
    const query = {
      transactionId: decoded.data.merchantTransactionId,
    };
    let updateObj = {
      status: decoded.data.responseCode.toLowerCase(),
      utr: decoded.data.paymentInstrument.utr,
    };
    let adminQuery = {
      emailId: "samir123@payhub",
    };
    const transaction = await getTransaction(
      decoded.data.merchantTransactionId
    );
    // console.log(transaction)
    const admin = await dao.getUserDetails(adminQuery);
    const gatewayData = await adminDao.getGatewayDetails("phonepe");
    const amount = Number(decoded.data.amount / 100);
    console.log(gatewayData);
    if (decoded.data.responseCode.toLowerCase() == "success") {
      dao.getUserBalance2(query).then((response) => {
        console.log("My balance", response[0].balance);
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
          (Number(response[0].platformFee) > 0
            ? Number(amount) * (Number(response[0].platformFee) / 100)
            : 0);
        const totalFeeCollected =
          Number(gatewayData.totalFeeCollected) +
          (Number(response[0].platformFee) > 0
            ? Number(amount) * (Number(response[0].platformFee) / 100)
            : 0);
        console.log(feeCollected, totalFeeCollected);
        let gatewayUpdate = {
          last24hr: Number(gatewayData.last24hr) + Number(amount),
          last24hrSuccess: Number(gatewayData.last24hrSuccess) + 1,
          successfulTransactions:
            Number(gatewayData.successfulTransactions) + 1,
          totalVolume: Number(gatewayData.totalVolume) + Number(amount),
          feeCollected24hr: feeCollected,
          totalFeeCollected: totalFeeCollected,
        };
        console.log("gateway update", gatewayUpdate);

        let updateObj = {
          balance: Number(amount) + Number(balance),
          utr: decoded.data.paymentInstrument.utr,
          last24hr: Number(user24hr) + Number(amount),
          totalTransactions: Number(response[0].totalTransactions) + 1,
          successfulTransactions:
            Number(response[0].successfulTransactions) + 1,
          last24hrSuccess: Number(response[0].last24hrSuccess) + 1,
          last24hrTotal: Number(response[0].last24hrTotal) + 1,
          todayFee:
            Number(response[0].platformFee) > 0
              ? Number(response[0].todayFee) +
                Number(amount) * (Number(response[0].platformFee) / 100)
              : 0,
        };
        console.log("updateObj", updateObj);
        const txData = {
          transaction_id: transaction.transactionId,
          amount: transaction.amount,
          status: decoded.data.responseCode.toLowerCase(),
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          utr: decoded.data.paymentInstrument.utr,
          transaction_date: transaction.transaction_date,
        };
        // console.log('txData',txData)
        // console.log('encKey',response[0].encryptionKey)
        const encryptedData = appUtils.encryptParameters(
          JSON.stringify(txData),
          response[0].encryptionKey
        );
        let callBackDetails = {
          transaction_id: decoded.data.merchantTransactionId,
          status: decoded.data.responseCode.toLowerCase(),
          amount: amount,
          utr: decoded.data.paymentInstrument.utr,
          date: transaction.transaction_date,
          encryptedData: encryptedData,
        };
        console.log("callback details", callBackDetails);
        dao.updateProfile(adminQuery, adminUpdate);
        dao.updateUserProfile2(query, updateObj);
        dao.updateGatewayDetails("phonepe", gatewayUpdate);
        callbackPayin(callBackDetails, response[0].callbackUrl);
      });
      // updateObj.balance = details.PayerAmount
      // let updatedBalance = details.balance
      // updateObj.balance = updatedBalance
      //  dao.updateProfile(query, updateObj)
    } else {
      dao.getUserBalance2(query).then((response) => {
        // console.log('My balance',response[0].balance)
        // const balance = response[0].balance
        // console.log(response[0].callbackUrl)
        // console.log(balance)

        // let updateObj = {
        //     balance: Number(details.amount) + Number(balance)
        // }
        const txData = {
          transaction_id: transaction.transactionId,
          amount: transaction.amount,
          status: decoded.data.responseCode.toLowerCase(),
          phone: transaction.phone,
          username: transaction.username,
          upiId: transaction.upiId,
          utr: decoded.data.paymentInstrument.utr,
          transaction_date: transaction.transaction_date,
        };
        // console.log('txData',txData)
        // console.log('encKey',response[0].encryptionKey)
        const encryptedData = appUtils.encryptParameters(
          JSON.stringify(txData),
          response[0].encryptionKey
        );
        let callBackDetails = {
          transaction_id: decoded.data.merchantTransactionId,
          status: decoded.data.responseCode.toLowerCase(),
          amount: amount,
          utr: decoded.data.paymentInstrument.utr
            ? decoded.data.paymentInstrument.utr
            : "",
          date: transaction.transaction_date,
          encryptedData: encryptedData,
        };

        console.log("callback details", callBackDetails);
        let adminUpdate = {
          totalTransactions: Number(admin.totalTransactions) + 1,
          last24hrTotal: Number(admin.last24hrTotal) + 1,
        };
        updateObj.totalTransactions = Number(response[0].totalTransactions) + 1;
        (updateObj.last24hrTotal = Number(response[0].last24hrTotal) + 1),
          dao.updateProfile(adminQuery, adminUpdate);

        dao.updateUserProfile2(query, updateObj);

        callbackPayin(callBackDetails, response[0].callbackUrl);
      });
    }

    return updateTransactionStatus(
      decoded.data.merchantTransactionId,
      updateObj
    ).then((userUpdated) => {
      if (userUpdated) {
        //console.log('success', userUpdated)

        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          "success"
        );
      } else {
        console.log("Failed to update ");
        return mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        );
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
  // })
}

async function updateGateway(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };
      let updateDetails = {
        gateway: details.gateway,
      };

      return dao.updateUserGateway(query, updateDetails).then((userUpdated) => {
        if (userUpdated) {
          // console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userUpdated
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}
//
async function updatePayoutGateway(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };
      let updateDetails = {
        payoutGateway: details.gateway,
      };

      return dao.updateUserGateway(query, updateDetails).then((userUpdated) => {
        if (userUpdated) {
          // console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userUpdated
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function updateGatewayPremium(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };
      let updateDetails = {
        premiumGateway: details.premiumGateway,
      };

      return dao.updateUserGateway(query, updateDetails).then((userUpdated) => {
        if (userUpdated) {
          //console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userUpdated
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function updatePremium(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };
      let updateDetails = {
        premium: details.premium.toString(),
      };
      console.log(updateDetails);
      return dao.updateUserProfile(query, updateDetails).then((userUpdated) => {
        if (userUpdated) {
          //console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userUpdated
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function updateGatewayData(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
      };
      let updateDetails = {
        gatewayName: details.gatewayName,
        last24hr: 0,
        yesterday: 0,
        totalVolume: 0,
        successfulTransactions: 0,
        last24hrSuccess: 0,
        last24hrTotal: 0,
        totalTransactions: 0,
        platformFee: 0,
        feeCollected24hr: 0,
        totalFeeCollected: 0,
        yesterdayFee: 0,
        yesterdayTransactions: 0,
        collectionFee: 0,
        payoutFee: 0,
        abbr: details.abbr,
      };
      console.log(updateDetails);
      addGateway(updateDetails);
      return dao.updateGatewayData(query, updateDetails).then((userUpdated) => {
        if (userUpdated) {
          // console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userUpdated
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getDataByUtr(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      console.log("i m here");
      const query = {
        emailId: details.email_Id,
      };

      return dao.getUser(query).then((user) => {
        if (user) {
          // console.log('success', user)
          let filteredResponse = [];
          for (let i = 0; i < user.transactions.length; i++) {
            if (user.transactions[i].utr == details.utr) {
              filteredResponse.push(user.transactions[i]);
              break;
            }
          }

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            filteredResponse
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getTransactionsUser(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
        limit: details.limit,
        skip: details.skip,
      };

      return dao.getUserTransactionsData(query).then((user) => {
        if (user) {
          // console.log('success', user.transactions)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            user
          );
        } else {
          console.log("Failed to get data");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getTransactionsByStatus(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
        status: details.status,
        limit: details.limit,
        skip: details.skip,
      };

      return dao.getTransactionsByStatus(query).then((user) => {
        if (user) {
          //console.log('success', user)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            user
          );
        } else {
          console.log("Failed to get data");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getTransactionsByDate(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };

      if (details.email_Id == "all") {
        return transactionDao
          .getTransactionsByDate(
            details.start_date,
            details.end_date,
            details.limit,
            details.skip
          )
          .then((user) => {
            if (user) {
              //console.log('success', user)

              return mapper.responseMappingWithData(
                usrConst.CODE.Success,
                usrConst.MESSAGE.Success,
                user
              );
            } else {
              console.log("Failed to get data");
              return mapper.responseMapping(
                usrConst.CODE.INTRNLSRVR,
                usrConst.MESSAGE.internalServerError
              );
            }
          });
      } else if (details.email_Id == "allwithstatus") {
        return transactionDao
          .getTransactionsByDateAndStatus(
            details.start_date,
            details.end_date,
            details.status,
            details.limit,
            details.skip
          )
          .then((user) => {
            if (user) {
              //console.log('success', user)

              return mapper.responseMappingWithData(
                usrConst.CODE.Success,
                usrConst.MESSAGE.Success,
                user
              );
            } else {
              console.log("Failed to get data");
              return mapper.responseMapping(
                usrConst.CODE.INTRNLSRVR,
                usrConst.MESSAGE.internalServerError
              );
            }
          });
      } else if (details.email_Id == "allstatus") {
        return dao.getAllTransactionWithStatus(details.status).then((user) => {
          if (user) {
            //console.log('success', user)

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              user
            );
          } else {
            console.log("Failed to get data");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        });
      } else if (details.getStatus == true) {
        return dao
          .getTransactionByDateWithStatus(
            query,
            details.start_date,
            details.end_date,
            details.status,
            details.limit,
            details.skip
          )
          .then((user) => {
            if (user) {
              //console.log('success', user)

              return mapper.responseMappingWithData(
                usrConst.CODE.Success,
                usrConst.MESSAGE.Success,
                user
              );
            } else {
              console.log("Failed to get data");
              return mapper.responseMapping(
                usrConst.CODE.INTRNLSRVR,
                usrConst.MESSAGE.internalServerError
              );
            }
          });
      } else {
        return dao
          .getTransactionByDate(
            query,
            details.start_date,
            details.end_date,
            details.limit,
            details.skip
          )
          .then((user) => {
            if (user) {
              //  console.log('success', user)

              return mapper.responseMappingWithData(
                usrConst.CODE.Success,
                usrConst.MESSAGE.Success,
                user
              );
            } else {
              console.log("Failed to get data");
              return mapper.responseMapping(
                usrConst.CODE.INTRNLSRVR,
                usrConst.MESSAGE.internalServerError
              );
            }
          });
      }
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getAllMerchantTransactions(details) {
  try {
    if (details.emailId && details.apiKey) {
      //console.log('here', details)
      const isValidRequest = await validateRequest(details);
      console.log(isValidRequest);
      if (isValidRequest == true) {
        const allTx = await getAllTransactions(details.skip, details.limit);
        // console.log(allTx)
        //const reversed = allTx.reverse()//allTransactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

        //const paginatedTransactions = reversed.slice(startIndex, endIndex);

        // Display the total amount and return the paginated results
        //console.log("Total Transactions paginated:", paginatedTransactions.length);

        // Return the paginated results
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          allTx
        );
      } else {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      }
    } else {
      return mapper.responseMapping(
        usrConst.CODE.BadRequest,
        "Invalid details"
      );
    }
  } catch (error) {
    console.error("Error in getAllMerchantTransactions:", error);
    return mapper.responseMapping(
      usrConst.CODE.InternalServerError,
      "Internal Server Error"
    );
  }
}

async function getAllMerchantsInfo(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await userDao.getAllUsersTransactions();
        const allTransactions = [];

        // Iterate through each user and their transactions
        for (const user of response) {
          const successfulTransactions = {
            business_name: user.business_name,
            email_id: user.emailId,
          };
          //.filter(transaction => transaction.status === 'success');
          allTransactions.push(successfulTransactions);
        }

        // Now, allTransactions array contains all the successful transactions from both users

        // Define pagination details

        // Apply pagination using slice
        // const startIndex = details.skip;
        // const endIndex = startIndex + details.limit;
        // const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

        // Display the total amount and return the paginated results
        console.log("Total Transactions:", allTransactions.length);
        // console.log("Paginated Transactions:", paginatedTransactions);

        // Return the paginated results
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          allTransactions
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getAllMerchantsDetails(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await userDao.getAllMerchantStats();
        // const allTransactions = [];

        // // Iterate through each user and their transactions
        // for (const user of response) {
        //   const successfulTransactions = {
        //     business_name: user.business_name,
        //     email_id: user.emailId,
        //     todayVolume: Number(user.last24hr),
        //     todayTransactions: Number(user.last24hrTotal),
        //     yesterdayVolume: Number(user.yesterday),
        //     yesterdayTransactions: Number(user.yesterdayTransactions),
        //     walletBalance: Number(user.balance),
        //     todayFee: Number(user.todayFee),
        //     yesterdayFee: Number(user.yesterdayFee),
        //   };
        //   //.filter(transaction => transaction.status === 'success');
        //   allTransactions.push(successfulTransactions);
        // }

        // Now, allTransactions array contains all the successful transactions from both users

        // Define pagination details

        // Apply pagination using slice
        // const startIndex = details.skip;
        // const endIndex = startIndex + details.limit;
        // const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

        // Display the total amount and return the paginated results
        // console.log("Total Transactions:", allTransactions.length);
        // console.log("Paginated Transactions:", paginatedTransactions);

        // Return the paginated results
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getMerchantTransactionByUtr(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await getDataById(details.utr);
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response ? [response] : []
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getUserTransactionByUtr(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await adminDao.getAllUserTransactions({
          emailId: details.email_Id,
        });
        //console.log(response)
        const allTransactions = [];

        // Iterate through each user and their transactions

        const successfulTransactions = response.transactions;
        //.filter(transaction => transaction.status === 'success');
        allTransactions.push(...successfulTransactions);

        // Now, allTransactions array contains all the successful transactions from both users

        // Define pagination details
        // const details = {
        //     skip: 0,      // Number of items to skip
        //     limit: 10     // Number of items to display per page
        // };

        // // Apply pagination using slice
        // const startIndex = details.skip;
        // const endIndex = startIndex + details.limit;
        // const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

        // Display the total amount and return the paginated results
        let filteredResponse = [];
        for (let i = 0; i < allTransactions.length; i++) {
          if (
            allTransactions[i].utr == details.utr ||
            allTransactions[i].transactionId == details.utr
          ) {
            filteredResponse.push(allTransactions[i]);
            break;
          }
        }

        console.log("Total Transactions:", filteredResponse.length);
        // console.log("Paginated Transactions:", paginatedTransactions);

        // Return the paginated results
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          filteredResponse
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getGatewayDetails(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await getAllGatewayData();
        // console.log(response)
        let gatewayDetails = [];

        for (let i = 0; i < response.length; i++) {
          let body = {
            gatewayName: response[i].gatewayName,
            last24hr: response[i].last24hr,
            yesterday: response[i].yesterday,
            totalVolume: response[i].totalVolume,
            successfulTransactions: response[i].successfulTransactions,
            last24hrSuccess: response[i].last24hrSuccess,
            last24hrTotal: response[i].last24hrTotal,
            totalTransactions: response[i].totalTransactions,
            platformFee: response[i].platformFee,
            feeCollected24hr: response[i].feeCollected24hr,
            totalFeeCollected: response[i].totalFeeCollected,
            yesterdayFee: response[i].yesterdayFee,
            yesterdayTransactions: response[i].yesterdayTransactions,
            todaysBalance:
              Number(response[i].last24hr) -
              Number(response[i].feeCollected24hr),
          };
          gatewayDetails.push(body);
        }
        // console.log(gatewayDetails)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          gatewayDetails
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getGatewayInfo(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query = {
          emailId: details.emailId,
        };
        const response = await dao.getUserDetails(query);
        console.log(response);
        let gatewayDetails = [];

        for (let i = 0; i < response.gateways.length; i++) {
          let body = {
            gatewayName: response.gateways[i].gatewayName,
            abbr: response.gateways[i].abbr,
            collectionFee: response.gateways[i].collectionFee,
            payoutFee: response.gateways[i].payoutFee,
            switch: response.gateways[i].switch,
          };
          gatewayDetails.push(body);
        }

        //console.log(gatewayDetails)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          gatewayDetails
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function sendPaymentRequest(details) {
  return await validateRequest(details).then(async (response) => {
    console.log(response);
    // return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, response)

    if (response == true) {
      let query = {
        emailId: details.emailId,
      };
      console.log(details);
      return dao.getUserDetails(query).then(async (userData) => {
        const balance = userData.balance;
        console.log("balance", balance);
        if (Number(details.amount)) {
          // let updatedBalance = balance - Number(details.amount)
          // updateObj.balance = updatedBalance
          // dao.updateProfile(query,updateObj)
          let gateway = details.gateway;
          let bankDetails = {
            emailId: `${details.emailId}`,
            apiKey: `${details.apiKey}`,
            phone: `${details.phone}`,
            upi: `${details?.upiId ? details.upiId : ""}`,
            request_type: "withdrawal",
            data: {
              midcode: "30",
              payby: "netbanking",
              currency: "inr",
              country: "in",
              merchant_ref_no: "9833595",
              notification_url: "string",
              hash: "5d3861f153dd1ce126887a0e76d99176a444ab6601e0e0a9d98ba298c5626c5e",
              amount: `${details.amount}`,
              account_holder_name: `${details.accountName}`,
              account_number: `${details.accountNo}`,
              bank_name: `${details.bank}`,
              bank_code: `${details.ifscCode}`,
              bank_branch: "mumbai",
              bank_address: "mumbai",
              info: "string",
              ipaddress: "103.176.136.52",
              phone: "9340079982",
              email: "na@gmail.com",
              address: "",
              account_type: "string",
              document_id: "string",
              document_type: "string",
              custom_field_1: "string",
              custom_field_2: "string",
              custom_field_3: "string",
              custom_field_4: "string",
              custom_field_5: "string",
            },
          };
          if (gateway == "bazarpay") {
            return await bazorPay(bankDetails).then((response) => {
              if (response) {
                if (response.message == "payout requested") {
                  const query = {
                    emailId: details.emailId,
                  };
                  const timeElapsed = Date.now();
                  const today = new Date(timeElapsed);
                  let updateObj = {
                    balance: 0,
                  };

                  const updateDetails = {
                    transactionId: response.data.transaction_id,
                    merchant_ref_no: "123456",
                    amount: details.amount,
                    currency: "inr",
                    country: "in",
                    status: "IN-PROCESS",
                    hash: "XYZZZZ",
                    payout_type: "net banking",
                    message: "IN-PROCESS",
                    transaction_date: today.toISOString(),
                    gateway: gateway,
                  };

                  dao.updateTransaction(query, updateDetails);
                  return mapper.responseMappingWithData(
                    usrConst.CODE.Success,
                    usrConst.MESSAGE.Success,
                    "Payment request submitted"
                  );
                } else {
                  return mapper.responseMappingWithData(
                    usrConst.CODE.BadRequest,
                    usrConst.MESSAGE.InvalidDetails,
                    response
                  );
                }
              } else {
                return mapper.responseMapping(
                  usrConst.CODE.INTRNLSRVR,
                  usrConst.MESSAGE.internalServerError
                );
              }
            });
          }

          if (gateway == "pinwallet") {
            const token = await generatePinWalletToken();
            console.log(token.data.token);
            await pinwalletPayout(token.data.token).then((response) => {
              console.log(response);
            });
            return;
          }
        } else {
          // let updatedBalance = Number(details.amount)
          // updateObj.balance = updatedBalance
          // dao.updateProfile(query,updateObj)
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            usrConst.MESSAGE.TransactionFailure,
            "invalid input"
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return response;
    }
  });
}

async function updateGatewayFee(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };
      let updateDetails = {
        platformFee: details.platformFee,
      };

      return dao.updateUserProfile(query, updateDetails).then((userUpdated) => {
        if (userUpdated) {
          // console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userUpdated
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function updatePlatformFee(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
      };
      let updateDetails = {
        platformFee: details.platformFee,
      };

      return dao.updateProfile(query, updateDetails).then((userUpdated) => {
        if (userUpdated) {
          //console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userUpdated
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function updateProfileData(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };

      let updateDetails = {};
      const keyMapping = {
        updatedEmail: "emailId",
        first_name: "first_name",
        last_name: "last_name",
        business_name: "business_name",
        // add more mappings as needed
      };

      // Iterate through the specified properties
      for (const key in keyMapping) {
        if (details.hasOwnProperty(key) && details[key]) {
          // Use the mapped key from keyMapping
          updateDetails[keyMapping[key]] = details[key];
        }
      }
      console.log(updateDetails);

      return dao.updateUserProfile(query, updateDetails).then((userUpdated) => {
        if (userUpdated) {
          //console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userUpdated
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function updateGatewayFees(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = details.gatewayName;
      let updateDetails = {
        collectionFee: details.collectionFee,
        payoutFee: details.payoutFee,
      };

      return dao.updateGatewayFees(query, updateDetails).then((userUpdated) => {
        if (userUpdated) {
          // console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userUpdated
          );
        } else {
          console.log("Failed to update ");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getAllMerchantsStats(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await userDao.getAllMerchantStats2();
        // const allTransactions = [];

        // // Iterate through each user and their transactions
        // for (const user of response) {
        //   const successfulTransactions = {
        //     merchant_name: user.business_name,
        //     emailId: user.emailId,
        //     todaysVolume: Number(user.last24hr),
        //     todaysTransaction: Number(user.last24hrSuccess),
        //     yesterdaysVolume: Number(user.yesterday),
        //     balance: Number(user.balance),
        //   };
        //   //.filter(transaction => transaction.status === 'success');
        //   allTransactions.push(successfulTransactions);
        // }

        // Now, allTransactions array contains all the successful transactions from both users

        // Define pagination details

        // Apply pagination using slice
        // const startIndex = details.skip;
        // const endIndex = startIndex + details.limit;
        // const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

        // Display the total amount and return the paginated results
        //console.log("Total Transactions:", allTransactions.length);
        // console.log("Paginated Transactions:", paginatedTransactions);

        // Return the paginated results
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getAllPayoutMerchantsStats(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await userDao.getAllPayoutMerchantStats();
        // const allTransactions = [];

        // // Iterate through each user and their transactions
        // for (const user of response) {
        //   const successfulTransactions = {
        //     merchant_name: user.business_name,
        //     emailId: user.emailId,
        //     todaysVolume: Number(user.last24hr),
        //     todaysTransaction: Number(user.last24hrSuccess),
        //     yesterdaysVolume: Number(user.yesterday),
        //     balance: Number(user.balance),
        //   };
        //   //.filter(transaction => transaction.status === 'success');
        //   allTransactions.push(successfulTransactions);
        // }

        // Now, allTransactions array contains all the successful transactions from both users

        // Define pagination details

        // Apply pagination using slice
        // const startIndex = details.skip;
        // const endIndex = startIndex + details.limit;
        // const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

        // Display the total amount and return the paginated results
        //console.log("Total Transactions:", allTransactions.length);
        // console.log("Paginated Transactions:", paginatedTransactions);

        // Return the paginated results
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getMerchantData(details) {
  if (!details.emailId)
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  const query = {
    emailId: details.emailId,
  };
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let userQuery = {
          emailId: details.email_Id,
        };

        const user = await dao.getMerchantDetails(userQuery);
        //console.log(user);
        const totalTransactions = user.last24hrTotal;
        const SuccessfulTransactions = user.last24hrSuccess;
        const successRate =
          (Number(SuccessfulTransactions) / Number(totalTransactions)) * 100;
        console.log(totalTransactions, SuccessfulTransactions, successRate);
        let responseData = {
          // totalTransactions,
          // successfulTransactions: SuccessfulTransactions,
          // successRate: successRate ? successRate : 0,
          yesterday: user.yesterday,
          balance: user.balance,
          last24hr: user.last24hr,
          emailId: user.emailId,
          business_name: user.business_name,
          first_name: user.first_name,
          last_name: user.last_name ? user.last_name : "",
          is_Banned: user.isBanned,
        };
        //console.log('admin data', responseData)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          responseData
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}
async function getUserSettlements(details) {
  if (!details.emailId)
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  const query = {
    emailId: details.emailId,
  };
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        // if (!details.emailId) return mapper.responseMapping(usrConst.CODE.BadRequest, 'Invalid details')
        const query = {
          emailId: details.email_Id,
          limit: details.limit,
          skip: details.skip
        };
        const response = await dao.getUserSettlements(query);
        //console.log(response)
        let allTx = [];
        const settlements = response;
        settlements.map((item, index) => {
          let body = {
            amount: item.amount,
            country: item.country,
            transaction_date: item.transaction_date,
            ref_no: item.ref_no,
            notes: item.notes,
            txIndex: index,
            feeCharged: item.feeCharged ? item.feeCharged : 0,
            amountSettled: item.amountSettled ? item.amountSettled : 0,
            usdt: item.usdt ? item.usdt : 0,
            feePercentage: item?.feePercentage ? item?.feePercentage : 0,
            netFees: item?.netFees ? item?.netFees : 0,
            usdtRate: item?.usdtRate ? item?.usdtRate : 0,
            bankFees: item?.bankFees ? item?.bankFees : 0,
            netBankFees: item?.netBankFees ? item?.netBankFees : 0,
            netGst: item?.netGst ? item?.netGst : 0,
            refund: item?.refund ? item?.refund : 0,
            chargeback: item?.chargeback ? item?.chargeback : 0,
            rolling_reserve: item?.rolling_reserve ? item?.rolling_reserve : 0,
            misc: item?.misc ? item?.misc : 0,
            gst: item?.gst ? item?.gst : 0,
          };
          // body.txIndex = index
          allTx.push(body);
        });
        //console.log(allTx)
        const startIndex = details.skip;
        const endIndex = startIndex + details.limit;
        const reversed = allTx.sort(
          (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
        );
        const paginatedTransactions = reversed.slice(startIndex, endIndex);

        if (response)
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            paginatedTransactions
          );
        else
          return mapper.responseMapping(
            usrConst.CODE.BadRequest,
            "Invalid details"
          );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getMerchantTransactionsByDate(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };

      return dao
        .getTransactionByDate(query, details.start_date, details.end_date)
        .then((user) => {
          if (user) {
            // console.log('success', user)
            const startIndex = details.skip;
            const endIndex = startIndex + details.limit;
            const reversed = user.sort(
              (a, b) =>
                new Date(b.transaction_date) - new Date(a.transaction_date)
            );
            const paginatedTransactions = reversed.slice(startIndex, endIndex);

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              paginatedTransactions
            );
          } else {
            console.log("Failed to get data");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getAllTransactionsByStatus(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao
        .getAllTransactionWithStatus(details.status, details)
        .then((user) => {
          if (user) {
            //console.log('success', user)

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              user
            );
          } else {
            console.log("Failed to get data");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getMerchantLogs(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao
        .getAllTransactionWithSuccessStatus(details.email_Id, details)
        .then((userTransactions) => {
          if (userTransactions) {
            //console.log('success', user)

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              userTransactions
            );
          } else {
            console.log("Failed to get data");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getMerchantTotalSettlementsAndVolume(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao
        .getTotalVolumeAndSettlements(details.email_Id)
        .then((userTransactions) => {
          if (userTransactions) {
            //console.log('success', user)

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              userTransactions
            );
          } else {
            console.log("Failed to get data");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getMerchantTotalPayoutAndTopup(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao
        .getTotalPayoutVolumeAndTopups(details.email_Id)
        .then((userTransactions) => {
          if (userTransactions) {
            //console.log('success', user)

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              userTransactions
            );
          } else {
            console.log("Failed to get data");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getTotalGatewayVolume(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao.getTotalGatewayVolume().then((userTransactions) => {
        if (userTransactions) {
          //console.log('success', user)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userTransactions
          );
        } else {
          console.log("Failed to get data");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function banMerchant(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };
      const updateDetails = {
        isBanned: details.isBanned,
      };
      console.log(details);
      return userDao
        .updateProfile(query, updateDetails)
        .then((userUpdated) => {
          if (userUpdated) {
            console.log("user updated");
            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              userUpdated.isBanned
            );
          } else {
            console.log("Failed to update ");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        })
        .catch((err) => {
          console.log({ err });
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getTotalVolumeCheck(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao.getTotalVolume(details.status).then((userTransactions) => {
        if (userTransactions) {
          //console.log('success', user)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userTransactions
          );
        } else {
          console.log("Failed to get data");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getTotalVolumeMerchantCheck(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao
        .getTotalVolumeMerchant(
          details.start_date,
          details.end_date,
          details.status,
          details.email_Id
        )
        .then((userTransactions) => {
          if (userTransactions) {
            //console.log('success', user)

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              userTransactions
            );
          } else {
            console.log("Failed to get data");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function updateVolumeData(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao.updateVolumeData(details.status).then((userTransactions) => {
        if (userTransactions) {
          //console.log('success', user)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userTransactions
          );
        } else {
          console.log("Failed to get data");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getAllGateways(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao.getAllGateways().then((userGateways) => {
        if (userGateways) {
          //console.log('success', user)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userGateways
          );
        } else {
          console.log("Failed to get data");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getGatewaySettlements(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao.getGatewaySettlementsNew(details).then((userGateways) => {
        if (userGateways) {
          //console.log('success', user)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            userGateways
          );
        } else {
          console.log("Failed to get data");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function updateGatewaySettlements(details) {
  return validateRequest(details).then(async (response) => {
    if (response == true) {
      let query = {
        emailId: details.emailId,
      };
      const gatewayInfo = await dao.getGatewayInfoNew(details.gatewayName);
      if (gatewayInfo.balance < details.amount)
        return mapper.responseMappingWithData(
          usrConst.CODE.BadRequest,
          usrConst.MESSAGE.InvalidDetails,
          "Low Balance"
        );
      const timeElapsed = Date.now();
      const today = new Date(timeElapsed);
      let updateDetails = {
        uuid: String(gatewayInfo.uuid),
        gatewayName: details.gatewayName,
        amount: details.amount,
        ref: details.ref,
        gst: details.gst,
        notes: details.notes,
        netGst: details.netGst ? details.netGst : 0,
        amountSettled: details.netVolume ? details.netVolume : 0,
        feeCharged: details.netPlatformFee ? details.netPlatformFee : 0,
        feePercentage: details.platformFee ? details.platformFee : 0,
        transaction_date: today.toISOString(),
      };
      const balance = gatewayInfo.balance - details.amount;
      const settlements =
        Number(gatewayInfo.settlements) + Number(details.amount);
      const gatewayUpdate = {
        balance,
        settlements,
      };

      await dao.updateGatewaySettlementsAndBalance(
        details.gatewayName,
        gatewayUpdate
      );

      return dao.updateGatewaySettlements(updateDetails).then((user) => {
        if (user) {
          //console.log('success', user)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            user.gatewaySettlements
          );
        } else {
          console.log("Failed to get data");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getAllGatewaysSettlements(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao
        .getAllGatewaysSettlements(details)
        .then((userGatewaySettlements) => {
          if (userGatewaySettlements) {
            //console.log('success', user)

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              userGatewaySettlements
            );
          } else {
            console.log("Failed to get data");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getGatewayVolume(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao.getGatewayVolume(details).then((volume) => {
        if (volume) {
          //console.log('success', user)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            volume
          );
        } else {
          console.log("Failed to get data");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getTotalGatewayVolume(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao.getTotalGatewaysVolume(details).then((volume) => {
        if (volume) {
          //console.log('success', user)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            volume
          );
        } else {
          console.log("Failed to get data");
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function setGatewaySwitch(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao
        .updateGatewaySwitch(details.gatewayName, details)
        .then((updated) => {
          if (updated) {
            //console.log('success', updated)

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              "success"
            );
          } else {
            console.log("Failed to get data");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function verifyPageExpiryToken(details) {
  return jwtHandler
    .verifyPageToken(details.token)
    .then((decoded) => {
      console.log("Token is valid. Decoded payload:", decoded);
      return mapper.responseMapping(usrConst.CODE.Success, decoded);
    })
    .catch((err) => {
      console.error("Token verification failed:", err.message);
      return mapper.responseMapping(usrConst.CODE.BadRequest, err.message);
    });
}

async function getTransactinTime(details) {
  return jwtHandler
    .verifyPageToken(details.token)
    .then(async (decoded) => {
      //console.log("Token is valid. Decoded payload:", decoded);
      //return mapper.responseMapping(usrConst.CODE.Success, decoded);
      if (decoded) {
        const transaction = await getTransaction(details.transactionId);
        if (transaction) {
          const transactionDate = moment(
            transaction.transaction_date
          ).utcOffset("+05:30");
          //console.log("Transaction Date (IST):", transactionDate.format());
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            userConstants.MESSAGE.Success,
            transactionDate.format()
          );
        } else {
          return mapper.responseMapping(
            usrConst.CODE.DataNotFound,
            "Transaction Not Found"
          );
        }
      }
    })
    .catch((err) => {
      console.error("Token verification failed:", err.message);
      return mapper.responseMapping(
        usrConst.CODE.BadRequest,
        "internal server error"
      );
    });
}

async function getTransactinStatus(details) {
  return jwtHandler
    .verifyPageToken(details.token)
    .then(async (decoded) => {
      //console.log("Token is valid. Decoded payload:", decoded);
      //return mapper.responseMapping(usrConst.CODE.Success, decoded);
      if (decoded) {
        const transaction = await getTransaction(details.transactionId);
        if (transaction) {
          const transactionStatus = transaction.status;
          //console.log("Transaction Date (IST):", transactionDate.format());
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            userConstants.MESSAGE.Success,
            transactionStatus
          );
        } else {
          return mapper.responseMapping(
            usrConst.CODE.DataNotFound,
            "Transaction Not Found"
          );
        }
      }
    })
    .catch((err) => {
      console.error("Token verification failed:", err.message);
      return mapper.responseMapping(
        usrConst.CODE.BadRequest,
        "internal server error"
      );
    });
}

async function test() {
  try {
    //const isValidRequest = await validateRequest(details);

    const response = await userDao.getAllUsersTransactions();
    let allTransactions = [];

    for (const user of response) {
      if (!user.business_name || !Array.isArray(user.transactions)) {
        console.log(`Invalid user data: ${JSON.stringify(user)}`);
        continue;
      }

      for (let i = 0; i < user.transactions.length; i++) {
        let transaction = user.transactions[i];

        const body = {
          uuid: user._id,
          transactionId: transaction.transactionId,
          merchant_ref_no: transaction.merchant_ref_no,
          amount: transaction.amount,
          currency: transaction.currency,
          country: transaction.country,
          status: transaction.status,
          hash: transaction.hash,
          payout_type: transaction.payout_type,
          message: transaction.message,
          transaction_date: transaction.transaction_date,
          business_name: user.business_name,
          utr: transaction.utr ? transaction.utr : "",
          gateway: transaction.gateway
            ? transaction.gateway
            : transaction.hash == "xyzAirpay"
            ? "airpay"
            : transaction.hash == "xyzPaythrough"
            ? "paythrough"
            : transaction.hash == "xyzbazorpay"
            ? "bazarpay"
            : transaction.hash == "xyzSwipeline"
            ? "swipeline"
            : "",
        };
        // Log relevant values for debugging

        // Add the 'business_name' property to the transaction

        // Log the modified transaction

        // Add the modified transaction to the allTransactions array
        allTransactions.push(body);
      }
    }
    // Now, allTransactions array contains all the successful transactions from both users

    // const startIndex = details.skip;
    // const endIndex = startIndex + details.limit;
    //const allTx = await getAllTransactions(details.skip, details.limit);
    const reversed = allTransactions.sort(
      (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
    );

    //const paginatedTransactions = reversed.slice(startIndex, endIndex);

    // Display the total amount and return the paginated results
    //console.log("Total Transactions paginated:", paginatedTransactions.length);

    // Return the paginated results
    //console.log(allTransactions)
    reversed.reverse().map((item) => {
      createTransaction(item);
    });
    return mapper.responseMappingWithData(
      usrConst.CODE.Success,
      usrConst.MESSAGE.Success,
      allTransactions
    );
  } catch (error) {
    console.error("Error in getAllMerchantTransactions:", error);
    return mapper.responseMapping(
      usrConst.CODE.InternalServerError,
      "Internal Server Error"
    );
  }
}
async function updatePayoutBalance(details) {
  console.log(details);
  if (!details.emailId || !details.payoutBalance)
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  return validateRequest(details).then(async (response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };
      const user = await userDao.getUserDetails(query);
      const admin = await dao.getUserDetails({
        emailId: details.emailId,
      });
      const adminUpdate = {
        payoutsBalance:
          Number(details.payoutBalance) + Number(admin.payoutsBalance),
      };
      console.log(admin);
      const updateDetails = {
        payoutBalance:
          Number(details.payoutBalance) + Number(user.payoutBalance),
      };
      await dao.updateProfile(
        {
          emailId: details.emailId,
        },
        adminUpdate
      );
      console.log(details);
      return userDao
        .updateProfile(query, updateDetails)
        .then((userUpdated) => {
          if (userUpdated) {
            console.log("user updated");
            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              userUpdated.payoutBalance
            );
          } else {
            console.log("Failed to update ");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        })
        .catch((err) => {
          console.log({ err });
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function resetMerchantPassword(details) {
  if (!details.emailId)
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  return validateRequest(details).then(async (response) => {
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };
      let convertedPass = await appUtil.convertPass(details.newPassword);
      const updateDetails = {
        password: convertedPass,
      };
      return userDao
        .updateProfile(query, updateDetails)
        .then(async (userUpdated) => {
          if (userUpdated) {
            let sandboxUpdate = {
              emailId: details.email_Id,
              password: convertedPass,
            };

            const updated = await resetPasswordSandbox(sandboxUpdate);

            console.log("user updated");
            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              "User Password Updated"
            );
          } else {
            console.log("Failed to update ");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        })
        .catch((err) => {
          console.log({ err });
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function getAllMerchantSettlements() {
  const response = await userDao.getAllUsersTransactions();
  const admin = await adminDao.getUserDetails({
    emailId: "samir123@payhub",
  });
  let totalSettlementAmount = 0;
  for (const user of response) {
    if (!user.business_name || !Array.isArray(user.settlements)) {
      console.log(`Invalid user data: ${JSON.stringify(user)}`);
      continue;
    }

    for (let i = 0; i < user.settlements.length; i++) {
      let amount = user.settlements[i].amount;
      totalSettlementAmount += amount;
    }
  }
  console.log("total settlement", totalSettlementAmount);
}

async function addSales(req, res) {
  try {
    const { email_Id, username = "", password, merchant_id } = req.body;
    // check the sales is already exist
    const isExistUser = await Sales.findOne({ emailId: email_Id });

    if (isExistUser) {
      res.send({
        responseCode: 404,
        responseMessage: "This salesman is already registered.",
      });
    } else {
      if (password.length < 8) {
        return res.send({
          responseCode: 400,
          responseMessage: "Password must be at least 8 characters long",
        });
      }
      let convertedPass = await appUtils.convertPass(password);
      const apiKey = Math.random().toString(36).slice(2);

      const merchantObjectIds = merchant_id.map((id) =>
        mongoose.Types.ObjectId(id)
      );

      // Check if all merchant_ids exist
      const existingMerchants = await User.find({
        _id: { $in: merchantObjectIds },
      });

      if (existingMerchants.length !== merchant_id.length) {
        return res.send({
          responseCode: 404,
          responseMessage: "Not all merchant id exist in the database",
        });
      }
      const salesman = await Sales.create({
        emailId: email_Id,
        password: convertedPass,
        username: username,
        apiKey: apiKey,
        merchants: merchant_id,
      });
      for (let i = 0; i < existingMerchants.length; i++) {
        existingMerchants[i].assignedSales.push(salesman._id);
        await existingMerchants[i].save();
      }

      return res.send({
        responseCode: 200,
        responseMessage: "Success",
        responseData: {
          emailId: salesman.emailId,
          password: password,
          apiKey: salesman.apiKey,
        },
      });
    }
  } catch (err) {
    console.log("Error in AllMerchants", err);
    return res.send({
      responseCode: 500,
      responseMessage: "Your request couldn't be processed,please try again!",
    });
  }
}

function isValidIp(ip) {
  // Basic custom validation for IPv4
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  for (let part of parts) {
    const num = Number(part);
    if (num < 0 || num > 255 || isNaN(num)) {
      return false;
    }
  }
  return true;
}

async function addIp(req, res) {
  try {
    const { email_id = null, ip } = req.body;
    // check the sales is already exist
    let emailId = null;
    if (emailId != null) {
      const isExistUser = await User.findOne({ emailId: email_id });
      if (isExistUser) {
        emailId = email_id;
      } else {
        return res.send({
          responseCode: 404,
          responseMessage: "Merchant not found",
        });
      }
    }
    // Use the custom validation
    if (!ip || !isValidIp(ip)) {
      return res.send({
        responseCode: 400,
        responseMessage: "Invalid IP address format",
      });
    }
    const ipexist = await IpWhitelist.findOne({ ip: ip });
    if (ipexist) {
      return res.send({
        responseCode: 400,
        responseMessage: "Ip already in use",
      });
    }
    let data = {
      ip: ip,
      emailId: email_id,
    };
    const newIpEntry = await IpWhitelist.create(data);
    // Respond with success
    res.status(200).send({
      responseCode: 200,
      responseMessage: "success",
      data: newIpEntry,
    });
  } catch (err) {
    console.log("Error in AllMerchants", err);
    return res.send({
      responseCode: 500,
      responseMessage: "Your request couldn't be processed,please try again!",
    });
  }
}

async function allMerchants(req, res) {
  try {
    // Get all admin profiles from the database
    const selectedFields = ["_id", "emailId", "business_name"];
    const allMerchants = await User.find({}).select(selectedFields);
    return res.send({
      responseCode: 200,
      responseMessage: "SUCCESS",
      responseData: allMerchants,
    });
  } catch (error) {
    console.error("Error in AllMerchants", error.message);
    throw error;
  }
}

async function allSales(req, res) {
  try {
    const allSale = await Sales.find()
      .populate({
        path: "merchants",
        select: "business_name _id", // Specify the fields you want to include for the merchants
      })
      .select("emailId username") // Include additional fields from the Sales model
      .sort({ createdAt: 1 }) // Sort by createdAt field in ascending order
      .exec();

    res.send({
      responseCode: 200,
      responseMessage: "SUCCESS",
      responseData: allSale,
    });
  } catch (error) {
    console.error("Error in AllMerchants", error.message);
    throw error;
  }
}

async function editSales(req, res) {
  try {
    const { merchant_id, email_Id, username } = req.body;
    const salesDetails = await Sales.findOne({ emailId: email_Id });
    if (!salesDetails) {
      res.send({
        responseCode: 404,
        responseMessage: "Sales not found",
      });
    }
    salesDetails.username = username;
    if (salesDetails.merchants.length > merchant_id.length) {
    } else if (salesDetails.merchants.length < merchant_id.length) {
    }
    salesDetails.merchants = merchant_id;
    await salesDetails.save();

    return res.send({
      responseCode: 200,
      responseMessage: "Success",
    });
  } catch (error) {
    console.error("Error in editSales", error.message);
    throw error;
  }
}

async function deleteSales(req, res) {
  try {
    const { email_Id } = req.body;

    const result = await Sales.deleteOne({ emailId: email_Id });
    if (result.deletedCount === 1) {
      return res.send({
        responseCode: 200,
        responseMessage: "Success",
      });
    } else {
      return res.send({
        responseCode: 500,
        responseMessage: "Your request couldn't be processed please try again",
      });
    }
  } catch (error) {
    console.error("Error in editSales", error.message);
    throw error;
  }
}

async function addTopup(req, res) {
  try {
    console.log("coming inside this");
    const {
      email_Id,
      grossAmount,
      netFeesInPercentage,
      netFees,
      usdtRate,
      usdtNet,
      payoutBalance,
      ref,
    } = req.body;
    const selectedFields = [
      "_id",
      "emailId",
      "business_name",
      "payoutBalance",
      "topups",
    ];
    let merchantData = await User.findOne({ emailId: email_Id }).select(
      selectedFields
    );
    if (!merchantData) {
      return res.send({
        responseCode: 500,
        responseMessage: "Merchant not exist, please try again",
      });
    }

    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);
    const data = {
      merchantId: merchantData._id,
      merchantEmailId: merchantData.emailId,
      merchantName: merchantData.business_name,
      grossAmount,
      deductedFees: netFees,
      deductedFeesPercentage: netFeesInPercentage,
      currencyRate: usdtRate,
      currencyNetCharge: usdtNet,
      payoutBalance,
      remark: ref,
      transaction_date: today.toISOString(),
    };

    const topup_transaction = await TopupTransactions.create(data);

    if (!topup_transaction) {
      return res.send({
        responseCode: 500,
        responseMessage: "Your request couldn't be processed please try again",
      });
    }

    merchantData.payoutBalance += payoutBalance;
    merchantData.topups.totalTransactions += parseFloat(grossAmount);
    merchantData.topups.totalNetFees += parseFloat(netFees);
    merchantData.topups.totalActualTopup += parseFloat(payoutBalance);
    merchantData.topups.successfulTransactions += parseFloat(payoutBalance);
    await merchantData.save();

    let admin = await Admin.findOne({
      emailId: req.body.emailId,
      apiKey: req.body.apiKey,
    });
    if (admin) {
      admin.topups.totalTransactions += parseFloat(grossAmount);
      admin.topups.totalNetFees += parseFloat(netFees);
      admin.topups.totalActualTopup += parseFloat(payoutBalance);
      admin.topups.successfulTransactions += parseFloat(payoutBalance);
      await admin.save();
    }

    return res.send({
      responseCode: 200,
      responseMessage: "Success",
    });
  } catch (error) {
    console.error("Error in editSales", error.message);
    throw error;
  }
}

async function getMerchantPayoutAndTopupData(details) {
  if (!details.emailId)
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  const query = {
    emailId: details.emailId,
  };
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let userQuery = {
          emailId: details.email_Id,
        };

        const user = await dao.getMerchantDetails(userQuery);
        console.log(user);
        const totalTransactions = user.last24hrTotal;
        const SuccessfulTransactions = user.last24hrSuccess;
        const successRate =
          (Number(SuccessfulTransactions) / Number(totalTransactions)) * 100;
        console.log(totalTransactions, SuccessfulTransactions, successRate);
        let responseData = {
          // totalTransactions,
          // successfulTransactions: SuccessfulTransactions,
          // successRate: successRate ? successRate : 0,
          yesterday: user?.topups?.yesterday || 0,
          balance: user?.payoutBalance || 0,
          last24hr: user?.topups?.last24hr || 0,
          emailId: user.emailId,
          business_name: user.business_name,
          first_name: user.first_name,
          last_name: user.last_name ? user.last_name : "",
          is_Banned: user.isBanned,
        };
        //console.log('admin data', responseData)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          responseData
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getUserTopups(details) {
  if (!details.emailId)
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  const query = {
    emailId: details.emailId,
  };
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        // if (!details.emailId) return mapper.responseMapping(usrConst.CODE.BadRequest, 'Invalid details')
        const query = {
          merchantEmailId: details.email_Id,
        };

        let merchant_topup_data = await TopupTransactions.aggregate([
          { $match: query }, // Optionally, you can filter the data before projecting
          {
            $project: {
              grossAmount: "$grossAmount",
              FeesPercentage: "$deductedFeesPercentage",
              usdtRate: "$currencyRate",
              remark: "$remark",
              status: "$status",
              payoutBalance: "$payoutBalance",
              netFees: "$deductedFees",
              usdtNet: "$currencyNetCharge",
              transaction_date: { $toDate: "$transaction_date" },
              // Add more fields with new names as needed
            },
          },
          { $sort: { transaction_date: -1 } }, // Sort by transaction_date field in ascending order
          { $skip: details?.skip || 0 }, // Skip the specified number of documents
          { $limit: details?.limit || 10 }, // Limit the result to the specified number of documents
        ]).exec();

        // Pipeline to count total documents
        const countPipeline = [
          { $match: query }, // Match the documents based on the query
          // Optionally, you can add more stages here if needed
          { $count: "totalCount" }, // Count the total number of documents
        ];

        // Execute the aggregation pipeline to count total documents
        const totalCountResult = await TopupTransactions.aggregate(
          countPipeline
        ).exec();
        const totalCount =
          totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

        let txStart = totalCount - details.skip;
        for (let i = 0; i < merchant_topup_data.length; i++) {
          merchant_topup_data[i].txIndex = txStart - i;
        }

        if (response)
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            merchant_topup_data
          );
        else
          return mapper.responseMapping(
            usrConst.CODE.BadRequest,
            "Invalid details"
          );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function activatePayout(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.email_id,
      };
      const updateDetails = {
        payoutsActive: details.isActive,
      };
      //console.log(details)
      return userDao
        .updateProfile(query, updateDetails)
        .then((userUpdated) => {
          if (userUpdated) {
            console.log("user updated");
            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              userUpdated.payoutsActive
            );
          } else {
            console.log("Failed to update ");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        })
        .catch((err) => {
          console.log({ err });
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function setDailyLimit(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      console.log(details);
      const query = {
        emailId: details.email_id,
      };
      const updateDetails = {
        payinLimit: details.payinLimit,
        payoutLimit: details.payoutLimit,
      };
      //console.log(details)
      return userDao
        .updateProfile(query, updateDetails)
        .then((userUpdated) => {
          if (userUpdated) {
            console.log("user updated");
            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              "success"
            );
          } else {
            console.log("Failed to update ");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        })
        .catch((err) => {
          console.log({ err });
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function downloadCsvByDate(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query = {
          startDate: details.start_date,
          endDate: details.end_date,
        };
        const response = await transactionDao.downloadTransactionsCsvByDate(
          query
        );

        //console.log(gatewayDetails)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function downloadCsvByDateAndStatus(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query = {
          startDate: details.start_date,
          endDate: details.end_date,
          status: details.status,
        };
        const response =
          await transactionDao.downloadTransactionsCsvByDateAndStatus(query);

        //console.log(gatewayDetails)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function downloadCsvForAll(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const response = await transactionDao.downloadAllTransactionsCsv();

        //console.log(gatewayDetails)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function downloadCsvForMerchant(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query = {
          emailId: details.email_id,
        };
        const response =
          await transactionDao.downloadAllMerchantTransactionsCsv(query);

        //console.log(gatewayDetails)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function downloadCsvForMerchantByStatus(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query = {
          emailId: details.email_id,
          status: details.status,
        };
        const response =
          await transactionDao.downloadAllMerchantTransactionsByStatusCsv(
            query
          );

        //console.log(gatewayDetails)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function downloadCsvByStatus(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query = {
          status: details.status,
        };
        const response = await transactionDao.downloadAllTransactionsByStatus(
          query
        );

        //console.log(gatewayDetails)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function downloadMerchantCsvByDate(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query = {
          startDate: details.start_date,
          endDate: details.end_date,
          emailId: details.email_id,
        };
        const response =
          await transactionDao.downloadMerchantTransactionsCsvByDate(query);

        //console.log(gatewayDetails)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function downloadMerchantCsvByDateAndStatus(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query = {
          startDate: details.start_date,
          endDate: details.end_date,
          emailId: details.email_id,
          status: details.status,
        };
        const response =
          await transactionDao.downloadMerchantTransactionsCsvByDateAndStatus(
            query
          );

        //console.log(gatewayDetails)
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function downloadSettlementTransactionsByDateWithStatusCsv(details) {
  try {
    if (details.emailId && details.apiKey) {
      return await validateRequest(details).then(async (response) => {
        if (response == true) {
          let query = {
            startDate: details.start_date,
            endDate: details.end_date,
            emailId: details.email_Id,
          };
          const response =
            await transactionDao.downloadSettlementTransactionsByDateWithStatusCsv(
              query
            );

          // if(!response){
          //   return mapper.responseMapping(usrConst.CODE.BadRequest, "Internal server error");
          // }

          //console.log(gatewayDetails)
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            response
          );
        } else if (response == false) {
          return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
        } else {
          return response;
        }
      });
    } else {
      return mapper.responseMapping(
        usrConst.CODE.BadRequest,
        "Invalid details"
      );
    }
  } catch (error) {
    console.log(error);
    return mapper.responseMapping(
      usrConst.CODE.BadRequest,
      "Internal server error"
    );
  }
}

async function downloadGatewaySettlementTransactionsByDateWithStatusCsv(
  details
) {
  try {
    if (details.emailId && details.apiKey) {
      return await validateRequest(details).then(async (response) => {
        if (response == true) {
          let query = {
            startDate: details.start_date,
            endDate: details.end_date,
            gatewayName: details.gatewayName,
          };
          const response =
            await transactionDao.downloadGatewaySettlementTransactionsByDateWithStatusCsv(
              query
            );

          // if(!response){
          //   return mapper.responseMapping(usrConst.CODE.BadRequest, "Internal server error");
          // }

          //console.log(gatewayDetails)
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            response
          );
        } else if (response == false) {
          return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
        } else {
          return response;
        }
      });
    } else {
      return mapper.responseMapping(
        usrConst.CODE.BadRequest,
        "Invalid details"
      );
    }
  } catch (error) {
    console.log(error);
    return mapper.responseMapping(
      usrConst.CODE.BadRequest,
      "Internal server error"
    );
  }
}

// function transactionToCsvRow(transaction) {
//   const formatDateAndTime = (date) => ({
//     formattedTime: new Intl.DateTimeFormat('en-GB', {
//       timeZone: 'Asia/Kolkata',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit'
//     }).format(new Date(date)),

//     formattedDate: new Intl.DateTimeFormat('en-GB', {
//       timeZone: 'Asia/Kolkata',
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric'
//     }).format(new Date(date)),
//   });

//   const { formattedTime, formattedDate } = formatDateAndTime(transaction.transaction_date);
//   // const status = transaction?.status === "IN-PROCESS" ? "pending" : transaction?.status === "fail" ? "failed" : transaction?.status?.toLowerCase();

//   return `${formattedTime},${formattedDate},${transaction.amount || ''},${transaction.currency || ''},${transaction.transaction_date || ''},${transaction.netFees || ''},${transaction.bankFees || ''},${transaction.amount || ''},${transaction.usdtRate || ''},${transaction.usdt || ''},${transaction.ref_no || ''},${transaction.notes || ''},${transaction.netGst || ''},${transaction.gst || ''},${transaction.refund || ''},${transaction.chargeback || ''},${transaction.rolling_reserve || ''},${transaction.misc || ''}\n`;
// }

// async function uploadCsvStreamToS3(readableStream) {
//   const params = {
//     Bucket: process.env.S3_BUCKET_NAME, // Your bucket name
//     Key: `settlements_${Date.now()}.csv`, // File name to save in S3
//     Body: readableStream, // Streaming the CSV data
//     ContentType: 'text/csv',
//   };

//   // Uploading the stream to S3
//   try {
//     const data = await s3.upload(params).promise();
//     console.log(`File uploaded successfully. URL: ${data.Location}`);
//     return data.Location;
//   } catch (err) {
//     console.error('Error uploading to S3:', err);
//     throw new Error('Upload failed');
//   }
// }

// async function downloadSettlementTransactionsByDateWithStatusCsv(query) {
//   try {
//     // Convert startDate and endDate to IST
//     const istStartDate = moment.tz(query.startDate, "Asia/Kolkata").startOf("day").toISOString();
//     const istEndDate = moment.tz(query.endDate, "Asia/Kolkata").endOf("day").toISOString();
//     const userId = await getUserId(query.emailId);
//       if(!userId)
//       {
//         throw 'user not found';
//       }
//     // Create a readable stream from the MongoDB cursor
//     const cursor = Settlement.find({
//       uuid:userId,
//       transaction_date: { $gte: istStartDate, $lte: istEndDate },
//       //status:query.status
//     }).cursor();

//     // PassThrough stream to pipe data directly to S3
//     const passThroughStream = new PassThrough();

//     // CSV header
//     passThroughStream.write("Time,Date,Amount ,Currency ,Tx Date ,Net Fees ,Bank Fees,Net Volume,USDT Rate,USDT Net,Ref,Notes,Net gst,Gst,Refund,Charge back,Rolling reserve,Misc\n");

//     cursor.on('data', (doc) => {
//       // Convert the document to a CSV row and write to the stream
//       passThroughStream.write(transactionToCsvRow(doc));
//     });

//     cursor.on('end', () => {
//       // End the stream when all data has been processed
//       passThroughStream.end();
//     });

//     cursor.on('error', (error) => {
//       console.error("Error while streaming data from MongoDB:", error);
//       throw error;
//     });

//     // Upload the CSV stream to S3 while streaming
//     const response = await uploadCsvStreamToS3(passThroughStream);

//     //console.log(gatewayDetails)
//     return mapper.responseMappingWithData(
//       usrConst.CODE.Success,
//       usrConst.MESSAGE.Success,
//       response
//     ); // Return the URL of the uploaded CSV file

//   } catch (error) {
//     console.error("Error:", error);
//     return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey")
//   }
// }

async function newSettleMoney(details) {
  try {
    const response = await validateRequest(details);
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };
      const merchant = await User.findOne(query);

      if (!merchant) {
        return mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          "Merchant not found"
        );
      }

      let adminQuery = {
        emailId: details.emailId,
      };

      const admin = await Admin.findOne(adminQuery);

      if (!admin) {
        return mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          "Admin not found"
        );
      }
      const timeElapsed = Date.now();
      const today = new Date(timeElapsed);
      if (details.settlementType === "settlement") {
        // const platformFee = details.platformFee ? details.platformFee : 0
        // const gst = details.gst ? details.gst : 0
        // const bankFees = details.bankFee ? details.bankFee : 0
        const amount = details.amount ? details.amount : 0;
        // if (platformFee < 0){
        //   return mapper.responseMapping(
        //     usrConst.CODE.INTRNLSRVR,
        //     "Invalid Platform Fee"
        //   );
        // }
        // if (gst < 0){
        //   return mapper.responseMapping(
        //     usrConst.CODE.INTRNLSRVR,
        //     "Invalid Gst"
        //   );
        // }

        // if (bankFees < 0){
        //   return mapper.responseMapping(
        //     usrConst.CODE.INTRNLSRVR,
        //     "Invalid Bank fees"
        //   );
        // }

        if (amount <= 0) {
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            "Invalid Amount"
          );
        }
        if (Number(merchant.balance) < Number(amount)) {
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            "Low merchant balance",
            "Low merchant balance"
          );
        }
        if (Number(admin.balance) < Number(amount)) {
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            "Low merchant balance",
            "Low Admin balance"
          );
        }

        const updateDetails = {
          uuid: String(merchant?._id),
          amount: details.amount ? details.amount : 0,
          feePercentage: details.feesPercentage ? details.feesPercentage : 0,
          bankFees: details.bankFees ? details?.bankFees : 0,
          usdtRate: details.usdtRate ? details.usdtRate : 0, // done
          gst: details.gst ? details.gst : 0, //done
          feeCharged: details.netFees ? details.netFees : 0,
          amountSettled: details.netVolume ? details.netVolume : 0,
          usdt: details.netUSDT ? details.netUSDT : 0,
          netBankFees: details.netBankFees ? details.netBankFees : 0,
          netGst: details.netGst ? details.netGst : 0,
          ref_no: details.ref_no ? details.ref_no : "",
          transaction_date: today.toISOString(),
          balance: Number(merchant.balance) - Number(details.amount),
          type: "settlement",
        };

        await createSettlements(updateDetails);

        let admin_update_details = {
          feeCollected24hr: admin.feeCollected24hr + details?.netFees,
          totalFeeCollected: admin.totalFeeCollected + details?.netFees,
          balance: Number(admin.balance) - Number(details.amount),
          totalSettlementAmount:
            Number(admin.totalSettlementAmount) + Number(details.amount),
        };

        let update = {};
        update["$set"] = admin_update_details;

        let options = {
          new: true,
        };

        let payhubUpdate = {
          $inc: {
            balance: -Number(details.amount),
          },
        };
        await updatePayhubData(payhubUpdate);
        const admin_updated = await Admin.findOneAndUpdate(
          adminQuery,
          update,
          options
        );

        let user_update_details = {
          balance: Number(merchant.balance) - Number(details.amount),
          // + (response.platformFee>0?Number(details.amount) / Number(response.platformFee):Number(0)))
        };
        let user_update = {};
        user_update["$set"] = user_update_details;
        const user_updated = await User.findOneAndUpdate(
          query,
          user_update,
          options
        );

        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          "Settlement Updated"
        );
      } else if (details.settlementType === "refund") {
        const amount = details.amount ? details.amount : 0;
        if (amount <= 0) {
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            "Invalid Amount"
          );
        }

        if (Number(merchant.balance) < Number(amount)) {
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            "Low merchant balance",
            "Low merchant balance"
          );
        }
        if (Number(admin.balance) < Number(amount)) {
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            "Low merchant balance",
            "Low Admin balance"
          );
        }
        const updateDetails = {
          uuid: String(merchant?._id),
          amount: details.amount ? details.amount : 0,
          feeCharged: details.netFees ? details.netFees : 0,
          feePercentage: details.feesPercentage ? details.feesPercentage : 0,
          amountSettled: details.netVolume ? details.netVolume : 0,
          ref_no: details.ref_no ? details.ref_no : "",
          transaction_date: today.toISOString(),
          balance: Number(merchant.balance) - Number(details.amount),
          type: "refund",
        };

        await createSettlements(updateDetails);

        let admin_update_details = {
          feeCollected24hr: admin.feeCollected24hr + details?.netFees,
          totalFeeCollected: admin.totalFeeCollected + details?.netFees,
          balance: Number(admin.balance) - Number(details.amount),
          totalSettlementAmount:
            Number(admin.totalSettlementAmount) + Number(details.amount),
        };

        let update = {};
        update["$set"] = admin_update_details;

        let options = {
          new: true,
        };

        let payhubUpdate = {
          $inc: {
            balance: -Number(details.amount)
          }
        };
        await updatePayhubData(payhubUpdate)

        const admin_updated = await Admin.findOneAndUpdate(
          adminQuery,
          update,
          options
        );

        let user_update_details = {
          balance: Number(merchant.balance) - Number(details.amount),
          // + (response.platformFee>0?Number(details.amount) / Number(response.platformFee):Number(0)))
        };
        let user_update = {};
        user_update["$set"] = user_update_details;
        const user_updated = await User.findOneAndUpdate(
          query,
          user_update,
          options
        );
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          "Settlement Updated"
        );
      } else if (details.settlementType === "chargeback") {
        const amount = details.amount ? details.amount : 0;

        if (Number(merchant.balance) < Number(amount)) {
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            "Low merchant balance",
            "Low merchant balance"
          );
        }
        if (Number(admin.balance) < Number(amount)) {
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            "Low merchant balance",
            "Low Admin balance"
          );
        }
        const updateDetails = {
          uuid: String(merchant?._id),
          amount: details.amount ? details.amount : 0,
          feeCharged: details.netFees ? details.netFees : 0,
          feePercentage: details.feesPercentage ? details.feesPercentage : 0,
          amountSettled: details.netVolume ? details.netVolume : 0,
          ref_no: details.ref_no ? details.ref_no : "",
          transaction_date: today.toISOString(),
          balance: Number(merchant.balance) - Number(details.amount),
          type: "chargeback",
        };

        await createSettlements(updateDetails);

        let admin_update_details = {
          feeCollected24hr: admin.feeCollected24hr + details?.netFees,
          totalFeeCollected: admin.totalFeeCollected + details?.netFees,
          balance: Number(admin.balance) - Number(details.amount),
          totalSettlementAmount:
            Number(admin.totalSettlementAmount) + Number(details.amount),
        };

        let update = {};
        update["$set"] = admin_update_details;

        let options = {
          new: true,
        };
        let payhubUpdate = {
          $inc: {
            balance: -Number(details.amount)
          }
        };
        await updatePayhubData(payhubUpdate)

        const admin_updated = await Admin.findOneAndUpdate(
          adminQuery,
          update,
          options
        );

        let user_update_details = {
          balance: Number(merchant.balance) - Number(details.amount),
          // + (response.platformFee>0?Number(details.amount) / Number(response.platformFee):Number(0)))
        };
        let user_update = {};
        user_update["$set"] = user_update_details;
        const user_updated = await User.findOneAndUpdate(
          query,
          user_update,
          options
        );
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          "Settlement Updated"
        );
      } else if (details.settlementType === "rolling_reserve") {
        const amount = details.amount ? details.amount : 0;

        if (amount <= 0) {
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            "Invalid Amount"
          );
        }

        if (Number(merchant.balance) < Number(amount)) {
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            "Low merchant balance",
            "Low merchant balance"
          );
        }
        if (Number(admin.balance) < Number(amount)) {
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            "Low merchant balance",
            "Low Admin balance"
          );
        }
        const updateDetails = {
          uuid: String(merchant?._id),
          amount: details.amount ? details.amount : 0,
          feeCharged: 0,
          ref_no: details.ref_no ? details.ref_no : "",
          transaction_date: today.toISOString(),
          type: "rolling_reserve",
          balance: Number(merchant.balance) - Number(details.amount),
        };

        await createSettlements(updateDetails);

        let admin_update_details = {
          balance: Number(admin.balance) - Number(details.amount),
          totalSettlementAmount:
            Number(admin.totalSettlementAmount) + Number(details.amount),
        };

        let update = {};
        update["$set"] = admin_update_details;

        let options = {
          new: true,
        };
        let payhubUpdate = {
          $inc: {
            balance: -Number(details.amount)
          }
        };
        await updatePayhubData(payhubUpdate)

        const admin_updated = await Admin.findOneAndUpdate(
          adminQuery,
          update,
          options
        );

        let user_update_details = {
          balance: Number(merchant.balance) - Number(details.amount),
          // + (response.platformFee>0?Number(details.amount) / Number(response.platformFee):Number(0)))
        };
        let user_update = {};
        user_update["$set"] = user_update_details;
        const user_updated = await User.findOneAndUpdate(
          query,
          user_update,
          options
        );
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          "Settlement Updated"
        );
      } else if (details.settlementType === "misc") {
        const amount = details.amount ? details.amount : 0;
        if (amount <= 0) {
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            "Invalid Amount"
          );
        }

        if (Number(merchant.balance) < Number(amount)) {
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            "Low merchant balance",
            "Low merchant balance"
          );
        }
        if (Number(admin.balance) < Number(amount)) {
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            "Low merchant balance",
            "Low Admin balance"
          );
        }
        const updateDetails = {
          uuid: String(merchant?._id),
          amount: details.amount ? details.amount : 0,
          feeCharged: 0,
          ref_no: details.ref_no ? details.ref_no : "",
          transaction_date: today.toISOString(),
          type: "misc",
          balance: Number(merchant.balance) - Number(details.amount),
        };

        await createSettlements(updateDetails);

        let admin_update_details = {
          balance: Number(admin.balance) - Number(details.amount),
          totalSettlementAmount:
            Number(admin.totalSettlementAmount) + Number(details.amount),
        };

        let update = {};
        update["$set"] = admin_update_details;

        let options = {
          new: true,
        };

        let payhubUpdate = {
          $inc: {
            balance: -Number(details.amount)
          }
        };
        await updatePayhubData(payhubUpdate)

        const admin_updated = await Admin.findOneAndUpdate(
          adminQuery,
          update,
          options
        );
        let user_update_details = {
          balance: Number(merchant.balance) - Number(details.amount),
          // + (response.platformFee>0?Number(details.amount) / Number(response.platformFee):Number(0)))
        };
        let user_update = {};
        user_update["$set"] = user_update_details;
        const user_updated = await User.findOneAndUpdate(
          query,
          user_update,
          options
        );
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          "Settlement Updated"
        );
      }
    } else {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    }
  } catch (error) {
    console.log("Error:", error);
    return mapper.responseMapping(
      usrConst.CODE.INTRNLSRVR,
      "Internal server error"
    );
  }
}




async function getMerchantSettlementByType(details) {
  try {
    const response = await validateRequest(details);
    if (response == true) {
      const query = {
        emailId: details.email_Id,
      };
      const merchant = await User.findOne(query);

      if (!merchant) {
        return mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          "Merchant not found"
        );
      }

     
      const settlementResult = await Settlements.aggregate([
        {
          $match: {
            uuid: String(merchant._id),
            ...(details.type === "settlement"
              ? {
                  $or: [
                    { type: "settlement" },
                    { type: null },
                    { type: "" },
                    { type: { $exists: false } },
                  ],
                }
              : { type: details.type }),
          },
        },
        // Other pipeline stages can go here, like $group, $lookup, etc.
      ]);
      


      let allTx = [];
        const settlements = settlementResult;
        if(details.type == "settlement"){
          settlements.map((item, index) => {
            let body = {
              amount: item.amount,
              feePercentage: item?.feePercentage ? item?.feePercentage : 0,
              bankFees: item?.bankFees ? item?.bankFees : 0,
              usdtRate: item?.usdtRate ? item?.usdtRate : 0,
              gst: item?.gst ? item?.gst : 0,
              netFees: item.feeCharged ? item.feeCharged : 0,
              netVolume: item.amountSettled ? item.amountSettled :item?.netVolume?item?.netVolume: 0,
              usdt: item.usdt ? item.usdt : 0,
              netBankFees: item?.netBankFees ? item?.netBankFees : 0,
              netGst: item?.netGst ? item?.netGst : 0,
              ref_no: item.ref_no ? item.ref_no : "",
              transaction_date: item.transaction_date,
              txIndex: index,
              type: item?.type ? item.type : "settlement",
              balance : item?.balance ? item.balance :merchant?.balance? merchant?.balance: 0
            };
            // body.txIndex = index
            allTx.push(body);
          });
          //console.log(allTx)
          const startIndex = details.skip;
          const endIndex = startIndex + details.limit;
          const reversed = allTx.sort(
            (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
          );
          const paginatedTransactions = reversed.slice(startIndex, endIndex);

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            paginatedTransactions
          );
        }else if(details.type == "refund")
          {
            settlements.map((item, index) => {
              let body = {
                amount: item.amount,
                feePercentage: item?.feePercentage ? item?.feePercentage : 0,
                netFees: item.feeCharged ? item.feeCharged : 0,
                netVolume: item.amountSettled ? item.amountSettled :item?.netVolume?item?.netVolume: 0,
                ref_no: item.ref_no ? item.ref_no : "",
                transaction_date: item.transaction_date,
                txIndex: index,
                type: item?.type ? item.type : "refund",
                balance : item?.balance ? item.balance :merchant?.balance? merchant?.balance: 0
              };
              // body.txIndex = index
              allTx.push(body);
            });
            //console.log(allTx)
            const startIndex = details.skip;
            const endIndex = startIndex + details.limit;
            const reversed = allTx.sort(
              (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
            );
            const paginatedTransactions = reversed.slice(startIndex, endIndex);
  
            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              paginatedTransactions
            );
        }else if(details.type == "chargeback"){
              settlements.map((item, index) => {
                let body = {
                  amount: item.amount,
                  feePercentage: item?.feePercentage ? item?.feePercentage : 0,
                  netFees: item.feeCharged ? item.feeCharged : 0,
                  netVolume: item.amountSettled ? item.amountSettled : item.amount? item.amount: 0,
                  ref_no: item.ref_no ? item.ref_no : "",
                  transaction_date: item.transaction_date,
                  txIndex: index,
                  type: item?.type ? item.type : "chargeback",
                  balance : item?.balance ? item.balance :merchant?.balance? merchant?.balance: 0
                };
                // body.txIndex = index
                allTx.push(body);
              });
              //console.log(allTx)
              const startIndex = details.skip;
              const endIndex = startIndex + details.limit;
              const reversed = allTx.sort(
                (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
              );
              const paginatedTransactions = reversed.slice(startIndex, endIndex);
    
              return mapper.responseMappingWithData(
                usrConst.CODE.Success,
                usrConst.MESSAGE.Success,
                paginatedTransactions
              );
        }else if(details.type == "rolling_reserve"){
          settlements.map((item, index) => {
            let body = {
              amount: item.amount,
              netVolume: item.amountSettled ? item.amountSettled : item.amount? item.amount: 0,
              ref_no: item.ref_no ? item.ref_no : "",
              transaction_date: item.transaction_date,
              txIndex: index,
              type: item?.type ? item.type : "rolling_reserve",
              balance : item?.balance ? item.balance :merchant?.balance? merchant?.balance: 0
            };
            // body.txIndex = index
            allTx.push(body);
          });
          //console.log(allTx)
          const startIndex = details.skip;
          const endIndex = startIndex + details.limit;
          const reversed = allTx.sort(
            (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
          );
          const paginatedTransactions = reversed.slice(startIndex, endIndex);

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            paginatedTransactions
          );
        }else if(details.type == "misc"){
          settlements.map((item, index) => {
            let body = {
              amount: item.amount,
              netVolume: item.amountSettled ? item.amountSettled : item.amount? item.amount: 0,
              ref_no: item.ref_no ? item.ref_no : "",
              transaction_date: item.transaction_date,
              txIndex: index,
              type: item?.type ? item.type : "misc",
              balance : item?.balance ? item.balance :merchant?.balance? merchant?.balance: 0
            };
            // body.txIndex = index
            allTx.push(body);
          });
          //console.log(allTx)
          const startIndex = details.skip;
          const endIndex = startIndex + details.limit;
          const reversed = allTx.sort(
            (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
          );
          const paginatedTransactions = reversed.slice(startIndex, endIndex);

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            paginatedTransactions
          );
        }else{
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            []
          );
        }
       

      
    } else {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    }
  } catch (error) {
    console.log("Error:", error);
    return mapper.responseMapping(
      usrConst.CODE.INTRNLSRVR,
      "Internal server error"
    );
  }
}


module.exports = {
  getMerchantSettlementByType,

  register,

  login,

  resetPassword,

  getAllUserTransactions,

  getAllUsersTransactions,

  getProfileData,

  updateUserProfile,

  saveTx,

  saveTxBazapay,

  saveTxIntentpay,

  updateGateway,

  getAllTx,

  getUserTransactionData,

  getAdminBalance,

  settleMoney,

  getSuccessfulMerchantTransactions,

  saveTxPaythrough,

  getAllMerchantsData,

  updatePremium,

  getAllUserSettlements,

  getUserBalance,

  updateGatewayPremium,

  getDataByUtr,

  getTransactionsUser,

  getTransactionsByStatus,

  getTransactionsByDate,

  getAllMerchantTransactions,

  getMerchantTransactionByUtr,

  getAllMerchantsInfo,

  sendPaymentRequest,

  getLast24HourData,

  updateGatewayFee,

  updatePlatformFee,

  updateGatewayData,

  getGatewayDetails,

  getGatewayInfo,

  updateGatewayFees,

  getAllMerchantsStats,

  getMerchantData,

  getAllUserTx,

  getUserSettlements,

  getMerchantTransactionsByDate,

  getUserTransactionByUtr,

  getAllMerchantsDetails,

  getAllTransactionsByStatus,

  saveTxSwipeline,

  updatePayoutGateway,

  getMerchantLogs,

  getMerchantTotalSettlementsAndVolume,

  banMerchant,

  saveTxPhonepe,

  updateProfileData,

  getTotalGatewayVolume,

  getTotalVolumeCheck,

  getTotalVolumeCheck,

  getTotalVolumeMerchantCheck,

  updateVolumeData,

  getAllGateways,

  updateGatewaySettlements,

  getAllGatewaysSettlements,

  getGatewaySettlements,

  getGatewayVolume,

  getTotalGatewayVolume,

  setGatewaySwitch,

  verifyPageExpiryToken,

  getTransactinTime,

  getTransactinStatus,

  updatePayoutBalance,

  test,

  validateRequest,

  resetMerchantPassword,

  getAllMerchantSettlements,

  addSales,

  allMerchants,

  allSales,

  editSales,

  deleteSales,

  addTopup,

  getMerchantTotalPayoutAndTopup,

  getUserTopups,

  getMerchantPayoutAndTopupData,

  activatePayout,

  getAllPayoutMerchantsStats,

  setDailyLimit,

  downloadCsvByDate,

  downloadCsvForAll,

  downloadCsvForMerchant,

  downloadCsvForMerchantByStatus,

  downloadCsvByStatus,

  downloadCsvByDateAndStatus,

  downloadMerchantCsvByDate,

  downloadMerchantCsvByDateAndStatus,

  downloadSettlementTransactionsByDateWithStatusCsv,

  downloadGatewaySettlementTransactionsByDateWithStatusCsv,

  addIp,

  newSettleMoney,
};
