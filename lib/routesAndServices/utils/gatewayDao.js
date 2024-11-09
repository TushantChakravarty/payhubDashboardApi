const mongoose = require('mongoose')
let BaseDao = require('../../dao/BaseDao')

const constants = require('../../constants')
const moment = require('moment-timezone');

const GatewayData = require('../../generic/models/gatewayData'); // Import your GatewayData model
const Admin = require('../../generic/models/adminModel')
const user =  require('../../generic/models/userModel')
const adminDao = new BaseDao(Admin);
const usrDao = new BaseDao(user)
const ObjectId = require('mongoose').Types.ObjectId;
const AllGatewayData = require('../../generic/models/allGatewayData'); // Import your GatewayData model
const GatewayModel = require('../../generic/models/gatewayModel'); // Import your GatewayData model


/*#################################            Load modules end            ########################################### */


/**
 * Get user details
 * @param {Object} query query to find user details
 */
function getUserDetails(query) {
    

    return adminDao.findOne(query)
}

// Function to push data into the date array
async function pushDataForToday(newData) {
    try {
        const currentDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }).slice(0, 10);

        const result = await GatewayData.findOneAndUpdate(
            {
                _id: ObjectId('6547ebf90f9ec135f4277250'),
                'gatewayData.date': currentDate,
            },
            {
                $push: {
                    'gatewayData.$.data': newData,
                },
            },
            {
                new: true, // Return the modified document
            }
        );
        const [existingDocument] = await Promise.all([result])

        if (!existingDocument) {
            // If the document for the current date doesn't exist, create a new one
            const newResult = await GatewayData.findOneAndUpdate(
                { _id: ObjectId('6547ebf90f9ec135f4277250') },
                {
                    $addToSet: {
                        'gatewayData': {
                            date: currentDate,
                            data: [newData],
                        },
                    },
                },
                {
                    new: true, // Return the modified document
                }
            );

            console.log('Data pushed for the current day:', newResult);
        } else {
            console.log('Data pushed for the current day:', result);
        }

    } catch (error) {
        console.error('Error pushing data for the current day:', error);
    }
}

async function pushDataForTodayNew(newData) {
    try {
        console.log("New Data:", newData); // Log newData to verify structure

        // Remove `_id` if present in `newData`
        delete newData._id;

        // Get the current date in the format "YYYY-MM-DD" in the Asia/Kolkata timezone
        const currentDate = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');

        // Check if there is an existing document for the current date and gateway
        const existingDocument = await AllGatewayData.findOne({
            date: currentDate,
            gatewayName: newData.gatewayName
        });

        if (existingDocument) {
            const updatedDocument = await AllGatewayData.findOneAndUpdate(
                { date: currentDate, gatewayName: newData.gatewayName },
                { $set: newData },
                { new: true }
            );

            console.log('Data updated for the current day:', updatedDocument);
            return updatedDocument;
        } else {
            // If no document exists, create a new document with explicit field assignments
            const newDocument = new AllGatewayData({
                date: currentDate,
                gatewayName: newData.gatewayName,
                last24hr: newData.last24hr,
                yesterday: newData.yesterday,
                totalVolume: newData.totalVolume,
                successfulTransactions: newData.successfulTransactions,
                last24hrSuccess: newData.last24hrSuccess,
                last24hrTotal: newData.last24hrTotal,
                totalTransactions: newData.totalTransactions,
                platformFee: newData.platformFee,
                feeCollected24hr: newData.feeCollected24hr,
                totalFeeCollected: newData.totalFeeCollected,
                yesterdayFee: newData.yesterdayFee,
                yesterdayTransactions: newData.yesterdayTransactions,
                collectionFee: newData.collectionFee,
                payoutFee: newData.payoutFee,
                abbr: newData.abbr,
                balance: newData.balance,
                uniqueId: newData.uniqueId
            });

            const savedDocument = await newDocument.save();
            console.log('New data document created for the current day:', savedDocument);
            return savedDocument;
        }

    } catch (error) {
        console.error('Error pushing data for the current day:', error);
    }
}

async function fetchDataForCurrentDate() {
    try {
        // Get the current date in the format "YYYY-MM-DD"
        const currentDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }).slice(0, 10);

        // Find a document for the current day
        const document = await GatewayData.findOne({ 'gatewayData.date': currentDate });

        if (document) {
            // Document for the current day found, you can access its data array
            const data = document.gatewayData.reverse()
          //  console.log('Data for the current day:', data);
            return data[0].data
        } else {
            console.log('No data found for the current day.');
            return []
        }
    } catch (error) {
        console.error('Error fetching data for the current day:', error);
    }
}

async function fetchDataForCurrentDateNew() {
    try {
        // Get the current date in the format "YYYY-MM-DD" in the Asia/Kolkata timezone
        const currentDate = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');

        // Find documents for the current date
        const documents = await AllGatewayData.find({ date: currentDate });

        if (documents && documents.length > 0) {
            // Data for the current day found, return the documents
            console.log(documents)
            return documents;
        } else {
            console.log('No data found for the current day.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching data for the current day:', error);
        throw error; // Re-throwing the error to handle it further if needed
    }
}

async function getAllGatewayData() {
    try {
        // Get the current date in the format "YYYY-MM-DD" in the Asia/Kolkata timezone

        // Find documents for the current date
        const documents = await GatewayModel.Gateway.find();

        if (documents && documents.length > 0) {
            // Data for the current day found, return the documents
            //console.log(documents)
            return documents;
        } else {
            console.log('No data found.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching data for the current day:', error);
        throw error; // Re-throwing the error to handle it further if needed
    }
}

module.exports = {

 
    getUserDetails,

    pushDataForToday,

    fetchDataForCurrentDate,

    pushDataForTodayNew,

    fetchDataForCurrentDateNew,

    getAllGatewayData


}