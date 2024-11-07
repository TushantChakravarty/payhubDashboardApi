const { MongoClient } = require('mongodb');


function addMerchant(details) {
  const dbUrl = 'mongodb+srv://payhub:GBA97ISU6itkVmzM@cluster0.omnvtd0.mongodb.net/?retryWrites=true&w=majority';

  // Create a new MongoClient instance
  const client = new MongoClient(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

  // Connect to the MongoDB server
  client.connect(async (err) => {
      if (err) {
          console.error('Error connecting to MongoDB:', err);
          //callback(err);
      } else {
          console.log('Connected to MongoDB');
        //   const users = await adminDao.getUserDetails({
        //     emailId:'samir123@payhub'
        //   })
          //console.log(users)
          // Access the database and collection here, if needed
          const db = client.db();
          const collection = db.collection('users');
          const result = await collection.insertOne(details)

          console.log(`${result.insertedCount} user inserted successfully.`);
          //console.log('Connected to sandbox', users);

          // Pass the client instance to the callback
          //callback(null, client);
      }
  });
}

function resetPasswordSandbox(details) {
  const dbUrl = 'mongodb+srv://payhub:GBA97ISU6itkVmzM@cluster0.omnvtd0.mongodb.net/?retryWrites=true&w=majority';

  // Create a new MongoClient instance
  const client = new MongoClient(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

  // Connect to the MongoDB server
  client.connect(async (err) => {
      if (err) {
          console.error('Error connecting to MongoDB:', err);
          //callback(err);
      } else {
          console.log('Connected to MongoDB');
        //   const users = await adminDao.getUserDetails({
        //     emailId:'samir123@payhub'
        //   })
          //console.log(users)
          // Access the database and collection here, if needed
          const db = client.db();
          const collection = db.collection('users');

          const result = await collection.findOneAndUpdate(
            { emailId: details.emailId },           // Query
            { $set: { password: details.password }}, // Update object
            { returnOriginal: false }        // Options (returns updated document)
          );
          

          console.log(`${result.insertedCount} user inserted successfully.`);
          //console.log('Connected to sandbox', users);

          // Pass the client instance to the callback
          //callback(null, client);
      }
  });
}

function resetPasswordSandboxAdmin(details) {
  const dbUrl = 'mongodb+srv://payhub:GBA97ISU6itkVmzM@cluster0.omnvtd0.mongodb.net/?retryWrites=true&w=majority';

  // Create a new MongoClient instance
  const client = new MongoClient(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

  // Connect to the MongoDB server
  client.connect(async (err) => {
      if (err) {
          console.error('Error connecting to MongoDB:', err);
          //callback(err);
      } else {
          console.log('Connected to MongoDB');
        //   const users = await adminDao.getUserDetails({
        //     emailId:'samir123@payhub'
        //   })
          //console.log(users)
          // Access the database and collection here, if needed
          const db = client.db();
          const collection = db.collection('admins');

          const result = await collection.findOneAndUpdate(
            { emailId: details.emailId },           // Query
            { $set: { password: details.password }}, // Update object
            { returnOriginal: false }        // Options (returns updated document)
          );
          

          console.log(`${result.insertedCount} user inserted successfully.`);
          //console.log('Connected to sandbox', users);

          // Pass the client instance to the callback
          //callback(null, client);
      }
  });
}

// async function addMerchantNew(details) {
//   const dbUrl = 'mongodb+srv://payhub:GBA97ISU6itkVmzM@cluster0.omnvtd0.mongodb.net/?retryWrites=true&w=majority';

//   // Create a new MongoClient instance
//   const client = new MongoClient(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

//   // Connect to the MongoDB server
//   client.connect(async (err) => {
//       if (err) {
//           console.error('Error connecting to MongoDB:', err);
//           //callback(err);
//       } else {
//           console.log('Connected to MongoDB');
//         //   const users = await adminDao.getUserDetails({
//         //     emailId:'samir123@payhub'
//         //   })
//           //console.log(users)
//           // Access the database and collection here, if needed
//           const db = client.db();
//           const collection = db.collection('users');
//           const result = await collection.insertOne(details)

//           console.log(`${result.insertedCount} user inserted successfully.`);
//           //console.log('Connected to sandbox', users);



//           // Pass the client instance to the callback
//           //callback(null, client);
//       }
//   });
// }


async function addMerchantNew(details) {
  const dbUrl = 'mongodb+srv://payhub:GBA97ISU6itkVmzM@cluster0.omnvtd0.mongodb.net/?retryWrites=true&w=majority';

  // Create a new MongoClient instance
  const client = new MongoClient(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected to MongoDB');

    // Access the database and collection
    const db = client.db();
    const collection = db.collection('users');

    // Insert the merchant details
    const result = await collection.insertOne(details);
    console.log(`${result.insertedCount} user inserted successfully.`);

  } catch (err) {
    // Catch any errors that occur during the connection or operation
    console.error('Error occurred while inserting user:', err);
  } finally {
    // Ensure the client connection is closed
    await client.close();
  }
}
module.exports ={
    addMerchant,
    addMerchantNew,
    resetPasswordSandbox,
    resetPasswordSandboxAdmin
}