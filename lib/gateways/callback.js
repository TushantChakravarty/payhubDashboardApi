const fetch = require("node-fetch");

async function callbackPayin (details,url){
    const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS', 
                 },
        body: JSON.stringify(details)
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
    callbackPayin
}