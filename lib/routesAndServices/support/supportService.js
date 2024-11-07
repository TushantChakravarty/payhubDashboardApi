/*#################################            Load modules start            ########################################### */
const adminDao = require("../admin/adminDao");
const usrConst = require("../utils/userConstants");
const mapper = require("../utils/userMapper");
const dao = require("./supportDao")
const appUtil = require('../../appUtils');
const { getTransactionGateway, getTransaction } = require("../transactionsDao/TransactionDao");
const userConstants = require("../utils/userConstants");
// const adminDao = require("./adminDao");

const { updateTransactionStatus } = require("../utils/transactionDao");

async function validateRequest(details) {
  let query = {
    emailId: details.emailId,
  };
  return adminDao.getUserDetails(query).then(async (userExists) => {
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

async function validateAgentRequest(details) {
  let query = {
    emailId: details.emailId,
  };
  
  return dao.getAgentDetails(query).then(async (userExists) => {
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

function addAgent(details) {
  if (!details || Object.keys(details).length == 0) {
    return mapper.responseMapping(
      usrConst.CODE.BadRequest,
      usrConst.MESSAGE.InvalidDetails
    );
  } else {
    return validateRequest(details).then((response) => {
      if (response == true) {
        if (details.emailId) {
          let query = {
            emailId: details.email_Id,
          };
    
          return dao
            .getAgentDetails(query)
            .then(async (userExists) => {
              if (userExists) {
                return mapper.responseMapping(
                  usrConst.CODE.BadRequest,
                  usrConst.MESSAGE.EmailAlreadyExists
                );
              } else {
               
                let password = details.password
                let convertedPass = await appUtil.convertPass(password);
                details.password = convertedPass;
                const apiKey = Math.random().toString(36).slice(2);
                console.log(apiKey);
    
                details.apiKey = apiKey;
                details.emailId = details.email_Id
                details.isVerified = false
    
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
     else if (response == false) {
      return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
    } else {
      return mapper.responseMapping(usrConst.CODE.BadRequest, response);
    }
    })
   
  }
}

async function verifyAgent(details) {
  return validateRequest(details)
      .then((response) => {
          if (response == true) {
              const query = {
                  emailId: details.email_Id
              }

              const updateObj ={
                isVerified:details.isVerified
              }

              return dao.updateProfile(query,updateObj).then((userUpdated) => {
                  if (userUpdated) {
                      // console.log('success', userUpdated)

                      return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, 'updated')


                  } else {

                      console.log("Failed to update ")
                      return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                  }
              })
          }
          else if (response == false) {
              return mapper.responseMapping(usrConst.CODE.FRBDN, 'Invalid apiKey')
          } else {
              return mapper.responseMapping(usrConst.CODE.BadRequest, response)
          }
      })
}

async function getAllMerchants(details) {
    return validateRequest(details).then((response) => {
      if (response == true) {
        return dao
          .getAllMerchantsData()
          .then((merchants) => {
            if (merchants) {
              //console.log('success', updated)
  
              return mapper.responseMappingWithData(
                usrConst.CODE.Success,
                usrConst.MESSAGE.Success,
                merchants
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

  async function getTransactionGatewayData(details) {
    return validateRequest(details).then((response) => {
      if (response == true) {
        if(!details?.txId)
        return mapper.responseMapping(usrConst.CODE.BadRequest, userConstants.MESSAGE.InvalidDetails);
        const txId = details?.txId
        return getTransactionGateway(txId)
          .then((gateway) => {
            if (gateway) {
              //console.log('success', updated)
  
              return mapper.responseMappingWithData(
                usrConst.CODE.Success,
                usrConst.MESSAGE.Success,
                {gateway:gateway.gateway,
                  status:gateway.status
                }
              );
            } else {
              console.log("Failed to get data");
              return mapper.responseMapping(
                usrConst.CODE.INTRNLSRVR,
                {gateway:null}
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

  async function resolveQuery(details) {
    return validateAgentRequest(details).then((response) => {
      if (response == true) {
        console.log('details',details)
        if(!details?.txId ||!details?.status)
        return mapper.responseMapping(usrConst.CODE.BadRequest, userConstants.MESSAGE.InvalidDetails);
        if (
          details?.status !== "success" &&
          details?.status !== "failed" &&
          details?.status !== "refund" &&
          details?.status !== "charge-back" &&
          details?.status !== "pending"
        ) {
          return mapper.responseMapping(usrConst.CODE.BadRequest, userConstants.MESSAGE.InvalidDetails);
        }
        const txId = details?.txId
        return getTransaction(txId)
          .then(async (tx) => {
            if (tx) {
              //console.log('success', updated)
              let updateObj ={
                status:details?.status
              }
             await updateTransactionStatus(txId,updateObj)
            return await adminDao.updateTransactions(txId,txId,updateObj)
             .then((userUpdated)=>{
              if(userUpdated)
              {
 
                return mapper.responseMappingWithData(
                  usrConst.CODE.Success,
                  usrConst.MESSAGE.Success,
                  "Transaction Updated"
                  );
                 }else{
 
                   return mapper.responseMappingWithData(
                     usrConst.CODE.INTRNLSRVR,
                     usrConst.MESSAGE.internalServerError,
                     "Transaction Update failed"
                     );
                   }
             })
             //console.log(txUpdated)
             //Promise.all([txUpdated,userUpdated])
            
            } else {
              console.log("Failed to get data");
              return mapper.responseMapping(
                usrConst.CODE.INTRNLSRVR,
                'Transaction not found'
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

module.exports ={
    getAllMerchants,

    addAgent,

    verifyAgent,

    getTransactionGatewayData,

    resolveQuery
}
