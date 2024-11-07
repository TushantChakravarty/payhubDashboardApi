const STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};



const DB_MODEL_REF = {
  USERS: 'users',
  MARKETDATA:'marketdata',
  MARKETDATA2:'marketdata2'
  
};


const CODE = {
  FRBDN: 403,
  INTRNLSRVR: 500,
  Success: 200,
  DataNotFound: 404,
  BadRequest: 400,
};

module.exports = Object.freeze({
  TOKEN_EXPIRATION_TIME: 48 * 60, // in mins - 60

  DB_MODEL_REF,

  STATUS,

  CODE
  });
