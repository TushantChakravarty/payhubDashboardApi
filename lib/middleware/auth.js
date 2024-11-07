const jwt = require("jsonwebtoken");
const config =process.env.JWTSECRET;

const verifyToken = (Token) => {
  const token = Token
    //console.log(token)
  if (!token) {
   console.log('no token')
  }
  try {
    const decoded = jwt.verify(token, config);
    if(decoded!=undefined)
    return {decoded:decoded}
  else 
  return {decoded:undefined}

  } catch (err) {
    console.log(err)
    return {decoded:undefined}

  }
  
};

module.exports =  {
  verifyToken
}