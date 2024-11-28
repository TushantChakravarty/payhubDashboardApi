"use strict";


require("dotenv").config();
const cron = require("node-cron");
const {
  myFunction,
  updateAdmin,
  updateAdminYesterdayTx,
  resetPayhubData,
  updateGatewayDetailsNewReset,
} = require("./lib/routesAndServices/scheduler/scheduler");
const adminDao = require("./lib/routesAndServices/admin/adminDao");
const {
  getTransactionsSummaryYesterday,
} = require("./lib/routesAndServices/transactionsDao/TransactionDao");
const {
  updatePendingTransactionStatus,
  updatePendingTransactionStatus2New,
  updatePendingTransactionStatusNew,
} = require("./lib/routesAndServices/scheduler/statusScheduler");
const {
  updateVolumeDataPayouts,
  getTotalAdminVolumePayouts,
  updatePayoutsBalanceMerchants,
} = require("./lib/routesAndServices/payouts/payoutsDao");


const Admin = require("./lib/generic/models/adminModel")
const User = require("./lib/generic/models/userModel")
const {Gateway} = require("./lib/generic/models/gatewayModel")


const { downloadEmailReport} = require('./lib/routesAndServices/utils/transactionDao')

const nodemailer = require("nodemailer")









// Define all cron jobs
function initCronJobs() {
  // daily email sending cron
  // 30 * * * * *
  // 58 23 * * *
  cron.schedule("30 0 * * *", async () => {
    try{
      console.log("every 30 second cron")
      const url = await downloadEmailReport()

      console.log("here is my urlllll",url)

      const transporter = nodemailer.createTransport({
        host: 'mail.privateemail.com',
        port: 465,  // Use 587 for TLS if you prefer
        secure: true,  // true for SSL, false for TLS
        auth: {
          user: 'ops@payhub.link',  // Replace with your email address
          pass: 'payhub123$'  // Replace with your email password
        }
      });
  
      // Define recipients
      
      const recipients = ['tshubhanshu007@gmail.com','vishal@gsxsolutions.com','sg@gsxtech.io','tushant029@gmail.com'];  // Replace with actual email addresses
  
      // Create mail options for sending the email
      const mailOptions = {
        from: {
          name: "Payhub",
          address: "ops@payhub.link"
        },
        to: recipients.join(','),  // Send to both emails
        subject: "24 Hour Report of Payhub",
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">PayHub</h2>
            <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
            <p style="font-size: 16px; line-height: 1.5;">Here is the 24-hour report of Payhub:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${url}" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 18px;">Download Report</a>
            </div>
            <p style="font-size: 16px; line-height: 1.5;">Please click the button to download your daily CSV report.</p>
            <p style="font-size: 16px; line-height: 1.5;">Thank you,</p>
            <p style="font-size: 16px; line-height: 1.5;">The Payhub Team</p>
            <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
            <small style="color: #666; font-size: 12px;">If you have any questions, feel free to reach out to us at <a href="mailto:support@payhub.com" style="color: #000; text-decoration: none;">support@payhub.com</a></small>
          </div>
        </div>
        `
      };
  
      await transporter.sendMail(mailOptions);
      console.log('Report email sent successfully');


  //     const transporter = nodemailer.createTransport({
  //       host: 'mail.privateemail.com',
  //       port: 465,  // Use 587 for TLS if you prefer
  //       secure: true,  // true for SSL, false for TLS
  //       auth: {
  //         user: 'ops@payhub.link',  // Replace with your Private Email address
  //         pass: 'payhub123$'  // Replace with your Private Email password
  //       }
  //     })
  //     const otp = await generateOTP(email)
  //     const mailOptions = {
  //       from: {
  //         name: "Payhub",
  //         address: "ops@payhub.link"
  //       },
  //       to: email,
  //       subject: "Sign-up OTP",
  //       text: `Hello, your sign-up OTP is ${otp}`,
  //       html: `
  //        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
  //   <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      
  //     <h2 style="text-align: center; color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">PayHub</h2>
      
  //     <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
  //     <p style="font-size: 16px; line-height: 1.5;">Your One-Time Password (OTP) for Sign up in Payhub is:</p>
  
  //     <div style="text-align: center; padding: 20px; margin: 20px 0; background-color: #e0e0e0; border-radius: 8px;">
  //       <p style="font-size: 36px; font-weight: bold; color: #000; margin: 0;">${otp}</p>
  //     </div>
  
  //     <p style="font-size: 16px; line-height: 1.5;">Please enter this OTP to complete your sign up process. This OTP is valid for <strong>5 minutes</strong>.</p>
  
  //     <div style="background-color: #000; color: white; padding: 10px; border-radius: 8px; text-align: center; margin: 20px 0;">
  //       <p>If you did not request this OTP, please <a href="mailto:support@payhub.com" style="color: white; text-decoration: underline;">contact our support team</a> immediately.</p>
  //     </div>
  
  //     <p style="font-size: 16px; line-height: 1.5;">Thank you,</p>
  //     <p style="font-size: 16px; line-height: 1.5;">The Payhub Team</p>
  
  //     <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
  //     <small style="color: #666; font-size: 12px;">If you have any questions, feel free to reach out to us at <a href="mailto:support@payhub.com" style="color: #000; text-decoration: none;">support@payhub.com</a></small>
  //   </div>
  // </div>
  
  //       `
  //     };
  //     await transporter.sendMail(mailOptions)


      

    }catch(error){
      console.log(error)
    }
});


//   // Daily admin update at 18:30
  cron.schedule("0 30 18 * * *", async () => {
    console.log('reset started')
    const admin = await adminDao.getUserDetails({ emailId: "samir123@payhub" });
    const lastExecutionDate = admin.lastExecutionDate;
    const currentDate = new Date().toISOString().split("T")[0];

    if (lastExecutionDate !== currentDate) {
      // Run your functions
      myFunction();
      updateAdmin();
      // resetPayhubData()
      // updateGatewayDetailsNewReset()
      //updateAdminYesterdayTx();
      console.log("Running daily admin update.");

      // Update the last execution date
      const update = { lastExecutionDate: currentDate };
      await adminDao.updateProfile({ emailId: "samir123@payhub" }, update);
    }
  });

  cron.schedule("0 30 18 * * *", async () => {
    console.log('reset started 2')

    const admin = await adminDao.getUserDetails({ emailId: "samir123@payhub" });
    const lastExecutionDate = admin.lastExecutionDate;
    const currentDate = new Date().toISOString().split("T")[0];

    if (lastExecutionDate !== currentDate) {
      // Run your functions
     
      resetPayhubData()
      updateGatewayDetailsNewReset()
      console.log("Running daily admin&gateway data update.");

    
    }
  });

  // cron.schedule("0 30 20 * * *", async () => {
  //   console.log('daily logs update started')
  //  await adminDao.addPreviousDayLogs("success")
  // });

  // Update admin for yesterday's transactions at 18:40
  // cron.schedule("0 40 18 * * *", async () => {
  //   updateAdminYesterdayTx();
  // });

  // Every 30 minutes, update the gateway volume data
// cron.schedule('*/30 * * * *', async () => {
//   adminDao.updateGatewayVolumeData();
// });

// Every 50 minutes, update volume data and payouts
// cron.schedule('*/50 * * * *', async () => {
//   await adminDao.updateVolumeData("success");
//   await adminDao.getTotalVolume("success");
//   await adminDao.updateGatewayVolumeData();
//   await updateVolumeDataPayouts("success");
//   await getTotalAdminVolumePayouts("success");
// });

// Every 3 hours, update gateway balance and admin balances

// cron.schedule('0 */3 * * *', async () => {
//   await adminDao.updateTotalGatewayBalance();
//   await adminDao.updateBalanceMerchants();
//   await adminDao.updateBalanceAdmin();
// });
//clear pending transactions

// cron.schedule('*/11 * * * *', async () => {
//   getTotalVolume("success")
//   updateVolumeData("success")
// });

// cron.schedule('*/2 * * * *', async () => {
//   updatePendingTransactionStatus2New();
//   updatePendingTransactionStatusNew();
// });
// clear pending transactions in batches fro  12:00 am to 2:00 Am
// cron.schedule("0 45 18 * * *", async () => {
//     console.log('Starting batch processing at 12:15 AM IST...');
//     await updatePendingTransactionStatus();
//     console.log('Batch processing window completed.');
// });
//  adminDao.updateVolumeData("success");
//  adminDao.getTotalVolume("success");
//  adminDao.updateGatewayVolumeData();
  console.log('All cron jobs have been initialized.');
}

// Export the init function
module.exports = { initCronJobs };
