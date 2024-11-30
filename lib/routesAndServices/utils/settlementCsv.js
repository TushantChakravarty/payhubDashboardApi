const {Settlements} = require("../../generic/models/settlementsModel")
const moment = require("moment-timezone");
const { PassThrough } = require('stream');
const { s3 } = require("../../config/awsConfig");


async function uploadCsvStreamToS3Settlements(readableStream) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME, // Your bucket name
    Key: `settlements_${Date.now()}.csv`, // File name to save in S3
    Body: readableStream, // Streaming the CSV data
    ContentType: 'text/csv',
  };

  // Uploading the stream to S3
  try {
    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully. URL: ${data.Location}`);
    return data.Location;
  } catch (err) {
    console.error('Error uploading to S3:', err);
    throw new Error('Upload failed');
  }
}

function settlementToCsvRowForMerchant(transaction,type,call,name,merchant_balance) {
  try{
    const formatDateAndTime = (date) => ({
      formattedTime: new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date(date)),
      
      formattedDate: new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(new Date(date)),
    });

    if(name.length >0){
      if(name.length > 1){
        name =name.charAt(0).toUpperCase() + name.slice(1);
      }else{
        name = name.toUpperCase()
      }
     
    }
  
    const { formattedTime, formattedDate } = formatDateAndTime(transaction.transaction_date);
    
    if(type == "settlement"){
      if(call == 'user'){
        return `${formattedTime},${formattedDate},${type},${(transaction.amount !== undefined  && transaction.amount!== null)? transaction.amount.toFixed(2) : '0.00'},${(transaction.feePercentage !== undefined  && transaction.feePercentage!== null)? transaction.feePercentage : '0'},${(transaction.feeCharged !== undefined && transaction.feeCharged !== null )? transaction.feeCharged.toFixed(2) : '0.00'},${(transaction.bankFees !== undefined && transaction.bankFees !==null) ? transaction.bankFees : '0'},${(transaction.netBankFees !== undefined && transaction.netBankFees !==null) ? transaction.netBankFees.toFixed(2) : '0.00'},${(transaction.gst !== undefined && transaction.gst !== null) ? transaction.gst : '0'},${(transaction.netGst !== undefined && transaction.netGst !== null) ? transaction.netGst.toFixed(2) : '0.00'},${(transaction.amountSettled !== undefined && transaction.amountSettled !== null) ? transaction.amountSettled.toFixed(2) : '0.00'},${(transaction.usdtRate !== undefined && transaction.usdtRate !== null  )?transaction.usdtRate.toFixed(2) : '0.00'},${(transaction.usdt !== undefined && transaction.usdt !==null) ? transaction.usdt.toFixed(2) : '0.00'},${transaction.ref_no || ''},${transaction.balance || merchant_balance}\n`

      }else if(call == 'admin'){
       return `${formattedTime},${formattedDate},${name},${type},${(transaction.amount !== undefined  && transaction.amount!== null)? transaction.amount.toFixed(2) : '0.00'},${(transaction.feePercentage !== undefined  && transaction.feePercentage!== null)? transaction.feePercentage : '0'},${(transaction.feeCharged !== undefined && transaction.feeCharged !== null )? transaction.feeCharged.toFixed(2) : '0.00'},${(transaction.bankFees !== undefined && transaction.bankFees !==null) ? transaction.bankFees : '0'},${(transaction.netBankFees !== undefined && transaction.netBankFees !==null) ? transaction.netBankFees.toFixed(2) : '0.00'},${(transaction.gst !== undefined && transaction.gst !== null) ? transaction.gst : '0'},${(transaction.netGst !== undefined && transaction.netGst !== null) ? transaction.netGst.toFixed(2) : '0.00'},${(transaction.amountSettled !== undefined && transaction.amountSettled !== null) ? transaction.amountSettled.toFixed(2) : '0.00'},${(transaction.usdtRate !== undefined && transaction.usdtRate !== null  )?transaction.usdtRate.toFixed(2) : '0.00'},${(transaction.usdt !== undefined && transaction.usdt !==null) ? transaction.usdt.toFixed(2) : '0.00'},${transaction.ref_no || ''},${transaction.balance || merchant_balance}\n`

      }

    }else if(type == "refund" || type == "chargeback"){
      if(call == 'user'){
        return `${formattedTime},${formattedDate},${type},${(transaction.amount !== undefined  && transaction.amount!== null)? transaction.amount.toFixed(2) : '0.00'},${(transaction.feePercentage !== undefined  && transaction.feePercentage!== null)? transaction.feePercentage : '0'},${(transaction.feeCharged !== undefined && transaction.feeCharged !== null )? transaction.feeCharged.toFixed(2) : '0.00'},${(transaction.amountSettled !== undefined && transaction.amountSettled !== null) ? transaction.amountSettled.toFixed(2) : '0.00'},${transaction.ref_no || ''},${transaction.balance || merchant_balance}\n`

      }else if(call == 'admin'){
        return `${formattedTime},${formattedDate},${name},${type},${(transaction.amount !== undefined  && transaction.amount!== null)? transaction.amount.toFixed(2) : '0.00'},${(transaction.feePercentage !== undefined  && transaction.feePercentage!== null)? transaction.feePercentage : '0'},${(transaction.feeCharged !== undefined && transaction.feeCharged !== null )? transaction.feeCharged.toFixed(2) : '0.00'},${(transaction.amountSettled !== undefined && transaction.amountSettled !== null) ? transaction.amountSettled.toFixed(2) : '0.00'},${transaction.ref_no || ''},${transaction.balance || merchant_balance}\n`
        
      }

    }else if(type == "rolling_reserve" || type == "misc"){
      if(call == 'user'){
        return `${formattedTime},${formattedDate},${type},${(transaction.amount !== undefined  && transaction.amount!== null)? transaction.amount.toFixed(2) : '0.00'},${(transaction.amountSettled !== undefined && transaction.amountSettled !== null) ? transaction.amountSettled.toFixed(2) : '0.00'},${transaction.ref_no || ''},${transaction.balance || merchant_balance}\n`

      }else if(call == 'admin'){

         return `${formattedTime},${formattedDate},${name},${type},${(transaction.amount !== undefined  && transaction.amount!== null)? transaction.amount.toFixed(2) : '0.00'},${(transaction.amountSettled !== undefined && transaction.amountSettled !== null) ? transaction.amountSettled.toFixed(2) : '0.00'},${transaction.ref_no || ''},${transaction.balance || merchant_balance}\n`
        
      }
    }
  
  
    return `${formattedTime},${formattedDate},${(transaction.amount !== undefined  && transaction.amount!== null)? transaction.amount.toFixed(2) : '0.00'},${(transaction.feeCharged !== undefined && transaction.feeCharged !== null )? transaction.feeCharged.toFixed(2) : '0.00'},${(transaction.netBankFees !== undefined && transaction.netBankFees !==null) ? transaction.netBankFees.toFixed(2) : '0.00'},${(transaction.netGst !== undefined && transaction.netGst !== null) ? transaction.netGst.toFixed(2) : '0.00'},${(transaction.chargeback !== undefined && transaction.chargeback !== null) ? transaction.chargeback.toFixed(2): '0.00'},${(transaction.rolling_reserve !== undefined && transaction.rolling_reserve) ? transaction.rolling_reserve.toFixed(2) : '0.00'},${(transaction.misc !== undefined && transaction.misc !==null) ? transaction.misc.toFixed(2) : '0.00'},${(transaction.refund !== undefined && transaction.refund!== null)? transaction.refund.toFixed(2) : '0.00'},${(transaction.amountSettled !== undefined && transaction.amountSettled !== null) ? transaction.amountSettled.toFixed(2) : '0.00'},${(transaction.usdtRate !== undefined && transaction.usdtRate !== null  )?transaction.usdtRate.toFixed(2) : '0.00'},${(transaction.usdt !== undefined && transaction.usdt !==null) ? transaction.usdt.toFixed(2) : '0.00'},${transaction.ref_no || ''},${transaction.notes || ''}\n`;
  

  }catch(error){
    console.log(error)
    return false
  }
 
}


async function createSettlementCsvByDate(details){
  try{
    const {uuid,name,start_date=null,end_date=null,type,call,merchant_balance} = details

    const istStartDate = moment.tz(start_date, "Asia/Kolkata").startOf("day").toISOString();
    const istEndDate = moment.tz(end_date, "Asia/Kolkata").endOf("day").toISOString();

    let cursor = null

    //creating db cursor

    if(type == 'all'){
      if(start_date && end_date){
        cursor =  Settlements.find({
          uuid:uuid,
          transaction_date: { $gte: istStartDate, $lte: istEndDate },
        }).cursor()
      }else {
        cursor =  Settlements.find({
          uuid:uuid
        }).cursor()
      }
    }else if(type == 'settlement' || type == 'refund' || type == 'chargeback' || type == 'rolling_reserve' || type == 'misc'){
      if(start_date && end_date){
        cursor =  Settlements.find({
          uuid: String(uuid),
          ...(details.type === "settlement"
            ? {
                $or: [
                  { type: "settlement" },
                  { type: null },
                  { type: "" },
                  { type: { $exists: false } },
                ],
              }
            : { type: details.type }),
            transaction_date: { $gte: istStartDate, $lte: istEndDate }
        }).cursor()

      }else {
        cursor =  Settlements.find({
          uuid: String(uuid),
          ...(details.type === "settlement"
            ? {
                $or: [
                  { type: "settlement" },
                  { type: null },
                  { type: "" },
                  { type: { $exists: false } },
                ],
              }
            : { type: details.type })
        }).cursor()
      }
      

    }


    // **********db cursor end

   const passThroughStream = new PassThrough();

   if(type == 'all'){
    let settlement = []
    let refund = []
    let chargeback = []
    let rolling_reserve = []
    let misc = []

    cursor.on('data',(doc)=>{
      if(doc.type == "refund"){
       refund.push(doc)
      }else if(doc.type == "chargeback"){
        chargeback.push(doc)
      }else if(doc.type == "rolling_reserve"){
        rolling_reserve.push(doc)
      }else if(doc.type == "misc"){
        misc.push(doc)
      }else{
        settlement.push(doc)
      }
    })

    cursor.on('end',()=>{
      passThroughStream.write("\n");
      passThroughStream.write("SETTLEMENTS\n");
      if(call == 'user'){
        passThroughStream.write("Time,Date,Type,Gross Volume ,Plattform Fees,Net Fees,Bank Fees,Net Bank Fees,Gst,Net gst,Net Volume,USDT Rate,USDT Net,Ref,Balance\n");
      }else if(call == 'admin'){
        passThroughStream.write("Time,Date,Merchant Name,Type,Gross Volume ,Plattform Fees,Net Fees,Bank Fees,Net Bank Fees,Gst,Net gst,Net Volume,USDT Rate,USDT Net,Ref,Balance\n");
      }

      settlement.map((item)=>{
        data_write = settlementToCsvRowForMerchant(item,"settlement",call,name,merchant_balance)
        passThroughStream.write(data_write)
      })

      passThroughStream.write("\n")

      passThroughStream.write("REFUND\n")
      if(call == 'user'){
        passThroughStream.write("Time,Date,Type,Gross Volume ,Plattform Fees,Net Fees,Net Volume,Ref,Balance\n");
      }else if(call == 'admin'){
        passThroughStream.write("Time,Date,Merchant Name,Type,Gross Volume ,Plattform Fees,Net Fees,Net Volume,Ref,Balance\n");
      }

      refund.map((item)=>{
        data_write = settlementToCsvRowForMerchant(item,"refund",call,name,merchant_balance)
        passThroughStream.write(data_write)
      })

      passThroughStream.write("\n")

      passThroughStream.write("CHARGEBACK\n")
      if(call == 'user'){
        passThroughStream.write("Time,Date,Type,Gross Volume ,Plattform Fees,Net Fees,Net Volume,Ref,Balance\n");
      }else if(call == 'admin'){
        passThroughStream.write("Time,Date,Merchant Name,Type,Gross Volume ,Plattform Fees,Net Fees,Net Volume,Ref,Balance\n");
      }

      chargeback.map((item)=>{
        data_write = settlementToCsvRowForMerchant(item,"chargeback",call,name,merchant_balance)
        passThroughStream.write(data_write)
      })

      passThroughStream.write("\n")

      passThroughStream.write("ROLLING RESERVE\n")

      if(call == 'user'){
        passThroughStream.write("Time,Date,Type,Gross Volume,Net Volume,Ref,Balance\n");

      }else if(call == 'admin'){
        passThroughStream.write("Time,Date,Merchant Name,Type,Gross Volume ,Net Volume,Ref,Balance\n");
        
      }

      rolling_reserve.map((item)=>{
        data_write = settlementToCsvRowForMerchant(item,"rolling_reserve",call,name,merchant_balance)
        passThroughStream.write(data_write)
      })

      passThroughStream.write("\n")

      passThroughStream.write("MISC\n")

      if(call == 'user'){
        passThroughStream.write("Time,Date,Type,Gross Volume,Net Volume,Ref,Balance\n");
      }else if(call == 'admin'){
        passThroughStream.write("Time,Date,Merchant Name,Type,Gross Volume ,Net Volume,Ref,Balance\n");
      }

      misc.map((item)=>{
        data_write = settlementToCsvRowForMerchant(item,"misc",call,name,merchant_balance)
        passThroughStream.write(data_write)
      })

      passThroughStream.end()

    })

   }else if(type == 'settlement' || type == 'refund' || type == 'chargeback' || type == 'rolling_reserve' || type == 'misc'){

    if(type=='settlement'){
      if(call == 'user'){
        passThroughStream.write("Time,Date,Type,Gross Volume ,Plattform Fees,Net Fees,Bank Fees,Net Bank Fees,Gst,Net gst,Net Volume,USDT Rate,USDT Net,Ref,Balance\n");
      }else if(call == 'admin'){
        passThroughStream.write("Time,Date,Merchant Name,Type,Gross Volume ,Plattform Fees,Net Fees,Bank Fees,Net Bank Fees,Gst,Net gst,Net Volume,USDT Rate,USDT Net,Ref,Balance\n");
      }
    }else if( type =='refund' || type == 'chargeback'){
      if(call == 'user'){
        passThroughStream.write("Time,Date,Type,Gross Volume ,Plattform Fees,Net Fees,Net Volume,Ref,Balance\n");
      }else if(call == 'admin'){
        passThroughStream.write("Time,Date,Merchant Name,Type,Gross Volume ,Plattform Fees,Net Fees,Net Volume,Ref,Balance\n");
      }
    }else if(type == 'rolling_reserve' || type == 'misc'){
      if(call == 'user'){
        passThroughStream.write("Time,Date,Type,Gross Volume,Net Volume,Ref,Balance\n");

      }else if(call == 'admin'){
        passThroughStream.write("Time,Date,Merchant Name,Type,Gross Volume ,Net Volume,Ref,Balance\n");
        
      }

    }
    
    cursor.on('data',(doc) =>{
      let data_write = null
      if(type=='settlement'){
       
        if(call == 'user'){
         data_write = settlementToCsvRowForMerchant(doc,type,call,name,merchant_balance)
        }else if(call == 'admin'){
          data_write = settlementToCsvRowForMerchant(doc,type,call,name,merchant_balance)
        
        }
      }else if( type =='refund' || type == 'chargeback'){
        if(call == 'user'){
          data_write = settlementToCsvRowForMerchant(doc,type,call,name,merchant_balance)
        }else if(call == 'admin'){
          data_write = settlementToCsvRowForMerchant(doc,type,call,name,merchant_balance)
        }
      }else if(type == 'rolling_reserve' || type == 'misc'){
        if(call == 'user'){
          data_write = settlementToCsvRowForMerchant(doc,type,call,name,merchant_balance)
          
        }else if(call == 'admin'){
          data_write = settlementToCsvRowForMerchant(doc,type,call,name,merchant_balance)
        }

      }
      if(data_write){
        passThroughStream.write(data_write);
      }
    })

    cursor.on('end',()=>{
      passThroughStream.end();
    })

   }

    // code to upload to s3
  const csvUrl =await uploadCsvStreamToS3Settlements(passThroughStream)
  return csvUrl

  }catch(error){

  }
}


module.exports = { createSettlementCsvByDate }