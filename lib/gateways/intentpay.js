const fetch = require("node-fetch");

async function intentPayPayin (details){
    const referenceId = Math.floor(Math.random() * 1000000000);
   console.log(referenceId)
    const response = await fetch('https://api.intentpay.in/api/v1/merchants/transaction/64fd84bf0992eb79bfa3022b/all/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS', 
          'merchantid':'64fd84bf0992eb79bfa3022b',
          "merchantsecret":"rb8G39DHO2ks1SH"
         // 'IPAddress':'103.176.136.226',
         // Authentication: 'Bearer {eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTkwMDA4NjYzIiwibmFtZWlkIjoiMTQ3IiwiZW1haWwiOiJpbmZvQHdlcm5lci5hc2lhIiwianRpIjoiOTM0ODIyYzktNjk0Ny00MTJhLWE2ZTgtZmRmYzNiMzdkYjMyIiwiZXhwIjoxNjk1ODIyMjgzLCJpc3MiOiJFenVsaXhiMmIiLCJhdWQiOiJFenVsaXhiMmIifQ.VdcZVGxitNcqJ_sjWMGQ2uU7P24HIVQkAi_TjyFD9zM}'
        },
        body: JSON.stringify({
            "amount" : "100",
            "userContactNumber" : "9340079982",
            "merchantOrderId": referenceId
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
    intentPayPayin
}