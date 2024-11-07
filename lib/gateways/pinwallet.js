const fetch = require("node-fetch");

async function pinwalletPayin (details,token){
    const referenceId = Math.floor(Math.random() * 1000000000);
   console.log('my token', token)
    const response = await fetch('https://app.pinwallet.in/api/DyupiV2/V4/GenerateUPI', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS', 
          'AuthKey':'edb7293b7a983d8b330a52a2ef139b8ee8054ac832db536491d197fee0184667',
          'IPAddress':'103.176.136.226',
          Authentication: `Bearer {${token}}`
                },
        body: JSON.stringify({
            "Name":details.username,
            "ReferenceId":referenceId,
            "Email":details.emailId,
            "Phone":details.phone,
            "amount":details.amount 
          })  
      })
         .then(resp => resp.json())
         .then(json =>{
           console.log(json)
           if(json)
           return json
          return false
          })
         .catch((error)=>{
          console.log(error)
         })
      return response
}
async function generatePinWalletToken (details){
  const referenceId = Math.floor(Math.random() * 1000000000);
 console.log(referenceId)
  const response = await fetch('https://app.pinwallet.in/api/token/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS', 
        'AuthKey':'edb7293b7a983d8b330a52a2ef139b8ee8054ac832db536491d197fee0184667',
      },
      body: JSON.stringify({
         
          "userName":'9990008663',
         "password":'edb7293b7a983d8b330a52a2ef139b8ee8054ac832db536491d197fee0184667'
        })  
    })
       .then(resp => resp.json())
       .then(json =>{
         console.log(json)
         if(json)
         return json
        return false
        })
       .catch((error)=>{
        console.log(error)
       })
    return response
}

async function pinwalletPayout (){
  const response = await fetch('https://app.huntood.com/api/payout/v1/dotransaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AuthKey':'895c827a4c23c96bddede4c7ee1908220aad7371d922949287d22574329d29bd',
        'IPAddress':'110.224.200.0',
      },
      body: JSON.stringify({
        "BenificiaryAccount":"20323508372",
        "BenificiaryIfsc":"SBIN0007258",
        "BenificiaryName":"tushant",
        "amount":100,
        "TransactionId":"9878879887",
        "Latitude":"21.00",
        "Longitude":"81.55"
        })  
    })
    .then(resp => resp.json())
       .then(json =>{
         console.log(json)
         
         if(json)
         return json
        return false
        })
       .catch((error)=>{
        console.log(error)
       })
    return response
}

module.exports={
    pinwalletPayin,
    pinwalletPayout,
    generatePinWalletToken
}