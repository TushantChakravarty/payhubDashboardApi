const { Gateway } = require("../../generic/models/gatewayModel")
async function addGateway(tx)
{
    const newGateway = new Gateway(tx);
    
    // Save the transaction
    const updated = await newGateway.save()
        .catch(error => {
            console.error('Error:', error);
        });
        return updated
}

async function updateGatewayDetailsNew(gatewayName, updateDetails) {
    try {
        const updatedGateway = await Gateway.findOneAndUpdate(
            { gatewayName: gatewayName },  // Query to find the specific gateway
            updateDetails,                  // Update details
            { new: true }                   // Options: return the updated document
        );

        if (!updatedGateway) {
            console.log('Gateway not found');
            return null;
        }
        console.log(updatedGateway)

        return updatedGateway;
    } catch (error) {
        console.error('Error updating gateway:', error);
        throw error;
    }
}
async function updateGatewayDetailsAtomic(gatewayName, details, feeCollected, totalFeeCollected) {
    try {
       
        const updateDetails = {
            $inc: {
                last24hr: Number(details.AMOUNT),                       // Increment last24hr by AMOUNT
                last24hrSuccess: 1,                                     // Increment last24hrSuccess by 1
                successfulTransactions: 1,                              // Increment successfulTransactions by 1
                totalVolume: Number(details.AMOUNT),                    // Increment totalVolume by AMOUNT
                balance: Number(details.AMOUNT),      
            },
            $set: {
                feeCollected24hr: feeCollected,                         // Set feeCollected24hr to new value
                totalFeeCollected: totalFeeCollected                    // Set totalFeeCollected to new value
            }
        };

        const updatedGateway = await Gateway.findOneAndUpdate(
            { gatewayName: gatewayName },  // Query to find the specific gateway
            updateDetails,                 // Atomic update details
            { new: true }                  // Options: return the updated document
        );

        if (!updatedGateway) {
            console.log('Gateway not found');
            return null;
        }

        return updatedGateway;
    } catch (error) {
        console.error('Error updating gateway:', error);
        throw error;
    }
}

async function updateGatewayDetailsFailedAtomic(gatewayName) {
    try {
       
        const updateDetails = {
            $inc: {                                       
                last24hrTotal: 1,
                totalTransactions:1                          
            },
          
        };

        const updatedGateway = await Gateway.findOneAndUpdate(
            { gatewayName: gatewayName },  // Query to find the specific gateway
            updateDetails,                 // Atomic update details
            { new: true }                  // Options: return the updated document
        );

        if (!updatedGateway) {
            console.log('Gateway not found');
            return null;
        }

        return updatedGateway;
    } catch (error) {
        console.error('Error updating gateway:', error);
        throw error;
    }
}


module.exports={
    addGateway,
    updateGatewayDetailsNew,
    updateGatewayDetailsAtomic,
    updateGatewayDetailsFailedAtomic
}