const usrConst = require('../utils/userConstants');
const mapper = require('../utils/userMapper');
// Define custom validators
const validators = {
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  validatePhone: (phone) => {
    // Phone number validation logic (customize as per your requirements)
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  },
  validateUPI: (upiId) => {
    // UPI ID validation logic (customize as per your requirements)
    // const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    // return upiRegex.test(upiId);
    return typeof upiId === 'string' && upiId.trim().length > 0;
  },
  // Add more custom validators as needed
  validateAmount: (amount) => {
    // Amount validation logic (customize as per your requirements)
    return typeof amount === 'number' && amount > 0;
  },
  validateAccountNumber: (accountNumber) => {
    // Account number validation logic (customize as per your requirements)
    const accountNumberRegex = /^[0-9]{11,}$/;
    return accountNumberRegex.test(accountNumber);
  },
  validateIFSC: (ifscCode) => {
    // IFSC code validation logic (customize as per your requirements)
    const ifscRegex = /^[A-Za-z]{4}[0][\d]{6}$/;
    return ifscRegex.test(ifscCode);
  },
  validateName: (name) => {
    // Name validation logic (customize as per your requirements)
    return typeof name === 'string' && name.trim().length > 0;
  }
  // Add more custom validators as needed
};

// Validate the provided data
function validateData(req,res,next) {
  // const errors = [];
  const data = req.body
 

  if(data.method === "upi"){
    // if (!validators.validateEmail(data.emailId)) {
    //   return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid emailID"))
    // }
    if (!validators.validateAmount(data.amount)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid Amount"))
    }
    if (!validators.validateName(data.customer_name)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid customer name"))
    }
    if (!validators.validateEmail(data.customer_email)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid customer email"))
    }
    // Validate phone number
    if (!validators.validatePhone(data.customer_phone)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid customer phone"))
    }
    // Validate UPI ID
    if (!validators.validateUPI(data.customer_upiId)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid customer upi"))
    }
    if (!validators.validateName(data.account_name)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid account name"))
    }
    if (!validators.validateName(data.customer_address)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid customer address"))
    }
  }
  else if(data.method === "bank"){
    // if (!validators.validateEmail(data.emailId)) {
    //   return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid customer emailId"))
    // }
    if (!validators.validateAmount(data.amount)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid amount"))
    }
    if (!validators.validateName(data.customer_name)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid customer name"))
    }
    if (!validators.validateEmail(data.customer_email)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid customer email"))
    }
    // Validate phone number
    if (!validators.validatePhone(data.customer_phone)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid customer phone"))
    }
    if (!validators.validateAccountNumber(data.account_number)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid account number"))
    }
    if (!validators.validateIFSC(data.bank_ifsc)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid ifsc code"))
    }
    if (!validators.validateName(data.account_name)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid account name"))
    }
    if (!validators.validateName(data.bank_name)) {
      return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid bank name"))
    }
  }else{
    return res.send(mapper.responseMapping(usrConst.CODE.BadRequest, "Invalid method.."))
  }

  next();
}

// Example usage:
// const data = {
//   "emailId": "tushant2907@gmail.com",
//   "amount": 101,
//   "customer_name": "tushant",
//   "customer_email": "tushant029@gmail.com",
//   "customer_phone": "9340079982",
//   "account_number": "20323508372",
//   "customer_upiId": "success@upi",
//   "bank_ifsc": "SBIN0007258",
//   "account_name": "tushant chakraborty",
//   "bank_name": "state bank of india",
//   "customer_address": "xyz"
// };

// const validationErrors = validateData(data);
// if (validationErrors.length === 0) {
//   console.log("Data is valid");
// } else {
//   console.log("Validation errors:", validationErrors);
//}

module.exports ={
  validateData
}