const Callbacks = require('../../generic/models/callbacks')

function saveCallback(transactionId, gateway, callbackDetails) {
    // Create a new instance of the Callbacks model
    const timeElapsed = Date.now();
const today = new Date(timeElapsed);

// Convert to IST
const options = { timeZone: 'Asia/Kolkata' };
const istDate = today.toLocaleString('en-US', options);

    const newCallback = new Callbacks({
        transactionId: transactionId,
        gateway: gateway,
        callbackTime:istDate,
        ...callbackDetails  // Spread the dynamic fields
    });

    // Save the new callback to the database
    return newCallback.save()
        .then(result => {
            console.log('Callback saved:', result);
            return result; // You can return the saved document or any other value as needed
        })
        .catch(error => {
            console.error('Error saving callback:', error);
            throw error; // You may want to handle the error or propagate it to the caller
        });
}



module.exports={
    saveCallback
}