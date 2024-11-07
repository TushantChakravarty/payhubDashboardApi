const fetch = require("node-fetch");
const { getTransactionsByStatusAndGateway } = require("../routesAndServices/transactionsDao/TransactionDao");
async function generateTokenPaythrough (){
  //   const referenceId = Math.floor(Math.random() * 1000000000);
  //  console.log(referenceId)
  console.log(process.env.PAYTHROUGH_CLIENT_ID,
     process.env.PAYTHROUGH_CLIENT_SECRET
  )
    const response = await fetch('https://upi.paythrough.in/payments/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS', 
         
         // 'IPAddress':'103.176.136.226',
         // Authentication: 'Bearer {eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTkwMDA4NjYzIiwibmFtZWlkIjoiMTQ3IiwiZW1haWwiOiJpbmZvQHdlcm5lci5hc2lhIiwianRpIjoiOTM0ODIyYzktNjk0Ny00MTJhLWE2ZTgtZmRmYzNiMzdkYjMyIiwiZXhwIjoxNjk1ODIyMjgzLCJpc3MiOiJFenVsaXhiMmIiLCJhdWQiOiJFenVsaXhiMmIifQ.VdcZVGxitNcqJ_sjWMGQ2uU7P24HIVQkAi_TjyFD9zM}'
        },
        body: JSON.stringify({
            
                "client_id": `${process.env.PAYTHROUGH_CLIENT_ID}`,
                "client_secret": `${process.env.PAYTHROUGH_CLIENT_SECRET}`
              
          })  
      })
         .then(resp => resp.json())
         .then(json =>{
           console.log(json)
           if(json.access_token)
           return json.access_token
          return false
          })
         .catch((error)=>{
          console.log(error)
         })
      return response
}


async function getAllPendinTransactionsPaythrough()
{
    //console.log('hit')
    const transactions = await getTransactionsByStatusAndGateway('IN-PROCESS',"paythrough")
    //console.log(transactions)
    return transactions
}



async function paythroughyPayin (details){
    const referenceId = Math.floor(Math.random() * 1000000000);
   console.log(referenceId)
    const response = await fetch('https://upi.paythrough.in/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS', 
         
         // 'IPAddress':'103.176.136.226',
         // Authentication: 'Bearer {eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTkwMDA4NjYzIiwibmFtZWlkIjoiMTQ3IiwiZW1haWwiOiJpbmZvQHdlcm5lci5hc2lhIiwianRpIjoiOTM0ODIyYzktNjk0Ny00MTJhLWE2ZTgtZmRmYzNiMzdkYjMyIiwiZXhwIjoxNjk1ODIyMjgzLCJpc3MiOiJFenVsaXhiMmIiLCJhdWQiOiJFenVsaXhiMmIifQ.VdcZVGxitNcqJ_sjWMGQ2uU7P24HIVQkAi_TjyFD9zM}'
        },
        body: JSON.stringify({
            "access_token": details.access_token,
            "token_type": "bearer",
            "user": {
            "first_name": details.username,
            "last_name": "payhub",
            "email": details.customer_email,
            "mobile_number": details.phone,
            "amount": details.amount,
            "upi_id": details.upiId
            }
          })  
      })
         .then(resp => resp.json())
         .then(json =>{
           //console.log(json)
           if(json)
           return json
          return false
          })
         .catch((error)=>{
          console.log(error)
         })
      return response
}
async function paythroughyPayinIntent (details){
  //const referenceId = Math.floor(Math.random() * 1000000000);
// console.log(referenceId)
  const response = await fetch('https://upi.paythrough.in/payments/intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS', 
       
       // 'IPAddress':'103.176.136.226',
       // Authentication: 'Bearer {eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTkwMDA4NjYzIiwibmFtZWlkIjoiMTQ3IiwiZW1haWwiOiJpbmZvQHdlcm5lci5hc2lhIiwianRpIjoiOTM0ODIyYzktNjk0Ny00MTJhLWE2ZTgtZmRmYzNiMzdkYjMyIiwiZXhwIjoxNjk1ODIyMjgzLCJpc3MiOiJFenVsaXhiMmIiLCJhdWQiOiJFenVsaXhiMmIifQ.VdcZVGxitNcqJ_sjWMGQ2uU7P24HIVQkAi_TjyFD9zM}'
      },
      body: JSON.stringify({
          "access_token": details.access_token,
          "token_type": "bearer",
          "user": {
          "first_name": details.username,
          "last_name": "payhub",
          "email": details.customer_email,
          "mobile_number": details.phone,
          "amount": details.amount,
          "upi_id": details.upiId
          }
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
async function fetchPaythroughStatus (details){
  //console.log(details)
  const token = await generateTokenPaythrough()
  const response = await fetch('https://upi.paythrough.in/payments/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS', 
       
       // 'IPAddress':'103.176.136.226',
       // Authentication: 'Bearer {eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTkwMDA4NjYzIiwibmFtZWlkIjoiMTQ3IiwiZW1haWwiOiJpbmZvQHdlcm5lci5hc2lhIiwianRpIjoiOTM0ODIyYzktNjk0Ny00MTJhLWE2ZTgtZmRmYzNiMzdkYjMyIiwiZXhwIjoxNjk1ODIyMjgzLCJpc3MiOiJFenVsaXhiMmIiLCJhdWQiOiJFenVsaXhiMmIifQ.VdcZVGxitNcqJ_sjWMGQ2uU7P24HIVQkAi_TjyFD9zM}'
      },
      body: JSON.stringify({
          "access_token": token,
          "token_type": "bearer",
          "order": {
            "order_id": details.merchant_ref_no,
            "payment_mode": "UPI",
            "transaction_id": details.transactionId
          }
        })  
    })
       .then(resp => resp.json())
       .then(json =>{
         //console.log(json)
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
    paythroughyPayin,
    generateTokenPaythrough,
    paythroughyPayinIntent, 
    fetchPaythroughStatus,
    getAllPendinTransactionsPaythrough,

}