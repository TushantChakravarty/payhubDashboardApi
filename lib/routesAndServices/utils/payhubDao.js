const PayhubData = require("../../generic/models/payhubData")
const PayhubArchive = require("../../generic/models/payhubArchiveData")
async function updatePayhubData(updateData, maxRetries = 3) {
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            let existingDocument = await PayhubData.findOne();

            // If no document exists, create one with initial values from $inc
            if (!existingDocument) {
                // Initialize document with the values from $inc
                const initialData = {
                    last24hr: updateData.$inc.last24hr || 0,
                    balance: updateData.$inc.balance || 0,
                    totalTransactions: updateData.$inc.totalTransactions || 0,
                    successfulTransactions: updateData.$inc.successfulTransactions || 0,
                    last24hrSuccess: updateData.$inc.last24hrSuccess || 0,
                    last24hrTotal: updateData.$inc.last24hrTotal || 0,
                    version: 0  // Initialize version to 0
                };

                const newDocument = new PayhubData(initialData);
                const savedDocument = await newDocument.save();
                console.log("New document created:", savedDocument);
                return savedDocument;
            }

            // If the document exists, attempt to update it with $inc and version control
            const updatedDocument = await PayhubData.findOneAndUpdate(
                { _id: existingDocument._id, version: existingDocument.version },
                { ...updateData, $inc: { ...updateData.$inc, version: 1 } },  // Increment version
                { new: true }
            );

            if (updatedDocument) {
                console.log(`Update successful on attempt ${attempts + 1}`);
                return updatedDocument;
            } else {
                throw new Error("Version mismatch, retrying...");
            }

        } catch (error) {
            if (error.message.includes("Version mismatch")) {
                attempts += 1;
                console.log(`Retry attempt ${attempts}/${maxRetries} due to version mismatch.`);

                if (attempts >= maxRetries) {
                    throw new Error("Max retries reached. Could not update document due to concurrent modifications.");
                }

                // Optional delay before retrying
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                throw error;
            }
        }
    }
}



async function archiveDailyData(dailyData) {
    try {
        const currentDate = new Date().toISOString().slice(0, 10);  // Today's date in "YYYY-MM-DD" format
        console.log('Current date for archiving:', currentDate);
        console.log('Received daily data:', dailyData);

        // Check if an archive record already exists for the current date
        const existingArchive = await PayhubArchive.findOne({ date: currentDate });
        console.log('Existing archive record found:', existingArchive);

        if (existingArchive) {
            console.log(`Archive data for ${currentDate} already exists.`);
            return existingArchive;  // Return the existing document if found
        }

        // Prepare and save the archival data if no existing record is found
        const archiveData = {
            date: currentDate,
            balance: dailyData.balance || 0,
            last24hr: dailyData.last24hr || 0,
            yesterday: dailyData.yesterday || 0,
            totalVolume: dailyData.totalVolume || 0,
            successfulTransactions: dailyData.successfulTransactions || 0,
            last24hrSuccess: dailyData.last24hrSuccess || 0,
            last24hrTotal: dailyData.last24hrTotal || 0,
            totalTransactions: dailyData.totalTransactions || 0,
            platformFee: dailyData.platformFee || 0,
            feeCollected24hr: dailyData.feeCollected24hr || 0,
            totalFeeCollected: dailyData.totalFeeCollected || 0,
            lastExecutionDate: dailyData.lastExecutionDate || "",
            payoutsBalance: dailyData.payoutsBalance || 0,
            payouts: dailyData.payouts || {},  // Sub-document
            topups: dailyData.topups || {},    // Sub-document
            createdAt: new Date()
        };
        
        console.log("Prepared archive data:", archiveData);

        const archiveRecord = new PayhubArchive(archiveData);
        console.log('Attempting to save archive record...');
        await archiveRecord.save();

        console.log('Daily data archived successfully:', archiveRecord);
        return archiveRecord;

    } catch (error) {
        console.error('Error archiving daily data:', error.message, error.stack);
        throw error;  // Re-throw the error for handling elsewhere if needed
    }
}



async function updatePayhubDataFields(updateFields, maxRetries = 3) {
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            let existingDocument = await PayhubData.findOne();

            // If no document exists, create one with initial values from updateFields
            if (!existingDocument) {
                const newDocument = new PayhubData({
                    ...updateFields,
                    version: 0  // Initialize version to 0
                });

                const savedDocument = await newDocument.save();
                console.log("New document created:", savedDocument);
                return savedDocument;
            }

            // Attempt to update the existing document with the provided fields and increment version
            const updatedDocument = await PayhubData.findOneAndUpdate(
                { _id: existingDocument._id, version: existingDocument.version },
                { $set: updateFields, $inc: { version: 1 } },  // Increment version
                { new: true }
            );

            if (updatedDocument) {
                console.log(`Update successful on attempt ${attempts + 1}`);
                return updatedDocument;
            } else {
                throw new Error("Version mismatch, retrying...");
            }

        } catch (error) {
            if (error.message.includes("Version mismatch")) {
                attempts += 1;
                console.log(`Retry attempt ${attempts}/${maxRetries} due to version mismatch.`);

                if (attempts >= maxRetries) {
                    throw new Error("Max retries reached. Could not update document due to concurrent modifications.");
                }

                // Optional delay before retrying
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                throw error;
            }
        }
    }
}

async function fetchPayhubData() {
    try {
        // Fetch the single document from the PayhubData collection
        const payhubData = await PayhubData.findOne();

        if (!payhubData) {
            console.log("No PayhubData document found.");
            return null;
        }

        console.log("Fetched PayhubData:", payhubData);
        return payhubData;
    } catch (error) {
        console.error("Error fetching PayhubData:", error);
        throw error;  // Re-throw error for handling elsewhere if needed
    }
}


module.exports ={
    updatePayhubData,

    archiveDailyData,

    updatePayhubDataFields,

    fetchPayhubData
}