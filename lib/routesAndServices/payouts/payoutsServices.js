const dao = require('./payoutsDao')
const usrConst = require('../utils/userConstants')
const mapper = require('../utils/userMapper');
const { decryptText } = require('../../appUtils');
const service = require('../user/userService');

const { pinwalletPayout } = require('../../gateways/pinwallet');
const { createPaytmePayoutRequest } = require('../../gateways/paytme');
const { cashfreepayouttest, cashfreePayout, cashfreePayoutBank } = require('../../gateways/cashfree');
const { createInstantPayoutBankRequest } = require('../../gateways/kwikpaisaservices');
const { fetchPayhubData } = require('../utils/payhubDao');
async function validateRequest(details) {
    let query = {
      emailId: details.emailId,
    };
    return dao.getAdminDetails(query).then(async (userExists) => {
      //console.log(userExists)
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

  

async function getPayoutBalance(details) {
   // console.log(details)
   if(details)
   {
  return validateRequest(details)
  .then((response)=>{
    if(response==true)
    {
        let query ={
            emailId:details.emailId
        }
        return fetchPayhubData()
        .then((userDetails)=>{

            if(userDetails)
            {
                console.log(userDetails)
                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, {
                    balance:userDetails.payouts.balance
                })
                
            }else{
                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
                
            }
        })
    }  else if (response == false) {
        return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
      } else {
        return response;
      }
    
  })
} else {
    return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
  }
    
}

async function getPayoutData(details) {
    // console.log(details)
    if(details)
    {
   return validateRequest(details)
   .then((response)=>{
     if(response==true)
     {
         let query ={
             emailId:details.emailId
         }
         return fetchPayhubData()
         .then((userDetails)=>{
 
             if(userDetails)
             {
                 console.log(userDetails)
                 let response ={
                    last24hr:userDetails.payouts.last24hr,
                    yesterday:userDetails.payouts.yesterday,
                    successRate:(userDetails.payouts.last24hrSuccess/userDetails.payouts.last24hrTotal)*100,
                    last24hrSuccess:userDetails.payouts.last24hrSuccess,

                 }
                 return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, response)
                 
             }else{
                 return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
                 
             }
         })
     }  else if (response == false) {
         return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
       } else {
         return response;
       }
     
   })
 } else {
     return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
   }
     
 }

 async function sendPaymentRequest(details) {
    return await service.validateRequest(details).then(async (response) => {
      console.log(response);
      // return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, response)
  
      if (response == true) {
        //return mapper.responseMappingWithData(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError, 'Service under development. please contact admin for more details')
        let query = {
          emailId: details.emailId,
        };
        //console.log(details);
        return dao.getUserDetails(query).then(async (userData) => {
          const balance = userData.payoutBalance;
          //console.log("balance", balance);
          if (Number(balance) > Number(details.amount)) {
            // let updatedBalance = balance - Number(details.amount)
            // updateObj.balance = updatedBalance
            // dao.updateProfile(query,updateObj)
            let gateway = userData.payoutGateway;
            if(details?.method=='upi')
            {
              if(gateway=="cashfree")
            {
              return cashfreePayout(details,dao,mapper,userData,usrConst,gateway)
            }
            // if(gateway=="kwikpaisa")
            // {
            //   return createInstantPayoutBankRequest(details,dao,mapper,userData,usrConst,gateway)
            // }
            else{
              return mapper.responseMappingWithData(
                usrConst.CODE.BadRequest,
                usrConst.MESSAGE.TransactionFailure,
                usrConst.MESSAGE.internalServerError
              );
            }
            }else if(details?.method=='bank'){

            
            if (gateway == "pinwallet") {
             
              const response = await pinwalletPayout(details);
              const txId = Math.floor(Math.random() * 90000) + 10000;
              const timeElapsed = Date.now();
              const today = new Date(timeElapsed);
              const updateDetails ={
                uuid:userData._id,
                transactionId: txId,
                merchant_ref_no: "12345xyz",
                amount: "1000",
                currency: "inr",
                country: "india",
                status: "pending",
                transaction_type: "payout",
                transaction_date: today.toISOString(),
                gateway: gateway,
                utr: "12345xyz",
                phone: "1989898989",
                customer_name: "rahul",
                upiId: "",
                account_number: "12345xyz",
                account_name: "tushant",
                ifsc_code:"sbin0007258",
                bank_name:"sbi",
                customer_email: "xyz@email",
                business_name: userData.business_name
              }
             await dao.createTransaction(updateDetails)
              if(response.success)
              {
  
                return mapper.responseMappingWithData(
                  usrConst.CODE.Success,
                  usrConst.MESSAGE.Success,
                  "Payment request submitted"
                  );
                }else{
                  return mapper.responseMappingWithData(
                    usrConst.CODE.INTRNLSRVR,
                    usrConst.MESSAGE.TransactionFailure,
                    "Unable to process transaction at the moment"
                  );
                }
            }
            else if(gateway=="paytme")
            {
                return createPaytmePayoutRequest(details,dao,mapper,userData,usrConst,gateway)
            }
            else if(gateway=="cashfree")
            {
                return cashfreePayoutBank(details,dao,mapper,userData,usrConst,gateway)
            }
            if(gateway=="kwikpaisa")
            {
              return createInstantPayoutBankRequest(details,dao,mapper,userData,usrConst,gateway)
            }
           
            else{
              return mapper.responseMappingWithData(
                usrConst.CODE.BadRequest,
                usrConst.MESSAGE.TransactionFailure,
                usrConst.MESSAGE.internalServerError
              );
            }
          }else{
            return mapper.responseMappingWithData(
              usrConst.CODE.BadRequest,
              usrConst.MESSAGE.InvalidDetails,
              'invalid method'
            );
          }
          } else {
            // let updatedBalance = Number(details.amount)
            // updateObj.balance = updatedBalance
            // dao.updateProfile(query,updateObj)
            return mapper.responseMappingWithData(
              usrConst.CODE.BadRequest,
              usrConst.MESSAGE.TransactionFailure,
              "You don't have enough balance to process this transaction"
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

  async function getAllPayoutTransactions(details) {
    //console.log(details)
    if(details&&details.limit&&details.skip>=0 )
    {
   return validateRequest(details)
   .then((response)=>{
     if(response==true)
     {
         let query ={
            limit:Number(details.limit),
            skip:Number(details.skip)
         }
         return dao.getAllTransactionsPayout(query)
         .then((userDetails)=>{
 
             if(userDetails)
             {
                 console.log(userDetails)
                
                 return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, userDetails?userDetails:[])
                 
             }else{
                 return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
                 
             }
         })
     }  else if (response == false) {
         return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
       } else {
         return response;
       }
     
   })
 } else {
     return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
   }
     
 }

 async function getAllPayoutTransactionsMerchant(details) {
  //console.log(details)
  if(details&&details.limit&&details.skip>=0 &&details?.email_Id)
  {
 return validateRequest(details)
 .then((response)=>{
   if(response==true)
   {
       let query ={
          limit:Number(details.limit),
          skip:Number(details.skip),
          emailId:details?.email_Id
       }
       return dao.getAllMerchantPayouts(query)
       .then((userDetails)=>{
         
         if(userDetails)
         {
           // console.log(userDetails)
           
           return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, userDetails)
           
          }else{
            return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
            
          }
        })
   }  else if (response == false) {
       return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
     } else {
       return response;
     }
   
 })
} else {
   return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
 }
   
}
 async function getPayoutDataMerchant(details) {
  // console.log(details)
  if(details && details?.email_Id)
  {
 return validateRequest(details)
 .then((response)=>{
   if(response==true)
   {
       let query ={
           emailId:details.email_Id
       }
       return dao.getUserDetails(query)
       .then((userDetails)=>{

           if(userDetails)
           {
              // console.log(userDetails)
               let response ={
                  last24hr:userDetails.payoutsData.last24hr,
                  yesterday:userDetails.payoutsData.yesterday,
                  successRate:(userDetails.payoutsData.last24hrSuccess/userDetails.payoutsData.last24hrTotal)*100,
                  last24hrSuccess:userDetails.payoutsData.last24hrSuccess,
                  balance:userDetails.payoutBalance

               }
               return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, response)
               
           }else{
               return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
               
           }
       })
   }  else if (response == false) {
       return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
     } else {
       return response;
     }
   
 })
} else {
   return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
 }
   
}

async function getPayoutDataById(details) {
  // console.log(details)
  if(details&&details?.transactionId)
  {
 return validateRequest(details)
 .then((response)=>{
   if(response==true)
   {
       
       return dao.getPayoutDataById(details?.transactionId)
       .then((userDetails)=>{

           if(userDetails)
           {
              // console.log(userDetails)
               
               return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, userDetails)
               
           }else{
               return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
               
           }
       })
   }  else if (response == false) {
       return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
     } else {
       return response;
     }
   
 })
} else {
   return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
 }
   
}

async function getAllPayoutsData(details) {
  // console.log(details)
  if(details &&details?.start_date&& details?.end_date&& details?.status)
  {
 return validateRequest(details)
 .then((response)=>{
   if(response==true)
   {
       if(details?.status=="all"&&details?.start_date&&details?.end_date)
       {

         return dao.getPayoutsByDate(details?.start_date, details?.end_date)
         .then((userDetails)=>{
           
           if(userDetails)
           {
             // console.log(userDetails)
             
             return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, userDetails)
             
            }else{
              return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
              
            }
          })
        }
        else if(details?.status=="success"||details?.status=="failed"||details?.status=="pending"&&details?.start_date=="all"&&details?.end_date=="all"&&details?.limit>0&& details?.skip>=0)
       {

         return dao.getPayoutsByStatus(details?.status, details?.limit,details?.skip)
         .then((userDetails)=>{
           
           if(userDetails)
           {
             // console.log(userDetails)
             
             return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, userDetails)
             
            }else{
              return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
              
            }
          })
        }
        else if(details?.status=="success"||details?.status=="failed"||details?.status=="pending"&&details?.start_date&&details?.end_date)
        {
          return dao.getPayoutsByDateWithStatus(details?.start_date, details?.end_date,details?.status)
          .then((userDetails)=>{
            
            if(userDetails)
            {
              // console.log(userDetails)
              
              return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, userDetails)
              
             }else{
               return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
               
             }
           })
        }
        else{
          return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");

        }
   }  else if (response == false) {
       return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
     } else {
       return response;
     }
   
 })
} else {
   return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
 }
   
}

async function getAllPayoutsDataMerchant(details) {
  // console.log(details)
  if(details &&details?.start_date&& details?.end_date&& details?.status&&details?.email_Id)  {
 return validateRequest(details)
 .then((response)=>{
   if(response==true)
   {
    
      if(details?.status=="all"&&details?.start_date&&details?.end_date&&details?.email_Id)
       {

         return dao.getPayoutsByDateMerchant(details?.start_date, details?.end_date,details?.email_Id)
         .then((userDetails)=>{
           
           if(userDetails)
           {
             // console.log(userDetails)
             
             return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, userDetails)
             
            }else{
              return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
              
            }
          })
        }
        if(details?.status=="success"||details?.status=="failed"||details?.status=="pending"&&details?.start_date=="all"&&details?.end_date=="all"&&details?.email_Id&&
        details?.limit>0&& details?.skip>=0
        )
       {

         return dao.getPayoutsByStatusMerchant(details?.email_Id,details?.status, details?.limit, details?.skip)
         .then((userDetails)=>{
           
           if(userDetails)
           {
             // console.log(userDetails)
             
             return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, userDetails)
             
            }else{
              return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
              
            }
          })
        }
        else if(details?.status=="success"||details?.status=="failed"||details?.status=="pending"&&details?.start_date&&details?.end_date)
        {
          return dao.getPayoutsByDateWithStatusMerchant(details?.start_date, details?.end_date,details?.email_Id,details?.status)
          .then((userDetails)=>{
            
            if(userDetails)
            {
              // console.log(userDetails)
              
              return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, userDetails)
              
             }else{
               return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
               
             }
           })
        }
        else{
          return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");

        }
   }  else if (response == false) {
       return mapper.responseMapping(usrConst.CODE.FRBDN, "Invalid apiKey");
     } else {
       return response;
     }
   
 })
} else {
   return mapper.responseMapping(usrConst.CODE.BadRequest, "invalid details");
 }
   
}


async function getMerchantPayoutLogs(details) {
  return validateRequest(details).then((response) => {
    if (response == true) {
      return dao
        .getPayoutLogs(details.email_Id, details)
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

async function fetchPayoutStatus(details) {
  console.log(details);
  return service.validateRequest(details).then(async (response) => {
    if (response == true) {
      let query = {
        emailId: details.emailId,
      };
      if(!details?.transaction_id) 
      {
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
      const tx = await dao.getPayoutDataById(details.transaction_id);
      let txType = tx[0]?tx[0]:undefined
      if (txType) {
        console.log(txType);
        const respObject = {
          amount: txType.amount,
          transaction_id: txType.transaction_id || txType.transactionId,
          status: txType.status === "IN-PROCESS" ? "pending" :
                  txType.status === "fail" || txType.status === "failed" ? "failed" :
                  txType.status === "expired" ? "expired" :
                  txType.status,
          code: txType.status === "success" ? "00" :
                txType.status === "IN-PROCESS" ? "01" :
                txType.status === "failed" || txType.status === "fail" ? "02" :
                txType.status === "expired" ? "U69" : "03",
          description: txType.status === "success" ? "transaction success" :
                       txType.status === "IN-PROCESS" ? "transaction pending" :
                       txType.status === "failed" || txType.status === "fail" ? "Customer failed to complete transaction" :
                       txType.status === "expired" ? "Collect request expired" :
                       "Not found"
        };
        console.log('resp object',respObject)
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




module.exports ={
    getPayoutBalance,

    getPayoutData,

    sendPaymentRequest,

    getAllPayoutTransactions,

    getPayoutDataMerchant,

    getPayoutDataById,

    getAllPayoutsData,

    getAllPayoutsDataMerchant,

    getAllPayoutTransactionsMerchant,

    getMerchantPayoutLogs,

    fetchPayoutStatus
  }