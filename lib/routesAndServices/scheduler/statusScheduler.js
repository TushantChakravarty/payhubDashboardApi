const { encryptParameters, getAllPendinTransactions } = require("../../appUtils");
const { airpayPayinStatus, airpayPayinStatus2 } = require("../../gateways/airpay");
const { callbackPayin } = require("../../gateways/callback");
const { getAllPendinTransactionsPaythrough, fetchPaythroughStatus } = require("../../gateways/paythrough");
const { fetchPaytmePayinStatus  } = require("../../gateways/paytme");
const { getUserBalance2 } = require("../admin/adminDao");
const _ = require('lodash'); // Make sure lodash is installed
const { updateTransactionStatus } = require("../utils/transactionDao");
const { getUserDetails } = require("../user/userDao");
const moment = require('moment-timezone');
const { getTransaction } = require("../transactionsDao/TransactionDao");

const ObjectId = require("mongoose").Types.ObjectId;

function isOlderThan45MinutesIST(dateString) {
    
    // Given date
    const givenDate = moment(dateString);

    // Convert given date to IST timezone
    const givenDateIST = givenDate.tz('Asia/Kolkata');

    // Get current time in IST
    const currentTimeIST = moment().tz('Asia/Kolkata');

    // Calculate time difference in minutes
    const timeDifferenceMinutes = currentTimeIST.diff(givenDateIST, 'minutes');

    // Check if the time difference is greater than 45 minutes
    return timeDifferenceMinutes > 45;
}

function isOlderThan4HoursIST(dateString) {
    
    // Given date
    const givenDate = moment(dateString);

    // Convert given date to IST timezone
    const givenDateIST = givenDate.tz('Asia/Kolkata');

    // Get current time in IST
    const currentTimeIST = moment().tz('Asia/Kolkata');

    // Calculate time difference in minutes
    const timeDifferenceMinutes = currentTimeIST.diff(givenDateIST, 'minutes');

    // Check if the time difference is greater than 4 hours (240 minutes)
    return timeDifferenceMinutes > 240;
}



function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to check if the current time exceeds 2:00 AM IST
function isBeyond2AMIST() {
    const currentTimeIST = moment().tz("Asia/Kolkata");
    return currentTimeIST.hour() >= 2; // Returns true if the hour is 2:00 AM or later in IST
}

async function updatePendingTransactionStatus() {
    try {
        const airpay = await getAllPendinTransactions("IN-PROCESS", "airpay");

        console.log('Total airpay transactions:', airpay.length);

        if (airpay && airpay.length > 0) {
           // airpay.reverse(); // Reverse the list before batching
            const batchSize = 5000; // Adjust batch size as needed
            const batches = _.chunk(airpay.reverse(), batchSize); // Split the transactions into batches

            // Process batches sequentially
            for (let i = 0; i < batches.length; i++) {
                console.log(`Processing batch ${i + 1}/${batches.length} with ${batches[i].length} transactions...`);

                // Check if the current time is past 2:00 AM IST, stop if true
                if (isBeyond2AMIST()) {
                    console.log('It is past 2:00 AM IST. Stopping batch processing.');
                    break; // Exit the loop if the time is past 2:00 AM IST
                }
                
                await Promise.all(
                    batches[i].map(async (item, index) => {
                        if (item) {
                            const query = { transactionId: item.transactionId };
                            const user = await getUserBalance2(query).catch((error) => {
                                console.log('Error fetching user balance:', error);
                            });

                            if (user && user.length > 0) {
                                const inputDate = new Date(item.transaction_date);
                                const formattedDate = inputDate.toISOString().slice(0, 10);
                                const txQuery = {
                                    txid: item.transactionId,
                                    date: formattedDate
                                };

                                const response = await airpayPayinStatus(txQuery).catch((e) => {
                                    console.log('Error fetching transaction status:', e);
                                });
                                if (!response || !response.TRANSACTIONSTATUS || !response.TRANSACTIONSTATUS[0]) {
                                    console.log(`Invalid response for transaction ID ${item.transactionId}:`, response);
                                    return; // Skip to the next item
                                }
            

                                if (response?.TRANSACTIONSTATUS[0] === "200") {
                                    console.log('Transaction success',response);
                                }

                                if (response?.TRANSACTIONSTATUS[0] === "211") {
                                    return; // Pending
                                }

                                if (response && (response?.TRANSACTIONSTATUS[0] === "200" || response?.TRANSACTIONSTATUS[0] === "400")) {
                                    const transaction = await getTransaction(item.transactionId);
                                    if (transaction.status === 'success') {
                                        return;
                                    }

                                    const updateDetails = {
                                        status: response?.TRANSACTIONSTATUS[0] === "200" ? 'success' : 
                                                response?.TRANSACTIONSTATUS[0] === "400" ? 'failed' : 'pending'
                                    };

                                    let callBackDetails = {
                                        transaction_id: item.transactionId,
                                        status: updateDetails.status,
                                        amount: item.amount,
                                        utr: response?.RRN[0],
                                        phone: item.phone,
                                        username: item.username,
                                        upiId: response?.CUSTOMERVPA[0]?response?.CUSTOMERVPA[0]:item.upiId,
                                        date: item.transaction_date
                                    };

                                    // Send callback if user exists
                                    if (user[0]?.callbackUrl) {
                                        await callbackPayin(callBackDetails, user[0].callbackUrl).catch((error) => {
                                            console.log('Callback error:', error);
                                        });
                                    }

                                    await updateTransactionStatus(item.transactionId, updateDetails);
                                } else if (response?.TRANSACTIONSTATUS[0] === "403") {
                                    const isOld = isOlderThan4HoursIST(item.transaction_date);
                                    console.log(isOld ? `${index} Yes, it's older than 4 hrs.` : "No, it's not older than 4 hrs.");
                                    
                                    if (isOld) {
                                        const updateDetails = {
                                            status: "expired",
                                            reason: 'user did not complete the transaction',
                                            code: 'u69'
                                        };

                                        let callBackDetails = {
                                            transaction_id: item.transactionId,
                                            status: "Expired",
                                            amount: item.amount,
                                            utr: "",
                                            phone: item.phone,
                                            username: item.username,
                                            upiId: item.upiId,
                                            date: item.transaction_date
                                        };

                                        if (user[0]?.callbackUrl) {
                                            await callbackPayin(callBackDetails, user[0].callbackUrl);
                                        }

                                        await updateTransactionStatus(item.transactionId, updateDetails);
                                    }
                                }
                            }
                        }
                    })
                );

                // Optional: Wait for 2 minutes between batches
                if (i < batches.length - 1) {
                    console.log(`Waiting for 2 minutes before processing the next batch...`,i);
                    await waitFor(2 * 60 * 1000); // 2-minute delay between batches
                }else{
                    console.log('All batch processed')
                }
            }
        }
    } catch (error) {
        console.log('Error in updatePendingTransactionStatus:', error);
    }
}
async function updatePendingTransactionStatus2() {
    try {
        const airpay = await getAllPendinTransactions("IN-PROCESS", "airpay2");

        console.log('Total airpay transactions:', airpay.length);

        if (airpay && airpay.length > 0) {
           // airpay.reverse(); // Reverse the list before batching
            const batchSize = 5000; // Adjust batch size as needed
            const batches = _.chunk(airpay.reverse(), batchSize); // Split the transactions into batches

            // Process batches sequentially
            for (let i = 0; i < batches.length; i++) {
                console.log(`Processing batch ${i + 1}/${batches.length} with ${batches[i].length} transactions...`);

                // Check if the current time is past 2:00 AM IST, stop if true
                // if (isBeyond2AMIST()) {
                //     console.log('It is past 2:00 AM IST. Stopping batch processing.');
                //     break; // Exit the loop if the time is past 2:00 AM IST
                // }
                
                await Promise.all(
                    batches[i].map(async (item, index) => {
                        try {
                            if (item) {
                                const query = { transactionId: item.transactionId };
                                const user = await getUserBalance2(query).catch((error) => {
                                    console.log('Error fetching user balance:', error);
                                });
                
                                if (user && user.length > 0) {
                                    const inputDate = new Date(item.transaction_date);
                                    const formattedDate = inputDate.toISOString().slice(0, 10);
                                    const txQuery = {
                                        txid: item.transactionId,
                                        date: formattedDate
                                    };
                
                                    const response = await airpayPayinStatus2(txQuery).catch((e) => {
                                        console.log('Error fetching transaction status:', e);
                                    });
                
                                    // Validate response and TRANSACTIONSTATUS before proceeding
                                    if (!response || !response.TRANSACTIONSTATUS || !response.TRANSACTIONSTATUS[0]) {
                                        console.log(`Invalid response for transaction ID ${item.transactionId}:`, response);
                                        return; // Skip to the next item
                                    }
                
                                    if (response.TRANSACTIONSTATUS[0] === "200") {
                                        console.log('Transaction success', response);
                                    }
                
                                    if (response.TRANSACTIONSTATUS[0] === "211") {
                                        return; // Pending
                                    }
                
                                    if (response.TRANSACTIONSTATUS[0] === "200" || response.TRANSACTIONSTATUS[0] === "400") {
                                        const transaction = await getTransaction(item.transactionId);
                                        if (transaction.status === 'success') {
                                            return;
                                        }
                
                                        const updateDetails = {
                                            status: response.TRANSACTIONSTATUS[0] === "200" ? 'success' : 'failed',
                                            utr: response?.RRN?.[0] || ''
                                        };
                
                                        let callBackDetails = {
                                            transaction_id: item.transactionId,
                                            status: updateDetails.status,
                                            amount: item.amount,
                                            utr: response?.RRN?.[0] || '',
                                            phone: item.phone,
                                            username: item.username,
                                            upiId: response?.CUSTOMERVPA?.[0] || item.upiId,
                                            date: item.transaction_date
                                        };
                
                                        if (user[0]?.callbackUrl) {
                                            await callbackPayin(callBackDetails, user[0].callbackUrl).catch((error) => {
                                                console.log('Callback error:', error);
                                            });
                                        }
                
                                        await updateTransactionStatus(item.transactionId, updateDetails);
                                    } else if (response.TRANSACTIONSTATUS[0] === "403") {
                                        const isOld = isOlderThan4HoursIST(item.transaction_date);
                                        if (isOld) {
                                            const updateDetails = {
                                                status: "expired",
                                                reason: 'user did not complete the transaction',
                                                code: 'u69'
                                            };
                
                                            let callBackDetails = {
                                                transaction_id: item.transactionId,
                                                status: "Expired",
                                                amount: item.amount,
                                                utr: "",
                                                phone: item.phone,
                                                username: item.username,
                                                upiId: item.upiId,
                                                date: item.transaction_date
                                            };
                
                                            if (user[0]?.callbackUrl) {
                                                await callbackPayin(callBackDetails, user[0].callbackUrl).catch((error) => {
                                                    console.log('Callback error:', error);
                                                });
                                            }
                
                                            await updateTransactionStatus(item.transactionId, updateDetails);
                                        }
                                    }
                                }
                            }
                        } catch (innerError) {
                            console.log(`Error processing transaction ID ${item?.transactionId}:`, innerError);
                        }
                    })
                );
                

                // Optional: Wait for 2 minutes between batches
                if (i < batches.length - 1) {
                    console.log(`Waiting for 2 minutes before processing the next batch...`,i);
                    await waitFor(2 * 60 * 1000); // 2-minute delay between batches
                }else{
                    console.log('All batch processed')
                }
            }
        }
    } catch (error) {
        console.log('Error in updatePendingTransactionStatus:', error);
    }
}
async function updatePendingTransactionStatusNew() {
    try {
        const airpay = await getAllPendinTransactions("IN-PROCESS", "airpay");

        console.log('Total airpay transactions:', airpay.length);

        if (airpay && airpay.length > 0) {
           // airpay.reverse(); // Reverse the list before batching
            const batchSize = 5000; // Adjust batch size as needed
            const batches = _.chunk(airpay.reverse(), batchSize); // Split the transactions into batches

            // Process batches sequentially
            for (let i = 0; i < 1; i++) {
                console.log(`Processing batch ${i + 1}/${batches.length} with ${batches[i].length} transactions...`);

                // Check if the current time is past 2:00 AM IST, stop if true
                if (isBeyond2AMIST()) {
                    console.log('It is past 2:00 AM IST. Stopping batch processing.');
                    break; // Exit the loop if the time is past 2:00 AM IST
                }
                
                await Promise.all(
                    batches[i].map(async (item, index) => {
                        if (item) {
                            const query = { transactionId: item.transactionId };
                            const user = await getUserBalance2(query).catch((error) => {
                                console.log('Error fetching user balance:', error);
                            });

                            if (user && user.length > 0) {
                                const inputDate = new Date(item.transaction_date);
                                const formattedDate = inputDate.toISOString().slice(0, 10);
                                const txQuery = {
                                    txid: item.transactionId,
                                    date: formattedDate
                                };

                                const response = await airpayPayinStatus(txQuery).catch((e) => {
                                    console.log('Error fetching transaction status:', e);
                                });
                                if (!response || !response.TRANSACTIONSTATUS || !response.TRANSACTIONSTATUS[0]) {
                                    console.log(`Invalid response for transaction ID ${item.transactionId}:`, response);
                                    return; // Skip to the next item
                                }
            

                                if (response?.TRANSACTIONSTATUS[0] === "200") {
                                    console.log('Transaction success',response);
                                }

                                if (response?.TRANSACTIONSTATUS[0] === "211") {
                                    return; // Pending
                                }

                                if (response && (response?.TRANSACTIONSTATUS[0] === "200" || response?.TRANSACTIONSTATUS[0] === "400")) {
                                    const transaction = await getTransaction(item.transactionId);
                                    if (transaction.status === 'success') {
                                        return;
                                    }

                                    const updateDetails = {
                                        status: response?.TRANSACTIONSTATUS[0] === "200" ? 'success' : 
                                                response?.TRANSACTIONSTATUS[0] === "400" ? 'failed' : 'pending'
                                    };

                                    let callBackDetails = {
                                        transaction_id: item.transactionId,
                                        status: updateDetails.status,
                                        amount: item.amount,
                                        utr: response?.RRN[0],
                                        phone: item.phone,
                                        username: item.username,
                                        upiId: response?.CUSTOMERVPA[0]?response?.CUSTOMERVPA[0]:item.upiId,
                                        date: item.transaction_date
                                    };

                                    // Send callback if user exists
                                    if (user[0]?.callbackUrl) {
                                        await callbackPayin(callBackDetails, user[0].callbackUrl).catch((error) => {
                                            console.log('Callback error:', error);
                                        });
                                    }

                                    await updateTransactionStatus(item.transactionId, updateDetails);
                                } else if (response?.TRANSACTIONSTATUS[0] === "403") {
                                    const isOld = isOlderThan4HoursIST(item.transaction_date);
                                    console.log(isOld ? `${index} Yes, it's older than 4 hrs.` : "No, it's not older than 4 hrs.");
                                    
                                    if (isOld) {
                                        const updateDetails = {
                                            status: "expired",
                                            reason: 'user did not complete the transaction',
                                            code: 'u69'
                                        };

                                        let callBackDetails = {
                                            transaction_id: item.transactionId,
                                            status: "Expired",
                                            amount: item.amount,
                                            utr: "",
                                            phone: item.phone,
                                            username: item.username,
                                            upiId: item.upiId,
                                            date: item.transaction_date
                                        };

                                        if (user[0]?.callbackUrl) {
                                            await callbackPayin(callBackDetails, user[0].callbackUrl);
                                        }

                                        await updateTransactionStatus(item.transactionId, updateDetails);
                                    }
                                }
                            }
                        }
                    })
                );

                // Optional: Wait for 2 minutes between batches
                if (i < batches.length - 1) {
                    console.log(`Waiting for 2 minutes before processing the next batch...`,i);
                    await waitFor(2 * 60 * 1000); // 2-minute delay between batches
                }else{
                    console.log('All batch processed')
                }
            }
        }
    } catch (error) {
        console.log('Error in updatePendingTransactionStatus:', error);
    }
}
async function updatePendingTransactionStatus2New() {
    try {
        const airpay = await getAllPendinTransactions("IN-PROCESS", "airpay2");

        console.log('Total airpay transactions:', airpay.length);

        if (airpay && airpay.length > 0) {
           // airpay.reverse(); // Reverse the list before batching
            const batchSize = 5000; // Adjust batch size as needed
            const batches = _.chunk(airpay.reverse(), batchSize); // Split the transactions into batches

            // Process batches sequentially
            for (let i = 0; i < 1; i++) {
                console.log(`Processing batch ${i + 1}/${batches.length} with ${batches[i].length} transactions...`);

                // Check if the current time is past 2:00 AM IST, stop if true
                // if (isBeyond2AMIST()) {
                //     console.log('It is past 2:00 AM IST. Stopping batch processing.');
                //     break; // Exit the loop if the time is past 2:00 AM IST
                // }
                
                await Promise.all(
                    batches[i].map(async (item, index) => {
                        try {
                            if (item) {
                                const query = { transactionId: item.transactionId };
                                const user = await getUserBalance2(query).catch((error) => {
                                    console.log('Error fetching user balance:', error);
                                });
                
                                if (user && user.length > 0) {
                                    const inputDate = new Date(item.transaction_date);
                                    const formattedDate = inputDate.toISOString().slice(0, 10);
                                    const txQuery = {
                                        txid: item.transactionId,
                                        date: formattedDate
                                    };
                
                                    const response = await airpayPayinStatus2(txQuery).catch((e) => {
                                        console.log('Error fetching transaction status:', e);
                                    });
                
                                    // Validate response and TRANSACTIONSTATUS before proceeding
                                    if (!response || !response.TRANSACTIONSTATUS || !response.TRANSACTIONSTATUS[0]) {
                                        console.log(`Invalid response for transaction ID ${item.transactionId}:`, response);
                                        return; // Skip to the next item
                                    }
                
                                    if (response.TRANSACTIONSTATUS[0] === "200") {
                                        console.log('Transaction success', response);
                                    }
                
                                    if (response.TRANSACTIONSTATUS[0] === "211") {
                                        return; // Pending
                                    }
                
                                    if (response.TRANSACTIONSTATUS[0] === "200" || response.TRANSACTIONSTATUS[0] === "400") {
                                        const transaction = await getTransaction(item.transactionId);
                                        if (transaction.status === 'success') {
                                            return;
                                        }
                
                                        const updateDetails = {
                                            status: response.TRANSACTIONSTATUS[0] === "200" ? 'success' : 'failed',
                                            utr: response?.RRN?.[0] || ''
                                        };
                
                                        let callBackDetails = {
                                            transaction_id: item.transactionId,
                                            status: updateDetails.status,
                                            amount: item.amount,
                                            utr: response?.RRN?.[0] || '',
                                            phone: item.phone,
                                            username: item.username,
                                            upiId: response?.CUSTOMERVPA?.[0] || item.upiId,
                                            date: item.transaction_date
                                        };
                
                                        if (user[0]?.callbackUrl) {
                                            await callbackPayin(callBackDetails, user[0].callbackUrl).catch((error) => {
                                                console.log('Callback error:', error);
                                            });
                                        }
                
                                        await updateTransactionStatus(item.transactionId, updateDetails);
                                    } else if (response.TRANSACTIONSTATUS[0] === "403") {
                                        const isOld = isOlderThan4HoursIST(item.transaction_date);
                                        if (isOld) {
                                            const updateDetails = {
                                                status: "expired",
                                                reason: 'user did not complete the transaction',
                                                code: 'u69'
                                            };
                
                                            let callBackDetails = {
                                                transaction_id: item.transactionId,
                                                status: "Expired",
                                                amount: item.amount,
                                                utr: "",
                                                phone: item.phone,
                                                username: item.username,
                                                upiId: item.upiId,
                                                date: item.transaction_date
                                            };
                
                                            if (user[0]?.callbackUrl) {
                                                await callbackPayin(callBackDetails, user[0].callbackUrl).catch((error) => {
                                                    console.log('Callback error:', error);
                                                });
                                            }
                
                                            await updateTransactionStatus(item.transactionId, updateDetails);
                                        }
                                    }
                                }
                            }
                        } catch (innerError) {
                            console.log(`Error processing transaction ID ${item?.transactionId}:`, innerError);
                        }
                    })
                );
                

                // Optional: Wait for 2 minutes between batches
                if (i < batches.length - 1) {
                    console.log(`Waiting for 2 minutes before processing the next batch...`,i);
                    await waitFor(2 * 60 * 1000); // 2-minute delay between batches
                }else{
                    console.log('All batch processed')
                }
            }
        }
    } catch (error) {
        console.log('Error in updatePendingTransactionStatus:', error);
    }
}
module.exports={
    updatePendingTransactionStatus,
    updatePendingTransactionStatus2,
    updatePendingTransactionStatusNew,
    updatePendingTransactionStatus2New

}