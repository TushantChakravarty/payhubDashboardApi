/*#################################            Load modules start            ########################################### */
// require('@pancakeswap-libs/sdk')
const dao = require("./userDao");
const adminDao = require("../admin/adminDao");
const usrConst = require("../utils/userConstants");
const mapper = require("../utils/userMapper");
const constants = require("../../constants");
const appUtils = require("../../appUtils");
const jwtHandler = require("../../jwtHandler");
const ObjectId = require("mongoose").Types.ObjectId;
const appUtil = require("../../appUtils");
const mongoose = require("mongoose");
var WebSocket = require("ws");
const conn = mongoose.connection;
const nodemailer = require("nodemailer")
const Email = require("../utils/userEmail");
const Template = require("../utils/emailTemplate");
const moment = require("moment-timezone");
const crypto = require("crypto");
const fs = require("fs");
const fetch = require("cross-fetch");

const User = require("../../generic/models/userModel")
const {Settlements} = require("../../generic/models/settlementsModel")

const Otp = require("../../generic/models/otpModel")
const Joi = require("joi");
const emailSchema = Joi.string()
  .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$|^[^\s@]+@[^\s@]+$/)
  .required();
const TopupTransactions = require("../../generic/models/topupModel");
const transactionDao = require("../utils/transactionDao");
// const market = require('../Market/marketDao')
const {
  processTransactionTest2,
  processPayinRequest,
  processPayinRequestBank,
  bazorPay,
  processPayinRequestBazorpay,
  fetchBazorpayPaymentStatus,
  fetchPayintStatus,
  fetchPayintStatusBz,
} = require("../../gateways/paymentController");
const {
  pinwalletPayin,
  generatePinWalletToken,
  pinwalletPayout,
} = require("../../gateways/pinwallet");
const { intentPayPayin } = require("../../gateways/intentpay");
const {
  generateTokenPaythrough,
  paythroughyPayin,
  paythroughyPayinIntent,
  fetchPaythroughStatus,
} = require("../../gateways/paythrough");
const querystring = require("querystring");
const {
  sendAirpayQrRequest,
  encryptAirpayRequest,
  decryptAirpayResponse,
  check,
  check2,
  airpayPayin,
  processAirpay,
} = require("../../gateways/airpay");
const forge = require("node-forge");
const CryptoJS = require("crypto-js");
const {
  sendSwipelineQrRequest,
  swipeLineUpi,
  sendPayoutRequestSwipelineIMPS,
} = require("../../gateways/swipeline");
const { newPayment, newPaymentQR } = require("../../gateways/phonepe");
const { updateTransactionsData } = require("../utils/transactionDao");
const { createTransaction } = require("../transactionsDao/TransactionDao");
const { addMerchant,addMerchantNew, resetPasswordSandbox } = require("../sandbox/sandbox");
const {
  paytmePayin,
  paytmePaymentQr,
  paytmePaymentPage,
} = require("../../gateways/paytme");
const { cashfreePayin } = require("../../gateways/cashfree");
const { pgBroPayin, pgBroPayinPage } = require("../../gateways/pgbro");
const { generateTokenGlobalpay, getPayinPageGlobalpay } = require("../../gateways/globalPay");
const { generateQrCode } = require("../../gateways/payhub");
const { createUpiIntentRequest, processKwikpaisa, processKwikpaisaPageRequest } = require("../../gateways/kwikpaisaservices");
const { getCachedUserDetails } = require("../utils/redis");
/*#################################            Load modules end            ########################################### */

/**
 * Register user
 * @param {Object} details user details to get registered
 */

async function validateRequest(details) {
  let query = {
    emailId: details.emailId,
  };
  return dao.getUserDetails(query).then(async (userExists) => {
    if (userExists) {
      //console.log(userExists)
      const decryptedKey = appUtils.decryptText(details.apiKey);
      //console.log("validate decrypted key", decryptedKey);
      if (decryptedKey == userExists.apiKey) {
        return true;
      } else {
        return false;
      }
    } else {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "UnAuthorized");

    }
  });
}

async function validateAdminRequest(details) {
  let query = {
    emailId: details.email_Id,
  };
  return adminDao.getUserDetails(query).then(async (userExists) => {
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

async function signUpWithOtp(details){
  try{
    let {businessName,emailId,password,otp,supportApp="whatsapp"} = details

      // Function to validate email format using regex
      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };
  
      // Function to validate password: at least 8 characters, contains uppercase, number, and special character
      const isValidPassword = (password) => {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return password && passwordRegex.test(password);
      };
  
      // Function to validate OTP (assuming it's a 6-digit code)
      const isValidOtp = (otp) => {
        return otp && /^\d{4}$/.test(otp);
      };
  
      // Function to validate supportApp (accepts only "whatsapp", "email", or "sms")
      const isValidSupportApp = (supportApp) => {
        const validApps = ['whatsapp', 'email', 'sms','telegram'];
        return validApps.includes(supportApp);
      };
  
      // Function to validate all fields
      const validateDetails = ({ businessName, emailId, password, otp, supportApp }) => {
        if (!businessName || typeof businessName !== 'string') {
          return { valid: false, message: 'Invalid business name' };
        }
  
        if (!emailId || !isValidEmail(emailId)) {
          return { valid: false, message: 'Invalid email format' };
        }
  
        if (!password || !isValidPassword(password)) {
          return { valid: false, message: 'Password must be at least 8 characters long, contain one uppercase letter, one number, and one special character' };
        }
  
        if (!otp || !isValidOtp(otp)) {
          return { valid: false, message: 'Invalid OTP, it must be a 4-digit number' };
        }
  
        if (!isValidSupportApp(supportApp)) {
          return { valid: false, message: 'Support app must be one of "whatsapp", "email", or "sms"' };
        }
  
        return { valid: true };
      };
  
      // Perform the validation
      const validationResult = validateDetails({ businessName, emailId, password, otp, supportApp });
      if (!validationResult.valid) {
        return mapper.responseMapping(400, validationResult.message);
      }

    // Check if the user already exists
    const userExists = await User.findOne({ emailId: emailId });
    if (userExists) {
      return mapper.responseMapping(500, `User already exists`)
    }

    // Check if the OTP is valid and within the last 5 minutes
    const activeOtp = await Otp.findOne({
      emailId: emailId,
      otp: otp,
      sent_at: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // 5 minutes
    });

    if (!activeOtp) {
      return mapper.responseMapping(500, `Incorrect OTP or your OTP has expired`)
    }

    // Encrypt the password
    const encryptedPassword = await appUtil.convertPass(password);

    // Remove the OTP after successful validation
   

    const apiKey = Math.random().toString(36).slice(2);
                console.log(apiKey);
                const encKey = Math.random().toString(36).slice(2);
                const encrytedKey = appUtils.encryptText(apiKey);

   await addMerchantNew({
      emailId: emailId,
      password: encryptedPassword,
      business_name:businessName,
      encryptionKey:encrytedKey,
      supportApp:supportApp,
      apiKey: apiKey,
      gateway:"airpay",
      balance:0
    })        

    // Create the user
    const user = await User.create({
      emailId: emailId,
      password: encryptedPassword,
      business_name:businessName,
      encryptionKey:encrytedKey,
      supportApp:supportApp,
      apiKey: apiKey,
      balance:0
    });


    await Otp.deleteMany({ emailId: emailId });

    if (user) {
      return mapper.responseMappingWithData(200, "success", "Signup success")
    } else {
      return mapper.responseMapping(500, `Internal server error`)
    }

  }catch(error){
    return mapper.responseMapping(500, `Internal server error`)
  }
}
function register(details) {
  if (!details || Object.keys(details).length == 0) {
    return mapper.responseMapping(
      usrConst.CODE.BadRequest,
      usrConst.MESSAGE.InvalidDetails
    );
  } else {
    return validateAdminRequest(details).then((response) => {
      if (response == true) {
        if (details.emailId) {
          let query = {
            emailId: details.emailId,
          };

          return dao
            .getUserAccount(query)
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
                let email = details.emailId.toLowerCase()
                let convertedPass = await appUtil.convertPass(password);
                details.password = convertedPass;
                details.emailId = email
                const apiKey = Math.random().toString(36).slice(2);
                console.log(apiKey);
                const encKey = Math.random().toString(36).slice(2);
                const encrytedKey = appUtils.encryptText(apiKey);
                console.log("encrypted key", encrytedKey);
                details.apiKey = apiKey;
                details.balance = 0;
                details.encryptionKey = encKey
                addMerchant(details);
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
                        apiKey: encrytedKey,
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
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    });
  }
}

function confirmOtp(details) {
  if (!details) {
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
          if (!userExists) {
            return mapper.responseMapping(
              usrConst.CODE.BadRequest,
              "user does not exist"
            );
          } else {
            console.log(userExists);
            if (userExists.OTP == details.otp) {
              let updateObj = {
                isEmailVerified: true,
              };

              return dao.updateProfile(query, updateObj).then((userUpdated) => {
                if (userUpdated) {
                  // let usrObj = {
                  //     _id: userUpdated._id,
                  //     emailId: userUpdated.emailId,
                  //     contactNumber: userUpdated.contactNumber
                  // }
                  // return jwtHandler.genUsrToken(usrObj).then((token) => {
                  console.log("success");
                  return mapper.responseMapping(
                    usrConst.CODE.Success,
                    usrConst.MESSAGE.Success
                  );
                } else {
                  console.log("error");
                  return mapper.responseMapping(
                    usrConst.CODE.INTRNLSRVR,
                    "server error"
                  );
                }
              });
            } else {
              console.log("invalid otp");
              return mapper.responseMapping(
                usrConst.CODE.InvalidOtp,
                "invalid OTP"
              );
            }
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
        //console.log(userDetails)

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
                  //console.log('success', userUpdated)
                  updateObj.emailId = userUpdated.emailId;
                  const apiKey = appUtils.encryptText(userUpdated.apiKey);
                  updateObj.apiKey = apiKey;
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
  return validateRequest(details).then((response) => {
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
            //console.log(userDetails)
    
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
                let convertedPass = await appUtil.convertPass(details.newPassword);
    
                let updateObj = {
                  token: token,
                  password: convertedPass,
                };
               
                return dao
                  .updateProfile(query, updateObj)
                  .then(async (userUpdated) => {
                    if (userUpdated) {
                      let sandboxUpdate ={
                        emailId:details.emailId,
                        password:convertedPass
                      }
                      const updated = await resetPasswordSandbox(sandboxUpdate)
          
                      //console.log('success', userUpdated)
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
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
  
}

/**
 * Forgot password
 * @param {String} emailId email id of user to send password recovery link
 */
function forgotPassword(emailId) {
  if (!emailId) {
    return mapper.responseMapping(
      usrConst.CODE.BadRequest,
      usrConst.MESSAGE.InvalidDetails
    );
  } else {
    let query = {
      emailId: emailId,
    };
    return dao
      .getUserDetails(query)
      .then(async (isExist) => {
        if (isExist) {
          console.log(isExist._id);
          const EmailTemplate = Template.forgotPassword(isExist._id);
          //console.log(isExist.emailId)
          let mailSent = Email.sendMessage2(isExist.emailId, EmailTemplate);
          console.log(mailSent);
          //mailHandler.SEND_MAIL(usrObj, templateDetails, serviceDetails)

          return mapper.responseMapping(
            usrConst.CODE.Success,
            usrConst.MESSAGE.ResetPasswordMailSent
          );
        } else {
          return mapper.responseMapping(
            usrConst.CODE.DataNotFound,
            usrConst.MESSAGE.InvalidCredentials
          );
        }
      })
      .catch((e) => {
        console.log({ e });
        return mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.internalServerError
        );
      });
  }
}

/**
 * Set new password
 * @param {string} redisId redis id for recovering password
 * @param {string} password new password to set
 */
async function setNewPassword(redisId, password) {
  if (!redisId || !password) {
    return mapper.responseMapping(
      usrConst.CODE.BadRequest,
      usrConst.MESSAGE.InvalidDetails
    );
  } else {
    console.log(redisId);
    let query = {
      _id: redisId,
    };

    // let isUserExists = await dao.getUserDetails(query)
    let isUserExists = await dao.getUserDetails(query);
    console.log(isUserExists);
    //redisServer.getRedisDetails(redisId)

    if (isUserExists) {
      let newPass = await appUtils.convertPass(password);

      let query = {
        _id: redisId,
      };
      let updateObj = {
        password: newPass,
      };
      return dao
        .updateProfile(query, updateObj)
        .then(async (updateDone) => {
          if (updateDone) {
            //await dao.getServiceDetails(thirdPartyServiceQuery)
            let mailConfig = Email.sendMessage(isUserExists.emailId);
            console.log(mailConfig);
            //mailHandler.SEND_MAIL(mailBodyDetails, templateDetails, serviceDetails)

            return mapper.responseMapping(
              usrConst.CODE.Success,
              usrConst.MESSAGE.PasswordUpdateSuccess
            );
          } else {
            console.log("Failed to reset password");
            return mapper.responseMapping(
              usrConst.CODE.INTRNLSRVR,
              usrConst.MESSAGE.internalServerError
            );
          }
        })
        .catch((e) => {
          console.log({ e });
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
        });
    } else {
      return mapper.responseMapping(
        usrConst.CODE.DataNotFound,
        usrConst.MESSAGE.ResetPasswordLinkExpired
      );
    }
  }
}

async function updateProfile(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
      };

      return dao.updateProfile(query, details).then((userUpdated) => {
        if (userUpdated) {
          // console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            "updated"
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

async function updateDeveloperUrls(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      
      if(!details.callbackUrl&&!details.redirectUrl&&!details.payoutCallbackUrl)
      {
        return mapper.responseMapping(
          usrConst.CODE.BadRequest,
          usrConst.MESSAGE.InvalidDetails
        );
      }
      const query = {
        emailId: details.emailId,
      };


      return dao.updateProfileDetails(query, details).then((userUpdated) => {
        if (userUpdated) {
          // console.log('success', userUpdated)

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            "updated"
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

async function updateCallbackUrl(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
      };
      let updateDetails = {
        callbackUrl: details.callbackUrl,
      };

      return dao.updateProfile(query, updateDetails).then((userUpdated) => {
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
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}

async function updateRedirectUrl(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
      };
      let updateDetails = {
        redirectUrl: details.redirectUrl,
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

async function updateTransaction(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
      };
      let updateObj = {
        status: details.status,
      };
      // if(details.balance&&details.balance!=null)
      // {
      //     let updateObj={}
      //     updateObj.balance = details.balance
      //     // let updatedBalance = details.balance
      //     // updateObj.balance = updatedBalance
      //      dao.updateProfile(query, updateObj)
      // }
      console.log(details);

      return dao
        .updateTransactionData(query, details.transactionId, updateObj)
        .then((userUpdated) => {
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

///payouts
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
        const balance = userData.payoutBalance;
        console.log("balance", balance);
        if (Number(balance) > Number(details.amount)) {
          // let updatedBalance = balance - Number(details.amount)
          // updateObj.balance = updatedBalance
          // dao.updateProfile(query,updateObj)
          let gateway = userData.payoutGateway;

          if (gateway == "bazorpay") {
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
                  // dao.getUserDetails(query).then((userData) => {
                  //     const balance = userData.balance
                  //     console.log('balance', balance)
                  //     if (balance && balance > details.amount) {
                  //         let updatedBalance = balance - Number(details.amount)
                  //         updateObj.balance = updatedBalance
                  //         dao.updateProfile(query, updateObj)
                  //     }
                  //     // else{
                  //     //     // let updatedBalance = Number(details.amount)
                  //     //     // updateObj.balance = updatedBalance
                  //     //     // dao.updateProfile(query,updateObj)
                  //     //     return mapper.responseMappingWithData(usrConst.CODE.BadRequest, usrConst.MESSAGE.TransactionFailure, 'Low Balance')

                  //     // }
                  // })
                  //dao.updateTransaction(query, updateDetails);
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
          } else if (gateway == "swipeline") {
            const details = {
              beneficiaryDetails: {
                emailAddress: "abc@gmail.com",
                mobileNumber: "9340079982",
                ifscCode: "SBIN0007258",
                payeeName: "Tushant",
              },
              referenceId: "9899798",
              purposeMessage: "Test",
              toAccount: "20323508372",
              toUpi: "",
              transferType: "IMPS",
              transferAmount: "5",
              apikey: "swipe_prod_AFTRE77ap52IRtaQnWijXFqrS2OYU",
              secrete: "secret_swipe_prodytreyjkwaaBAVeeNDsJKL2",
            };
            const response = await sendPayoutRequestSwipelineIMPS(details);
            // {
            //     "status": "success",
            //     "txnId": "9F2B0C4FA73E4E5D99E3DF6FAC310933",
            //     "transferType": "IMPS",
            //     "bankReferenceNumber": "331422861398",
            //     "beneficiaryName": "Mr. TUSHANT  CHAKRABORTY",
            //     "responseCode": "S00000",
            //     "newBalance": 513447
            // }
            // console.log(response)
            return response;
          } else if (gateway == "pinwallet") {
            const response = await pinwalletPayout(details);
            // {
            //     "status": "success",
            //     "txnId": "9F2B0C4FA73E4E5D99E3DF6FAC310933",
            //     "transferType": "IMPS",
            //     "bankReferenceNumber": "331422861398",
            //     "beneficiaryName": "Mr. TUSHANT  CHAKRABORTY",
            //     "responseCode": "S00000",
            //     "newBalance": 513447
            // }
            // console.log(response)
            if (response) {
              return mapper.responseMappingWithData(
                usrConst.CODE.Success,
                usrConst.MESSAGE.Success,
                "Payment request submitted"
              );
            } else {
              return mapper.responseMappingWithData(
                usrConst.CODE.INTRNLSRVR,
                usrConst.MESSAGE.TransactionFailure,
                "Unable to process transaction at the moment"
              );
            }
          } else {
            return mapper.responseMappingWithData(
              usrConst.CODE.BadRequest,
              usrConst.MESSAGE.TransactionFailure,
              usrConst.MESSAGE.internalServerError
            );
          }
        } else {
          // let updatedBalance = Number(details.amount)
          // updateObj.balance = updatedBalance
          // dao.updateProfile(query,updateObj)
          return mapper.responseMappingWithData(
            usrConst.CODE.BadRequest,
            usrConst.MESSAGE.TransactionFailure,
            "Low Balance"
          );
        }
      });
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return response;
    }
  });
  //    const response = await processTransactionTest2(details)
  //    return response
}
///payin requests


async function sendPayinRequest(details) {
  // return mapper.responseMappingWithData(usrConst.CODE.BadRequest, usrConst.MESSAGE.TransactionFailure, 'under maintainance')
  try {
    // Validate the request
    const isValid = await validateRequest(details);
    if (!isValid) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    }
    if (isValid == true) {
      if(details.emailId!=='test@payhub')
      {
        return mapper.responseMapping(
          usrConst.CODE.FRBDN,
         "Route not enabled for merchant"
        );
      }
      if (!details.amount) {
        return mapper.responseMappingWithData(
          usrConst.CODE.BadRequest,
          usrConst.MESSAGE.InvalidDetails,
          "Amount is required"
        );
      }
  
      if (details.amount < 100) {
        return mapper.responseMappingWithData(
          usrConst.CODE.BadRequest,
          usrConst.MESSAGE.InvalidDetails,
          "Amount should be greater than 100"
        );
      }
  
      // Fetch user data
      const query = { emailId: details.emailId };
      //const userData = await dao.getUserDetails(query);
      
      const userData = await getCachedUserDetails(query, dao);
      //console.log(userData)
      const { gateway, redirectUrl, _id: uuid, isBanned, business_name, last24hr, payinLimit } = userData;
      
      if (isBanned) {
        return mapper.responseMapping(
          usrConst.CODE.FRBDN,
          "Your service has been temporarily suspended, please contact us to resolve the issue."
        );
      }
      if (Number(last24hr)>=Number(payinLimit)||(Number(last24hr)+Number(details.amount)>=Number(payinLimit))) {
        return mapper.responseMapping(
          usrConst.CODE.FRBDN,
          "You have reached daily transaction limit for the day"
        );
      }
  
  
      if (!gateway) {
        return mapper.responseMapping(
          usrConst.CODE.FRBDN,
         "Route not enabled for merchant"
        );
      }
  
      // Process based on gateway
      switch (gateway) {
        case "airpay":
          return await processAirpay(details, userData, uuid, adminDao, mapper, createTransaction, appUtils.generatePhonePeURL, appUtils.generateUpiUrl,usrConst);
  
        case "phonepe":
          return await newPaymentQR(details);
  
        case "cashfree":
          return await cashfreePayin(details, createTransaction, mapper, userData, gateway, uuid, usrConst);
  
        case "kwikpaisa":
          return await processKwikpaisa(details, userData, uuid, adminDao, mapper,createTransaction,appUtils.generateUpiUrl, appUtils.generatePhonePeURL,usrConst);
  
        default:
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError
          );
      }
    }
    else {
      return response;
    }

  
  } catch (error) {
    // Handle any errors
    return mapper.responseMappingWithData(
      usrConst.CODE.INTRNLSRVR,
      usrConst.MESSAGE.internalServerError,
      error.message
    );
  }
}

async function sendPayinRequestPage(details) {
  try{

  
  if (details.emailId!=='test@payhub') {
    return mapper.responseMapping(usrConst.CODE.FRBDN, "route not enabled for merchant");
  }
  if(!details.amount)
    {
      return mapper.responseMappingWithData(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails, "Amount is required")
    }
    if(details.amount<100)
    {
      return mapper.responseMappingWithData(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails, "Amount should be greater than 100")
    }
  function parseUrl(url) {
    const urlObject = new URL(url);
    const params = new URLSearchParams(urlObject.search);
    return {
      pa: params.get("pa"),
      pn: params.get("pn"),
      tn: params.get("tn"),
      tr: params.get("tr"),
      am: params.get("am"),
      cu: params.get("cu"),
    };
  }

  function generateNewUrl(baseUrl, params) {
    const urlObject = new URL(baseUrl);
    urlObject.searchParams.set("pa", params.pa);
    urlObject.searchParams.set("pn", params.pn);
    urlObject.searchParams.set("tn", params.tn);
    urlObject.searchParams.set("tr", params.tr);
    urlObject.searchParams.set("am", params.am);
    urlObject.searchParams.set("cu", params.cu);
    return urlObject.href;
  }

  
  function appendQueryParameter(originalUrl, paramName, paramValue) {
    const parsedUrl = new URL(originalUrl);
    parsedUrl.search = `?${paramName}=${paramValue}`;
    return parsedUrl.toString();
  }
  // return mapper.responseMappingWithData(usrConst.CODE.BadRequest, usrConst.MESSAGE.TransactionFailure, 'under maintainance')
  return await validateRequest(details).then(async (response) => {
    console.log(response);
  if (response == true) {

  console.log(details);

  let query = {
    emailId: details.emailId,
  };
  return dao.getUserDetails(query).then(async (userData) => {
    let gateway = userData.gateway;
    let redirectUrl = userData.redirectUrl;
    let uuid = userData._id;
    console.log(redirectUrl);
    if (userData.isBanned)
      return mapper.responseMapping(
        usrConst.CODE.FRBDN,
        "Your service has been temporarily suspended, please contact us to resolve  the issue."
      );
    if (gateway) {
    

    
      if (gateway == "airpay") {
        // Sample data

        // Sample data

        const referenceId = Math.floor(Math.random() * 1000000000);
        //console.log('ref',referenceId);
        const response = await airpayPayin(referenceId, details);
        //console.log("qr", JSON.parse(response));
        if (JSON.parse(response).status == 200) {
          const timeElapsed = Date.now();

          // const gatewayData = await adminDao.getGatewayDetails(
          //   "paythrough"
          // );
          // const gatewayUpdate = {
          //   last24hrTotal: gatewayData.last24hrTotal + 1,
          //   totalTransactions: gatewayData.totalTransactions + 1,
          // };
          // console.log('gatewayData', gatewayUpdate)
          const today = new Date(timeElapsed);
          const query = {
            emailId: details.emailId,
          };
          const updateDetails = {
            transactionId: JSON.parse(response).RID,
            merchant_ref_no: referenceId,
            amount: details.amount,
            currency: "inr",
            country: "in",
            status: "IN-PROCESS",
            hash: "xyzAirpay",
            payout_type: "PAYIN",
            message: "IN-PROCESS",
            transaction_date: today.toISOString(),
            gateway: gateway,
            phone: details.phone ? details.phone : "",
            username: details.username ? details.username : "",
            upiId: details.upiId ? details.upiId : "",
            customer_email: details.customer_email,
            business_name: userData.business_name,
          };

          //adminDao.updateGatewayDetailsPayin("airpay", gatewayUpdate);
          let newData = updateDetails;
          newData.uuid = String(uuid);
          createTransaction(newData);
          //updateTransactionsData(updateDetails)
          ///dao.updateTransaction(query, updateDetails);
          const originalUrl = JSON.parse(response).QRCODE_STRING;
          const parseUrl = (url) => {
            const urlObject = new URL(url);
            const params = new URLSearchParams(urlObject.search);
            return {
              pa: params.get("pa"),
              pn: params.get("pn"),
              tn: params.get("tn"),
              tr: params.get("tr"),
              am: params.get("am"),
              cu: params.get("cu"),
            };
          };

          const generateNewUrl = (baseUrl, params) => {
            const urlObject = new URL(baseUrl);
            urlObject.searchParams.set("pa", params.pa);
            urlObject.searchParams.set("pn", params.pn);
            urlObject.searchParams.set("tn", params.tn);
            urlObject.searchParams.set("tr", params.tr);
            urlObject.searchParams.set("am", params.am);
            urlObject.searchParams.set("cu", params.cu);
            return urlObject.href;
          };

          const paytmUrl = generateNewUrl(
            "paytmmp://upi/pay",
            parseUrl(originalUrl)
          );
          const gpayUrl = generateNewUrl(
            "tez://upi/pay",
            parseUrl(originalUrl)
          );
          const phonepeUrl = appUtils.generatePhonePeURL(originalUrl)

          console.log("Paytm URL:", paytmUrl);
          console.log("Google Pay URL:", gpayUrl);
          console.log("PhonePe URL:", phonepeUrl);
          const gpay = encodeURIComponent(gpayUrl);
          const phonepe = encodeURIComponent(phonepeUrl);
          const paytm = encodeURIComponent(paytmUrl);
          const encodedUri = encodeURIComponent(
            JSON.parse(response).QRCODE_STRING
          );
          const token = await jwtHandler.generatePageExpiryToken(
            details.emailId,
            details.apiKey
          );
          const username = details.username.replace(/\s/g, "");
          let url = `https://payments.payhub.link/?amount=${
            details.amount
          }&email=${details.emailId}&phone=${
            details.phone
          }&username=${username}&txid=${
            JSON.parse(response).RID
          }&gateway=payhubA&qr=${encodedUri}&upi=${encodedUri}&gpay=${gpay}&phonepe=${phonepe}&paytm=${paytm}&token=${token}`;
          if (redirectUrl) {
            const originalUrl = redirectUrl;

            // Parse the URL
            const parsedUrl = new URL(originalUrl);

            // Append query parameter
            parsedUrl.search = `?txId=${JSON.parse(response).RID}`;

            // Get the modified URL
            const modifiedUrl = parsedUrl.toString();

            url = `https://payments.payhub.link/?amount=${
              details.amount
            }&email=${details.emailId}&phone=${
              details.phone
            }&username=${username}&txid=${
              JSON.parse(response).RID
            }&gateway=payhubA&qr=${encodedUri}&url=${modifiedUrl}&upi=${encodedUri}&gpay=${gpay}&phonepe=${phonepe}&paytm=${paytm}&token=${token}`;
          }
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            {
              url: url,
              //url:JSON.parse(response).QRCODE_STRING,
              // upiUrl: JSON.parse(response).QRCODE_STRING,
              transaction_id: JSON.parse(response).RID,
            }
          );
        } else {
          return mapper.responseMappingWithData(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError,
            response
          );
        }
      }
      if (gateway == "phonepe") {
        const response = await newPayment(details);
        if (response.success == true) {
          const timeElapsed = Date.now();
          const today = new Date(timeElapsed);
          const query = {
            emailId: details.emailId,
          };
          const updateDetails = {
            transactionId: response.data.merchantTransactionId,
            merchant_ref_no: response.data.merchantId,
            amount: details.amount,
            currency: "inr",
            country: "in",
            status: "IN-PROCESS",
            hash: "xyzPhonepe",
            payout_type: "PAYIN",
            message: "IN-PROCESS",
            transaction_date: today.toISOString(),
            gateway: gateway,
            phone: details.phone ? details.phone : "",
            username: details.username ? details.username : "",
            upiId: details.upiId ? details.upiId : "",
            customer_email: details.customer_email,
            business_name: userData.business_name,
            uuid: String(uuid),
          };
          createTransaction(updateDetails);
          const resp = {
            // status: response.status,
            // message: response.message,
            // amount: details.amount,
            transaction_id: response.data.merchantTransactionId,
            transaction_date: today.toISOString(),
            url: response.data.instrumentResponse.redirectInfo.url,
          };

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            resp
          );
        } else {
          return mapper.responseMappingWithData(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.internalServerError,
            response
          );
        }
        //return resp;
      }
      if(gateway == "payhub")
      {
        const timeElapsed = Date.now();

        // const gatewayUpdate = {
        //   last24hrTotal: gatewayData.last24hrTotal + 1,
        //   totalTransactions: gatewayData.totalTransactions + 1,
        // };

        //console.log("gatewayData", gatewayUpdate);

        const today = new Date(timeElapsed);
        const response = await generateQrCode(details.amount)
        const updateDetails = {
          transactionId: response.transactionId,
          merchant_ref_no: response.transactionId,
          amount: details.amount,
          currency: "inr",
          country: "in",
          status: "IN-PROCESS",
          hash: "xyzPaythrough",
          payout_type: "PAYIN",
          message: "IN-PROCESS",
          transaction_date: today.toISOString(),
          gateway: gateway,
          phone: details.phone ? details.phone : "",
          username: details.username ? details.username : "",
          upiId: details.upiId ? details.upiId : "",
          customer_email: details.customer_email,
          business_name: userData.business_name,
          uuid: String(uuid),
          // Add other fields as needed
        };

        // adminDao.updateGatewayDetailsPayin("paythrough", gatewayUpdate);
        createTransaction(updateDetails);
        const token = await jwtHandler.generatePageExpiryToken(
          details.emailId,
          details.apiKey
        );
        const originalUrl = response.upiUrl;
        const parsedUrl = parseUrl(originalUrl);

        const paytmUrl = generateNewUrl("paytmmp://upi/pay", parsedUrl);
        const gpayUrl = generateNewUrl("tez://upi/pay", parsedUrl);
        const phonepeUrl = generateNewUrl("phonepe://upi/pay", parsedUrl);

        const gpay = encodeURIComponent(gpayUrl);
        const phonepe = encodeURIComponent(phonepeUrl);
        const paytm = encodeURIComponent(paytmUrl);
        const encodedUri = encodeURIComponent(originalUrl);

        const username = details.username.replace(/\s/g, "");
        let url = `https://gregarious-fudge-52b704.netlify.app/?amount=${details.amount}&email=${details.emailId}&phone=${details.phone}&username=${username}&txid=${response.transactionId}&gateway=payhubpt&qr=${encodedUri}&upi=${encodedUri}&url=${redirectUrl}&gpay=${gpay}&phonepe=${phonepe}&paytm=${paytm}&token=${token}`;

        if (redirectUrl) {
          const modifiedUrl = appendQueryParameter(
            redirectUrl,
            "txId",
            response.transactionId
          );
          url = `https://gregarious-fudge-52b704.netlify.app/?amount=${details.amount}&email=${details.emailId}&phone=${details.phone}&username=${username}&txid=${response.transactionId}&gateway=payhubpt&qr=${encodedUri}&url=${modifiedUrl}&upi=${encodedUri}&gpay=${gpay}&phonepe=${phonepe}&paytm=${paytm}&token=${token}`;
        }

        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          {
            url: url,
            transaction_id: response.transactionId,
          }
        );
      }
    } else {
      return mapper.responseMapping(
        usrConst.CODE.INTRNLSRVR,
        usrConst.MESSAGE.InvalidDetails
      );
    }
  });
  } else if (response == false) {
    return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
  } else {
    return response;
  }
  });
}catch(error)
{
  console.log(error)
  return mapper.responseMapping(
    usrConst.CODE.INTRNLSRVR,
    usrConst.MESSAGE.internalServerError  );
}
}

async function sendPayinRequestHosted(details) {
  try {
    // Validate the request
   
    const isValid = await validateRequest(details);
    if (!isValid) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    }
    if (isValid == true) {
      if (details.emailId!=='test@payhub') {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "route not enabled for merchant");
      }
        // Fetch user data
    const query = { emailId: details.emailId };
    const userData = await dao.getUserDetails(query);
    const { gateway, redirectUrl, _id: uuid, isBanned, business_name } = userData;

    if (isBanned) {
      return mapper.responseMapping(
        usrConst.CODE.FRBDN,
        "Your service has been temporarily suspended, please contact us to resolve the issue."
      );
    }

    if (!gateway) {
      return mapper.responseMapping(
        usrConst.CODE.INTRNLSRVR,
        usrConst.MESSAGE.InvalidDetails
      );
    }

    // Process based on gateway
    switch (gateway) {
      case "razorpay": {
        const body = {
          ...details,
          email_id: process.env.adminId,
          password: process.env.apiKey,
          key: process.env.apiKey,
          admin: process.env.adminId,
          gateway: "razorpay"
        };

        body.amount = Number(body.amount) * 100; // Convert amount to the smallest currency unit
        const token = await generateTokenGlobalpay(body);

        if (token) {
          const page = await getPayinPageGlobalpay(body);
          if (page?.statusCode === 200) {
            const timeElapsed = Date.now();
            const today = new Date(timeElapsed);

            const updateDetails = {
              transactionId: page?.body?.transaction_id,
              merchant_ref_no: page?.body?.transaction_id,
              amount: Number(details.amount),
              currency: "inr",
              country: "in",
              status: "IN-PROCESS",
              hash: "xyzPhonepe",
              payout_type: "PAYIN",
              message: "IN-PROCESS",
              transaction_date: today.toISOString(),
              gateway: "razorpayPage",
              phone: details.customer_phone || "",
              username: details.customer_name || "",
              upiId: details.upiId || "",
              customer_email: details.customer_emailId,
              business_name: userData.business_name,
              uuid: String(uuid),
            };

            await createTransaction(updateDetails);

            const resp = {
              transaction_id: page?.body?.transaction_id,
              transaction_date: today.toISOString(),
              url: page?.body?.url
            };

            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              resp
            );
          }
        }
        break;
      }

      case "phonepe": {
        const response = await newPayment(details,createTransaction,mapper,usrConst);
        return response
      }

      case "kwikpaisa": {
        const response = await processKwikpaisaPageRequest(details,userData,uuid,adminDao,mapper,createTransaction,usrConst);
        return response
      }

      default:
        return mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          usrConst.MESSAGE.InvalidDetails
        );
    }
    }
      else {
        return response;
      }
  
  } catch (error) {
    return mapper.responseMappingWithData(
      usrConst.CODE.INTRNLSRVR,
      usrConst.MESSAGE.internalServerError,
      error.message
    );
  }
}


async function sendPayinRequestCollect(details) {
  if (details.emailId!=='test@payhub') {
    return mapper.responseMapping(usrConst.CODE.FRBDN, "route not enabled for merchant");
  }
  return await validateRequest(details).then(async (response) => {
    console.log(response);
    // return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, response)
    if (response == true) {
      console.log(details);

      let query = {
        emailId: details.emailId,
      };
      return dao.getUserDetails(query).then(async (userData) => {
        let gateway = "paythroughIntent"; //userData.premiumGateway
        let redirectUrl = userData.redirectUrl;
        let uuid = userData._id;

        console.log(redirectUrl);
        if (userData.isBanned)
          return mapper.responseMapping(
            usrConst.CODE.FRBDN,
            "Your service has been temporarily suspended, please contact us to resolve  the issue."
          );
        if (gateway) {
          if (gateway == "paythroughIntent") {
            return generateTokenPaythrough().then((response) => {
              if (response) {
                details.access_token = response;
                return paythroughyPayin(details).then((response) => {
                  if (response.status_code == 200) {
                    const timeElapsed = Date.now();
                    const today = new Date(timeElapsed);
                    const query = {
                      emailId: details.emailId,
                    };
                    const updateDetails = {
                      transactionId: response.transaction_id,
                      merchant_ref_no: response.order_id,
                      amount: response.amount,
                      currency: "inr",
                      country: "in",
                      status: "IN-PROCESS",
                      hash: "xyzPaythrough",
                      payout_type: "PAYIN",
                      message: "IN-PROCESS",
                      transaction_date: today.toISOString(),
                      gateway: gateway,
                      phone: details.phone ? details.phone : "",
                      username: details.username ? details.username : "",
                      upiId: details.upiId ? details.upiId : "",
                      customer_email: details.customer_email,
                      business_name: userData.business_name,
                    };
                    //updateTransactionsData(updateDetails);
                    dao.updateTransaction(query, updateDetails);
                    let newData = updateDetails;
                    newData.uuid = String(uuid);
                    createTransaction(newData);
                    const resp = {
                      status_code: response.status_code,
                      status: response.status,
                      message: response.message,
                      amount: response.amount,
                      upi_id: response.upi_id,
                      invoice_id: response.invoice_id,
                      order_id: response.order_id,
                      transaction_id: response.transaction_id,
                    };

                    return mapper.responseMappingWithData(
                      usrConst.CODE.Success,
                      usrConst.MESSAGE.Success,
                      resp
                    );
                  } else {
                    return mapper.responseMappingWithData(
                      usrConst.CODE.INTRNLSRVR,
                      usrConst.MESSAGE.internalServerError,
                      response
                    );
                  }
                });
                // const encodedUri = encodeURIComponent(response.upiIntent)
                // const decodeUri = decodeURIComponent(encodedUri)
                // console.log(decodeUri)
                // let url = `https://payments.payhub.link/?amount=${details.amount}&email=${details.emailId}&phone=${details.phone}&username=${details.username}&txid=${response.transactionId}&gateway=payhubi&qr=${encodedUri}`
              } else {
                return mapper.responseMapping(
                  usrConst.CODE.INTRNLSRVR,
                  usrConst.MESSAGE.internalServerError
                );
              }
            });
          }
        } else {
          return mapper.responseMapping(
            usrConst.CODE.INTRNLSRVR,
            usrConst.MESSAGE.InvalidDetails
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

// async function sendPayinRequestCollect(details) {
//   if (details.emailId!=='test@payhub') {
//     return mapper.responseMapping(usrConst.CODE.FRBDN, "route not enabled for merchant");
//   }
//   return await validateRequest(details).then(async (response) => {
//     console.log(response);
//     // return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, response)
//     if (response == true) {
//       console.log(details);

//       let query = {
//         emailId: details.emailId,
//       };
//       return dao.getUserDetails(query).then(async (userData) => {
//         let gateway = "phonepeCollect"; //userData.premiumGateway
//         let redirectUrl = userData.redirectUrl;
//         console.log(redirectUrl);
//         if (userData.isBanned)
//           return mapper.responseMapping(
//             usrConst.CODE.FRBDN,
//             "You are banned from making transactions.Please contact admin"
//           );
//         if (gateway) {
//           if (gateway == "phonepeCollect") {
//             return newPayment(details).then((response) => {
//               console.log(response);
//               if (response.success == true) {
//                 const timeElapsed = Date.now();
//                 const today = new Date(timeElapsed);
//                 const query = {
//                   emailId: details.emailId,
//                 };
//                 const updateDetails = {
//                   transactionId: response.data.merchantTransactionId,
//                   merchant_ref_no: response.data.merchantId,
//                   amount: details.amount,
//                   currency: "inr",
//                   country: "in",
//                   status: "IN-PROCESS",
//                   hash: "xyzPhonepe",
//                   payout_type: "PAYIN",
//                   message: "IN-PROCESS",
//                   transaction_date: today.toISOString(),
//                   gateway: gateway,
//                   phone: details.phone ? details.phone : "",
//                   username: details.username ? details.username : "",
//                   upiId: details.upiId ? details.upiId : "",
//                 };
//                 dao.updateTransaction(query, updateDetails);
//                 const resp = {
//                   status: response.status,
//                   message: response.message,
//                   amount: details.amount,
//                   transaction_id: response.data.merchantTransactionId,
//                   transaction_date: today.toISOString(),
//                   transaction_url:
//                     response.data.instrumentResponse.redirectInfo.url,
//                 };

//                 return mapper.responseMappingWithData(
//                   usrConst.CODE.Success,
//                   usrConst.MESSAGE.Success,
//                   resp
//                 );
//               } else {
//                 return mapper.responseMappingWithData(
//                   usrConst.CODE.INTRNLSRVR,
//                   usrConst.MESSAGE.internalServerError,
//                   response
//                 );
//               }
//             });
//             // const encodedUri = encodeURIComponent(response.upiIntent)
//             // const decodeUri = decodeURIComponent(encodedUri)
//             // console.log(decodeUri)
//             // let url = `https://payments.payhub.link/?amount=${details.amount}&email=${details.emailId}&phone=${details.phone}&username=${details.username}&txid=${response.transactionId}&gateway=payhubi&qr=${encodedUri}`
//           } else {
//             return mapper.responseMapping(
//               usrConst.CODE.INTRNLSRVR,
//               usrConst.MESSAGE.internalServerError
//             );
//           }
//         }
//       });
//     } else if (response == false) {
//       return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
//     } else {
//       return response;
//     }
//   });
// }

async function sendPayinRequestBank(details) {
  return await validateRequest(details).then(async (response) => {
    console.log(response);
    // return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, response)
    if (response == true) {
      console.log(details);
      let bankDetails = {
        emailId: `${details.emailId}`,
        apiKey: `${details.apiKey}`,
        request_type: "deposit",
        data: {
          midcode: "30",
          payby: "upi",
          amount: details.amount,
          hash: "",
          currency: "inr",
          country: "in",
          notification_url: "string",
          return_url: "string",
          merchant_ref_no: "8788",
          firstname: "romesh",
          lastname: "sharma",
          city: "mumbai",
          address: "mumbai",
          state: "mh",
          zipcode: "495006",
          phone: "7890989899",
          ipaddress: "103.176.136.52",
          email: "na@gmail.com",
          vpa_address: details.upiId,
          checkout_type: "seamless",
          postcode: "495006",
          custom_field_1: "string",
          custom_field_2: "string",
          custom_field_3: "string",
          custom_field_4: "string",
          custom_field_5: "string",
          risk_data: {
            user_category: "default",
            device_fingerprint: "test",
          },
        },
      };

      const resp = await processPayinRequestBank(bankDetails);
      console.log(resp);
      if (resp.success == true) {
        const query = {
          emailId: details.emailId,
        };
        const updateDetails = {
          transactionId: resp.data.transaction_id,
          merchant_ref_no: resp.data.merchant_ref_no,
          amount: resp.data.amount,
          currency: resp.data.currency,
          country: resp.data.country,
          status: resp.data.status,
          hash: resp.data.hash,
          payout_type: resp.data.payout_type,
          message: resp.data.message,
          transaction_date: resp.data.transaction_date,
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
          resp
        );
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
        const query = {
          emailId: details.emailId,
        };
        const response = await dao.getAllTransactions(query);
        // console.log("my response", response);
        if (response?.transactions != null)
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            response.transactions
          );
        else
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            []
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
        const query = {
          emailId: details.emailId,
          limit: details.limit,
          skip:details.skip
        };
        const response = await adminDao.getUserSettlements(query);
        if (response != null) {
          let allTx = [];
          response.map((item, index) => {
            let body = {
              amount: item.amount,
              currency: item.currency,
              country: item.country,
              transaction_date: item.transaction_date,
              ref_no: item.ref_no,
              notes: item.notes,
              txIndex: index,
              feeCharged: item.feeCharged,
              amountSettled: item.amountSettled,
              usdt: item.usdt ? item.usdt : 0,
              feePercentage: item?.feePercentage ? item?.feePercentage : 0,
              usdtRate: item?.usdtRate ? item?.usdtRate : 0,
              netGst :item?.netGst?item?.netGst:0,
              refund :item?.refund?item?.refund:0,
              chargeback :item?.chargeback?item?.chargeback:0,
              rolling_reserve:item?.rolling_reserve?item?.rolling_reserve:0,
              misc:item?.misc?item?.misc:0,
              gst:item?.gst?item?.gst:0, 
              bankFees:item?.bankFees?item?.bankFees:0,
              netBankFees:item?.netBankFees?item?.netBankFees:0,
            };
            // body.txIndex = index
            allTx.push(body);
          });
          const startIndex = details.skip;
          const endIndex = startIndex + details.limit;
          const reversed = allTx.sort(
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
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            []
          );
        }
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

async function getAllUserTopups(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const query = {
          merchantEmailId: details.emailId,
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

async function getProfileData(details) {
  console.log(details)
   return await validateRequest(details).then(async (response) => {
      if (response == true) {
        if (!details.emailId)
        return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
        const { error } = emailSchema.validate(details.emailId);
        if (error) {
          return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid email format");
        }
      
        const sanitizedEmail = details.emailId.replace(/[$\s]/g, "");
            console.log('sanitized', sanitizedEmail)
      const query = {
        emailId: sanitizedEmail,
      };
      const response = await dao.getAllTransactions(query);
      console.log(response);
      if (response) {
        const encrytedKey = appUtils.encryptText(response.apiKey);
    
        let ProfileData = response._doc || response; // Use _doc if available, otherwise use the response directly
    
        ProfileData.apiKey = encrytedKey;
    
        // Check existence before deleting
        if (ProfileData.hasOwnProperty("payoutGateway")) {
          delete ProfileData.payoutGateway;
        }
    
        if (ProfileData.hasOwnProperty("premiumGateway")) {
          delete ProfileData.premiumGateway;
        }
    
        if (ProfileData.hasOwnProperty("settlements")) {
          delete ProfileData.settlements;
        }
    
        if (ProfileData.hasOwnProperty("payouts")) {
          delete ProfileData.payouts;
        }
    
        if (ProfileData.hasOwnProperty("platformFee")) {
          delete ProfileData.platformFee;
        }
        if (ProfileData.hasOwnProperty("transactions")) {
          delete ProfileData.transactions;
        }
        if (ProfileData.hasOwnProperty("gateway")) {
          delete ProfileData.gateway;
        }
    
        if (ProfileData.hasOwnProperty("token")) {
          delete ProfileData.token;
        }
        if (ProfileData.hasOwnProperty("password")) {
          delete ProfileData.password;
        }
        if (ProfileData.hasOwnProperty("apiKey")) {
          delete ProfileData.apiKey;
        }
        if (ProfileData.hasOwnProperty("encryptionKey")) {
          delete ProfileData.encryptionKey;
        }
        // Now ProfileData should contain the modified data without Mongoose metadata
    
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          ProfileData
        );
      } else
        return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
      } else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    })
   


  
}

async function getEncryptionKey(details) {
  if (!details.emailId)
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const query = {
          emailId: details.emailId,
        };
        const response = await dao.getAllTransactions(query);
        console.log(response);
        if (response) {
          const encryptedKey = response.encryptionKey; //appUtils.encryptText(response.apiKey)
          const encrytedKey = appUtils.encryptText(response.apiKey);
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            {encryptedKey,apiKey:encrytedKey}
          );
        } else
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
}
async function getAllUsersTransactions(details) {
  if (details.email_Id && details.apiKey) {
    return await validateAdminRequest(details).then(async (response) => {
      if (response == true) {
        const response = await dao.getAllUsersTransactions();
        console.log(response);
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

async function getBazorpayPaymentStatus(details) {
  const response = await fetchBazorpayPaymentStatus(details);
  //console.log(JSON.parse(response.message))
  const validJsonString = response.message.replace(/'/g, '"');

  // Parse the JSON string into a JavaScript object
  const jsonObject = JSON.parse(validJsonString);
  if (jsonObject.statusCode == 200) {
    return mapper.responseMappingWithData(
      usrConst.CODE.Success,
      usrConst.MESSAGE.Success,
      jsonObject.data[0]
    );
  } else {
    return mapper.responseMappingWithData(
      usrConst.CODE.Success,
      usrConst.MESSAGE.Success,
      jsonObject
    );
  }
}

async function getPayinStatus(details) {
  console.log(details);
  return validateRequest(details).then(async (response) => {
    if (response == true) {
      const response = await fetchPayintStatusBz(details);
      //console.log(JSON.parse(response.message))
      // const validJsonString = response.message.replace(/'/g, "\"");

      // // Parse the JSON string into a JavaScript object
      // const jsonObject = JSON.parse(validJsonString);
      if (response.transaction) {
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response.transaction
        );
      } else {
        return mapper.responseMappingWithData(
          usrConst.CODE.DataNotFound,
          usrConst.MESSAGE.InvalidDetails,
          "transaction not found"
        );
      }
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return response;
    }
  });
}

async function fetchPayinStatus(details) {
  console.log(details);
  return validateRequest(details).then(async (response) => {
    if (response == true) {
      let query = {
        emailId: details.emailId,
      };
      if (!details?.transaction_id) {
        return mapper.responseMappingWithData(
          usrConst.CODE.BadRequest,
          usrConst.MESSAGE.InvalidDetails,
          "Please enter transaction id"
        );
      }
      // if(!details?.transaction_date)
      // {
      //   return mapper.responseMappingWithData(
      //     usrConst.CODE.BadRequest,
      //     usrConst.MESSAGE.InvalidDetails,
      //      "Please enter transaction date"
      //   );
      //   }
      const txType = await dao.fetchTxDetailNew(query, details.transaction_id);
      if (txType) {
        console.log(txType);
        if (txType.hash == "xyzbazorpay") {
          const response = await fetchPayintStatusBz(details);
          console.log("bazarpay", response);
          if (response.transaction.amount) {
            const respObject = {
              amount: response.transaction.amount,
              transaction_id: response.transaction.merchant_transaction_id,
              status: response.transaction.status,
            };
            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              respObject
            );
          } else {
            return mapper.responseMappingWithData(
              usrConst.CODE.Success,
              usrConst.MESSAGE.Success,
              { status: "transaction not found" }
            );
          }
        }

        const respObject = {
          amount: txType.amount,
          transaction_id: txType.transaction_id || txType.transactionId,
          status:
            txType.status === "IN-PROCESS"
              ? "pending"
              : txType.status === "fail" || txType.status === "failed"
              ? "failed"
              : txType.status === "expired"
              ? "expired"
              : txType.status,
          code:
            txType.status === "success"
              ? "00"
              : txType.status === "IN-PROCESS"
              ? "01"
              : txType.status === "failed" || txType.status === "fail"
              ? "02"
              : txType.status === "expired"
              ? "U69"
              : "03",
          description:
            txType.status === "success"
              ? "transaction success"
              : txType.status === "IN-PROCESS"
              ? "transaction pending"
              : txType.status === "failed" || txType.status === "fail"
              ? "Customer failed to complete transaction"
              : txType.status === "expired"
              ? "Collect request expired"
              : "Not found",
        };
        //console.log("resp object", respObject);
        if (txType) {
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            respObject
          );
        } else {
          return mapper.responseMappingWithData(
            usrConst.CODE.DataNotFound,
            usrConst.MESSAGE.InvalidDetails,
            { status: "transaction not found" }
          );
        }
      } else {
        return mapper.responseMappingWithData(
          usrConst.CODE.DataNotFound,
          usrConst.MESSAGE.InvalidDetails,
          { status: "transaction not found" }
        );
      }
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return response;
    }
  });
}

async function getPinwalletPayinStatus(details) {
  console.log(details);
  let query = {
    emailId: details.emailId,
  };
  return dao.fetchTxDetail(query, details.transactionId).then((response) => {
    console.log(response);
    return response;
  });
}

async function getVolumes(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        const query = {
          emailId: details.emailId,
        };
        const response = await dao.getAllUserTransactions(query);
        // const successfulTransactions = response.transactions.filter(transaction => transaction.status === 'success');
        // function isYesterday(dateString) {
        //     const transactionDate = moment.tz(dateString, 'Asia/Kolkata'); // Convert to Indian Standard Time (IST)
        //     const yesterday = moment.tz('Asia/Kolkata').subtract(1, 'days').startOf('day'); // Start of yesterday in IST
        //     const today = moment.tz('Asia/Kolkata').startOf('day'); // Start of today in IST

        //     return transactionDate >= yesterday && transactionDate < today;// Compare within the same day
        //   }

        //   // Function to check if a date is today
        //   function isToday(dateString) {
        //     const transactionDate = moment.tz(dateString, 'Asia/Kolkata'); // Convert to Indian Standard Time (IST)
        //     const today = moment.tz('Asia/Kolkata'); // Get the current time in IST

        //     return transactionDate.isSame(today, 'day');

        // }

        //   // Function to check if a date is within the last 7 days (weekly)
        //   function isWithinLastWeek(dateString) {
        //     const date = new Date(dateString);
        //     const oneWeekAgo = new Date();
        //     oneWeekAgo.setUTCHours(0, 0, 0, 0);
        //     oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        //     return date >= oneWeekAgo && date < new Date(); // Compare within the same day
        //   }
        //   // Get the current date in the same format as the 'transaction_date'
        //   const currentDate = new Date().toISOString();

        //   // Initialize arrays for yesterday, today, and weekly transactions
        //   const yesterdayTransactions = [];
        //   const todayTransactions = [];
        //   const weeklyTransactions = [];

        //   // Iterate through successful transactions
        //   for (const transaction of successfulTransactions) {
        //     const transactionDate = new Date(transaction.transaction_date);

        //     if (isToday(transactionDate)) {
        //         todayTransactions.push(transaction);
        //     }
        //      if (isYesterday(transactionDate)) {
        //         yesterdayTransactions.push(transaction);
        //     }
        //     if (isWithinLastWeek(transactionDate)) {
        //         weeklyTransactions.push(transaction);
        //     }
        // }

        //   // Now, you have three arrays: yesterdayTransactions, todayTransactions, and weeklyTransactions
        // //   console.log("Yesterday's Transactions:", yesterdayTransactions);
        // //   console.log("Today's Transactions:", todayTransactions);
        // //   console.log("Weekly Transactions:", weeklyTransactions);

        // function calculateTotalAmount(transactions) {
        //     return transactions.reduce((total, transaction) => total + transaction.amount, 0);
        //   }

        //   // Calculate the total amount for yesterday, today, and weekly transactions
        //   const totalAmountYesterday = calculateTotalAmount(yesterdayTransactions);
        //   const totalAmountToday = calculateTotalAmount(todayTransactions);
        //   const totalAmountWeekly = calculateTotalAmount(weeklyTransactions);

        //   // Create objects with the desired structure
        //   const yesterdayObject = { volume: totalAmountYesterday, transactions: yesterdayTransactions };
        //   const todayObject = { volume: totalAmountToday, transactions: todayTransactions };
        //   const weeklyObject = { volume: totalAmountWeekly, transactions: weeklyTransactions };

        //   // Now you have the three objects with the specified structure
        // //   console.log("Yesterday's Object:", yesterdayObject);
        // //   console.log("Today's Object:", todayObject);
        // //   console.log("Weekly Object:", weeklyObject);
        const totalTransactions = response.totalTransactions;
        const SuccessfulTransactions = response.successfulTransactions;
        const successRate =
          Number(response.last24hrSuccess) > 0 ||
          Number(response.last24hrTotal) > 0
            ? (Number(response.last24hrSuccess) /
                Number(response.last24hrTotal)) *
              100
            : 0;
        let responseData = {
          yesterdayObject: { volume: response.yesterday },
          todayObject: { volume: response.last24hr },
          weeklyObject: { volume: response.balance },
          totalTransactions,
          successfulTransactions: response.last24hr,
          successRate,
          balance: response.balance,
        };
        console.log(responseData);
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
  } else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
  }
}

async function getDataByUtr(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
      };

      return dao.getDataByUtr(details).then((response) => {
        if (response) {
          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            response
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
        emailId: details.emailId,
        skip: details.skip,
        limit: details.limit,
      };

      return dao.getUserTransactionsData(query).then((user) => {
        if (user) {
          //console.log("success", user);

          return mapper.responseMappingWithData(
            usrConst.CODE.Success,
            usrConst.MESSAGE.Success,
            user
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

async function getTransactionsByDate(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
      };

      return dao
        .getTransactionByDate(query, details.start_date, details.end_date, details.limit, details.skip)
        .then((user) => {
          if (user) {
            //console.log("success", user);

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

async function getAllTransactionWithSuccessStatus(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
      };

      return dao
        .getAllTransactionWithSuccessStatus(query, details)
        .then((user) => {
          if (user) {
            //console.log("success", user);

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
        emailId: details.emailId,
        status: details.status,
        limit: details.limit,
        skip: details.skip,
      };

      return dao.getTransactionsByStatus(query).then((user) => {
        if (user) {
          //console.log("success", user);

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

async function getTransactionsByStatusAndDate(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
        status: details.status,
        startDate: details?.start_date,
        endDate: details?.end_date,
        limit: details.limit,
        skip: details.skip,
      };

      return dao.getTransactionsByStatusAndDate(query).then((user) => {
        if (user) {
          //console.log("success", user);

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

async function updatePayoutCallbackUrl(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      const query = {
        emailId: details.emailId,
      };
      let updateDetails = {
        payoutCallbackUrl: details.payoutCallbackUrl,
      };

      return dao.updateProfile(query, updateDetails).then((userUpdated) => {
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
    } else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
  });
}
async function sendSignUpOtp(details){
  try{
    const email = details.email ? details.email.trim() : "";

// Check if email is provided
if (!email) {
  return mapper.responseMapping(500, "Please enter a valid email");
}

// Regular expression for validating email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // Simple regex for email format validation
if (!emailRegex.test(email)) {
  return mapper.responseMapping(500, "Invalid email format. Please enter a valid email address");
}


    const existingUser = await User.findOne({emailId: email });
    if(existingUser){
      return mapper.responseMapping(500, "Account already exist");
    }
    const transporter = nodemailer.createTransport({
      host: 'mail.privateemail.com',
      port: 465,  // Use 587 for TLS if you prefer
      secure: true,  // true for SSL, false for TLS
      auth: {
        user: 'ops@payhub.link',  // Replace with your Private Email address
        pass: 'payhub123$'  // Replace with your Private Email password
      }
    })
    const otp = await generateOTP(email)
    const mailOptions = {
      from: {
        name: "Payhub",
        address: "ops@payhub.link"
      },
      to: email,
      subject: "Sign-up OTP",
      text: `Hello, your sign-up OTP is ${otp}`,
      html: `
       <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    
    <h2 style="text-align: center; color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">PayHub</h2>
    
    <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
    <p style="font-size: 16px; line-height: 1.5;">Your One-Time Password (OTP) for Sign up in Payhub is:</p>

    <div style="text-align: center; padding: 20px; margin: 20px 0; background-color: #e0e0e0; border-radius: 8px;">
      <p style="font-size: 36px; font-weight: bold; color: #000; margin: 0;">${otp}</p>
    </div>

    <p style="font-size: 16px; line-height: 1.5;">Please enter this OTP to complete your sign up process. This OTP is valid for <strong>5 minutes</strong>.</p>

    <div style="background-color: #000; color: white; padding: 10px; border-radius: 8px; text-align: center; margin: 20px 0;">
      <p>If you did not request this OTP, please <a href="mailto:support@payhub.com" style="color: white; text-decoration: underline;">contact our support team</a> immediately.</p>
    </div>

    <p style="font-size: 16px; line-height: 1.5;">Thank you,</p>
    <p style="font-size: 16px; line-height: 1.5;">The Payhub Team</p>

    <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
    <small style="color: #666; font-size: 12px;">If you have any questions, feel free to reach out to us at <a href="mailto:support@payhub.com" style="color: #000; text-decoration: none;">support@payhub.com</a></small>
  </div>
</div>

      `
    };
    await transporter.sendMail(mailOptions)
    return mapper.responseMappingWithData(200, "success", "please check otp on the given email")
  }catch(error){
    console.log('user.controller.changePassword', error.message)
    return reply.status(500).send(responseMappingError(500, `Internal server error`))

  }
}


async function generateOTP(emailId) {
  try {
    let otp;

    // Find the most recent OTP created within the last 5 minutes
    const last_otp = await Otp.findOne({
      emailId,
      sent_at: {
        $gte: new Date(Date.now() - 5 * 60 * 1000), // sent within last 5 minutes
      },
    });

    // If an OTP was found within the last 5 minutes, reuse it
    if (last_otp) {
      otp = last_otp.otp;
    } else {
      // Otherwise, generate a new OTP
      otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
      await Otp.create({ emailId, otp });
    }

    return otp;
  } catch (err) {
    logger.error(`generateOTP: ${err}`);
    throw err;
  }
}

//csv services
async function downloadCsvForMerchant(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query ={
          emailId:details.emailId
        }
        const response = await transactionDao.downloadUserTransactionsCsv(query);
        

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

async function downloadCsvForMerchantWithStatus(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query ={
          emailId:details.emailId,
          status:details.status
        }
        const response = await transactionDao.downloadUserTransactionsCsvWithStatus(query);
        

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

async function downloadCsvForMerchantByDate(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query ={
          emailId:details.emailId,
          startDate:details.start_date,
          endDate:details.end_date
        }
        const response = await transactionDao.downloadUserTransactionsByDateCsv(query);
        

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


async function downloadSettlementCsvForMerchantByDate(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query ={
          emailId:details.emailId,
          startDate:details.start_date,
          endDate:details.end_date
        }
        const response = await transactionDao.downloadSettlementTransactionsByDateWithStatusCsvMerchant(query);
        

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

async function downloadCsvForMerchantByDateWithStatus(details) {
  if (details.emailId && details.apiKey) {
    return await validateRequest(details).then(async (response) => {
      if (response == true) {
        let query ={
          emailId:details.emailId,
          startDate:details.start_date,
          endDate:details.end_date,
          status:details.status
        }
        const response = await transactionDao.downloadUserTransactionsByDateWithStatusCsv(query);
        

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


async function getSettlementByType(details) {
  try{
    const response = await validateRequest(details)
    if(response == true){
      const query = {
        emailId: details.emailId,
      };
      const merchant = await User.findOne(query);
      if (!merchant) {
        return mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          "User not found"
        );
      }
      let allTx = [];


      if (details.type == "all"){

        const settlementResult = await Settlements.aggregate([
          {
            $match: {
              uuid: String(merchant._id),            
            },
          },
          // Other pipeline stages can go here, like $group, $lookup, etc.
        ]);

        const settlements = settlementResult

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


    //   const settlementResult = await Settlements.aggregate([
    //     {
    //       $match: { uuid: String(merchant._id),type:details.type }, // Assuming 'userId' in Settlements matches the '_id' in user
    //     },
    //     // Other pipeline stages can go here, like $group, $lookup, etc.
    //   ]);


    //   let allTx = [];
    //     const settlements = settlementResult;
    //     if(details.type == "settlement"){
    //       settlements.map((item, index) => {
    //         let body = {
    //           amount: item.amount,
    //           feePercentage: item?.feePercentage ? item?.feePercentage : 0,
    //           bankFees: item?.bankFees ? item?.bankFees : 0,
    //           usdtRate: item?.usdtRate ? item?.usdtRate : 0,
    //           gst: item?.gst ? item?.gst : 0,
    //           netFees: item.feeCharged ? item.feeCharged : 0,
    //           netVolume: item.amountSettled ? item.amountSettled : 0,
    //           usdt: item.usdt ? item.usdt : 0,
    //           netBankFees: item?.netBankFees ? item?.netBankFees : 0,
    //           netGst: item?.netGst ? item?.netGst : 0,
    //           ref_no: item.ref_no ? item.ref_no : "",
    //           transaction_date: item.transaction_date,
    //           txIndex: index,
    //           type: item?.type ? item.type : "settlement",
    //           balance : item?.balance ? item.balance : 0
    //         };
    //         // body.txIndex = index
    //         allTx.push(body);
    //       });
    //       //console.log(allTx)
    //       const startIndex = details.skip;
    //       const endIndex = startIndex + details.limit;
    //       const reversed = allTx.sort(
    //         (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
    //       );
    //       const paginatedTransactions = reversed.slice(startIndex, endIndex);

    //       return mapper.responseMappingWithData(
    //         usrConst.CODE.Success,
    //         usrConst.MESSAGE.Success,
    //         paginatedTransactions
    //       );
    //     }else if(details.type == "refund")
    //       {
    //         settlements.map((item, index) => {
    //           let body = {
    //             amount: item.amount,
    //             feePercentage: item?.feePercentage ? item?.feePercentage : 0,
    //             netFees: item.feeCharged ? item.feeCharged : 0,
    //             netVolume: item.amountSettled ? item.amountSettled : 0,
    //             ref_no: item.ref_no ? item.ref_no : "",
    //             transaction_date: item.transaction_date,
    //             txIndex: index,
    //             type: item?.type ? item.type : "refund",
    //             balance : item?.balance ? item.balance : 0
    //           };
    //           // body.txIndex = index
    //           allTx.push(body);
    //         });
    //         //console.log(allTx)
    //         const startIndex = details.skip;
    //         const endIndex = startIndex + details.limit;
    //         const reversed = allTx.sort(
    //           (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
    //         );
    //         const paginatedTransactions = reversed.slice(startIndex, endIndex);
  
    //         return mapper.responseMappingWithData(
    //           usrConst.CODE.Success,
    //           usrConst.MESSAGE.Success,
    //           paginatedTransactions
    //         );
    //     }else if(details.type == "chargeback"){
    //           settlements.map((item, index) => {
    //             let body = {
    //               amount: item.amount,
    //               feePercentage: item?.feePercentage ? item?.feePercentage : 0,
    //               netFees: item.feeCharged ? item.feeCharged : 0,
    //               netVolume: item.amountSettled ? item.amountSettled : 0,
    //               ref_no: item.ref_no ? item.ref_no : "",
    //               transaction_date: item.transaction_date,
    //               txIndex: index,
    //               type: item?.type ? item.type : "chargeback",
    //               balance : item?.balance ? item.balance : 0
    //             };
    //             // body.txIndex = index
    //             allTx.push(body);
    //           });
    //           //console.log(allTx)
    //           const startIndex = details.skip;
    //           const endIndex = startIndex + details.limit;
    //           const reversed = allTx.sort(
    //             (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
    //           );
    //           const paginatedTransactions = reversed.slice(startIndex, endIndex);
    
    //           return mapper.responseMappingWithData(
    //             usrConst.CODE.Success,
    //             usrConst.MESSAGE.Success,
    //             paginatedTransactions
    //           );
    //     }else if(details.type == "rolling_reserve"){
    //       settlements.map((item, index) => {
    //         let body = {
    //           amount: item.amount,
    //           ref_no: item.ref_no ? item.ref_no : "",
    //           transaction_date: item.transaction_date,
    //           txIndex: index,
    //           type: item?.type ? item.type : "rolling_reserve",
    //           balance : item?.balance ? item.balance : 0
    //         };
    //         // body.txIndex = index
    //         allTx.push(body);
    //       });
    //       //console.log(allTx)
    //       const startIndex = details.skip;
    //       const endIndex = startIndex + details.limit;
    //       const reversed = allTx.sort(
    //         (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
    //       );
    //       const paginatedTransactions = reversed.slice(startIndex, endIndex);

    //       return mapper.responseMappingWithData(
    //         usrConst.CODE.Success,
    //         usrConst.MESSAGE.Success,
    //         paginatedTransactions
    //       );
    //     }else if(details.type == "misc"){
    //       settlements.map((item, index) => {
    //         let body = {
    //           amount: item.amount,
    //           ref_no: item.ref_no ? item.ref_no : "",
    //           transaction_date: item.transaction_date,
    //           txIndex: index,
    //           type: item?.type ? item.type : "misc",
    //           balance : item?.balance ? item.balance : 0
    //         };
    //         // body.txIndex = index
    //         allTx.push(body);
    //       });
    //       //console.log(allTx)
    //       const startIndex = details.skip;
    //       const endIndex = startIndex + details.limit;
    //       const reversed = allTx.sort(
    //         (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
    //       );
    //       const paginatedTransactions = reversed.slice(startIndex, endIndex);

    //       return mapper.responseMappingWithData(
    //         usrConst.CODE.Success,
    //         usrConst.MESSAGE.Success,
    //         paginatedTransactions
    //       );

    // }else{

    // }

  }else{
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid apiKey");
  }
} catch(error){
  return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
}
}


const {createSettlementCsvByDate} = require("../utils/settlementCsv")


async function downloadSettlementCsvByDateAndType(details) {
  try{
    const response = await validateRequest(details)
    if(response == true){
      const query = {
        emailId: details.emailId,
      };
      const merchant = await User.findOne(query);
      if (!merchant) {
        return mapper.responseMapping(
          usrConst.CODE.INTRNLSRVR,
          "User not found"
        );
      }

      // async function createSettlementCsvByDate(details)
      // const {uuid,name,start_date=null,end_date=null,type,call,merchant_balance} = details

      const data = {
        uuid :String(merchant._id),
        name: merchant.business_name || "",
        start_date: details.start_date || null,
        end_date : details.end_date  || null,
        type:details.type || 'all',
        call:'user',
        merchant_balance : merchant.balance || 0
      }

      const response = await createSettlementCsvByDate(data)

      if(response === false){
        return mapper.responseMapping(usrConst.CODE.BadRequest, "Unable to download csv, Please try after sometime");
      }else {
        return mapper.responseMappingWithData(
          usrConst.CODE.Success,
          usrConst.MESSAGE.Success,
          response
        );
      }



     
  }else{
    return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid apiKey");
  }
} catch(error){
  return mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid details");
}
}



module.exports = {
  downloadSettlementCsvByDateAndType,
  getSettlementByType,
  
  register,

  login,

  forgotPassword,

  setNewPassword,

  confirmOtp,

  sendPaymentRequest,

  getAllUserTransactions,

  sendPayinRequest,

  resetPassword,

  getAllUsersTransactions,

  getBazorpayPaymentStatus,

  updateProfile,

  updateTransaction,

  getProfileData,

  getPayinStatus,

  getPinwalletPayinStatus,

  updateCallbackUrl,

  updateRedirectUrl,


  getVolumes,

  getDataByUtr,

  getTransactionsUser,

  getTransactionsByDate,

  getTransactionsByStatus,

  fetchPayinStatus,

  getEncryptionKey,

  getAllUserSettlements,

  getAllTransactionWithSuccessStatus,

  sendPayinRequestCollect,

  validateRequest,

  sendPayinRequestPage,

  getTransactionsByStatusAndDate,

  updatePayoutCallbackUrl,

  getAllUserTopups,

  sendPayinRequestHosted,

  sendSignUpOtp,

  signUpWithOtp,

  downloadCsvForMerchant,

  downloadCsvForMerchantWithStatus,

  downloadCsvForMerchantByDate,

  downloadCsvForMerchantByDateWithStatus,

  downloadSettlementCsvForMerchantByDate,

  updateDeveloperUrls
};
