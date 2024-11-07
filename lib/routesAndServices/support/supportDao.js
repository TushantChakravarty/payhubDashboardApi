let BaseDao = require("../../dao/BaseDao");
const constants = require("../../constants");
const user = require("../../generic/models/userModel");
const usrDao = new BaseDao(user);
const agentModel = require("../../generic/models/agentModal")
const agentDao = new BaseDao(agentModel)


function createUser(obj) {

  let userObj = new agentModel(obj)
  return agentDao.save(userObj)
}


function getAgentDetails(query) {
    

  return agentDao.findOne(query)
}

function updateProfile(query, updateDetails) {

  let update = {}
  update['$set'] = updateDetails

  let options = {
      new: true
  }
  
  return agentDao.findOneAndUpdate(query, update, options)
}

async function getAllMerchantsData() {
  const users = usrDao.aggregate([
    {
      $project: {
        _id: 0,
        emailId:"$emailId",
        apiKey:"$apiKey",
        businessName: "$business_name", // Use the correct field name in your collection
      },
    },
  ]);

  // Extract the merchant names from the result
 
  return users;
}

module.exports ={
    getAllMerchantsData,

    getAgentDetails,

    createUser,

    updateProfile
}