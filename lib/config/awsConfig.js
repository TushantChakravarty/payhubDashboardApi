const AWS = require('aws-sdk');
// Configure AWS SDK (ensure these are correctly set in your environment)
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // or hardcode the credentials
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION, // set the region of your bucket
  });

  module.exports ={
    s3
  }