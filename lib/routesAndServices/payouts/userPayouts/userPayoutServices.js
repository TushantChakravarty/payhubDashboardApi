const dao = require('./userPayoutsDao')
const usrConst = require('../../utils/userConstants')
const mapper = require('../../utils/userMapper');
const appUtils = require('../../../appUtils');
const PayoutDao = require("../payoutsDao")
const usrDao = require('../../user/userDao')
async function validateRequest(details) {
    let query = {
      emailId: details.emailId,
    };
    return usrDao.getUserDetails(query).then(async (userExists) => {
      if (userExists) {
        const decryptedKey = appUtils.decryptText(details.apiKey);
        console.log("validate decrypted key", decryptedKey);
        if (decryptedKey == userExists.apiKey) {
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
         return dao.getAdminDetails(query)
         .then((userDetails)=>{
 
             if(userDetails)
             {
                 console.log(userDetails)
                 return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, {
                     balance:userDetails.payoutsBalance
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
 
 async function getMerchantPayoutData(details) {
     // console.log(details)
     if(details&&details?.emailId)
     {
    return validateRequest(details)
    .then((response)=>{
      if(response==true)
      {
          let query ={
              emailId:details.emailId
          }
          return usrDao.getUserDetails(query)
          .then((userDetails)=>{
  
              if(userDetails)
              {
                  console.log(userDetails)
                  let response ={
                     last24hr:userDetails.payoutsData.last24hr,
                     yesterday:userDetails.payoutsData.yesterday,
                     successRate:(userDetails.payoutsData.last24hrSuccess/userDetails.payoutsData.last24hrTotal)*100,
                     last24hrSuccess:userDetails.payoutsData.last24hrSuccess,
                     balance:userDetails.payoutBalance,

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

  async function getAllMerchantPayouts(details) {
    // console.log(details)
    if(details&&details?.emailId&&details?.limit&&details?.skip>=0)
    {
   return validateRequest(details)
   .then((response)=>{
     if(response==true)
     {
         let query ={
             emailId:details.emailId,
             limit:details?.limit,
             skip:details?.skip
         }
         return dao.getAllMerchantPayouts(query)
         .then((transactions)=>{
 
             if(transactions)
             {
                
                 return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, transactions)
                 
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

 async function getMerchantPayoutByUtr(details) {
  // console.log(details)
  if(details&&details?.emailId&&details?.utr)
  {
 return validateRequest(details)
 .then((response)=>{
   if(response==true)
   {
       let query ={
           emailId:details.emailId,
           id:details?.utr
       }
       return dao.getPayoutDataById(query)
       .then((transactions)=>{

           if(transactions)
           {
              
               return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, transactions)
               
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


async function getAllPayoutsDataMerchant(details) {
  // console.log(details)
  if(details &&details?.start_date&& details?.end_date&& details?.status&&details?.emailId)  {
 return validateRequest(details)
 .then((response)=>{
   if(response==true)
   {
    
      if(details?.status=="all"&&details?.start_date&&details?.end_date&&details?.emailId)
       {

         return dao.getPayoutsByDateMerchant(details?.start_date, details?.end_date,details?.emailId)
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
        if(details?.status=="success"||details?.status=="failed"||details?.status=="pending"&&details?.start_date=="all"&&details?.end_date=="all"&&details?.emailId&&
        details?.limit>0&& details?.skip>=0
        )
       {

         return dao.getPayoutsByStatusMerchant(details?.emailId,details?.status, details?.limit, details?.skip)
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
          return dao.getPayoutsByDateWithStatusMerchant(details?.start_date, details?.end_date,details?.emailId,details?.status)
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
      return PayoutDao
        .getPayoutLogs(details.emailId, details)
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

 
  module.exports={
    getMerchantPayoutData,

    getAllMerchantPayouts,

    getMerchantPayoutByUtr,

    getAllPayoutsDataMerchant,

    getMerchantPayoutLogs
  }