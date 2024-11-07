const { toFile, toDataURL } = require('qrcode');
const puppeteer = require("puppeteer");
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const { getTransaction } = require('../routesAndServices/transactionsDao/TransactionDao');
const { getUserBalance2 } = require('../routesAndServices/admin/adminDao');
const { updateTransactionStatus } = require('../routesAndServices/utils/transactionDao');
// Generate a random transaction ID
const generateTransactionId = () => {
  return Math.floor(Math.random() * 1e10).toString();
};

// UPI details
async function generateQrCode(Amount)
{

    const txid = generateTransactionId()
    console.log(txid)
    const upiId = '9810922270@kotak';
    const payeeName = 'tushant';
    const amount = Amount;
    const currency = 'INR';
    const transactionId = txid; // Generate a random transaction ID
    const transactionRef = txid; // Transaction reference
    const transactionNote = `${transactionId}`;
    
    // Function to build UPI URL manually
    const buildUpiUrl = (scheme, host, params) => {
        const paramString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
        return `${scheme}://${host}/pay?${paramString}`;
    };
    
    // Parameters
    const params = {
        pa: upiId,
        pn: payeeName,
        tn: transactionNote,
        tr: transactionRef,
        am: amount,
        cu: currency
    };
    
    // Generate UPI URLs
    const upiUrl = buildUpiUrl('upi', 'pay', params);
    const paytmUrl = buildUpiUrl('paytmmp', 'upi', params);
    const gpayUrl = buildUpiUrl('tez', 'upi', params);
    const phonepeUrl = buildUpiUrl('phonepe', 'upi', params);
    
    console.log('UPI URL:', upiUrl);
    console.log('Paytm URL:', paytmUrl);
    console.log('GPay URL:', gpayUrl);
    console.log('PhonePe URL:', phonepeUrl);
    
    // Generate QR code and save it as a PNG file
    toFile('upi_payment_qr.png', upiUrl, (err) => {
        if (err) throw err;
        console.log('QR code generated and saved as upi_payment_qr.png');
    });
    
    // Generate QR code as a data URL and log it to the console
    toDataURL(upiUrl, (err, url) => {
        if (err) throw err;
        //console.log('QR code as data URL:', url);
    });
    return {upiUrl, transactionId}
}

async function payhubBankScrapper()
{


// Your existing IMAP configuration
const imapConfig = {
  user: "vijay@gsxsolutions.com",
  password: "gsxsol123",
  host: "imap.secureserver.net", // GoDaddy's IMAP server
  port: 993, // IMAP port
  tls: true,
};

const imap = new Imap(imapConfig);

const openInbox = (cb) => {
  imap.openBox("INBOX", true, cb);
};

const extractOtp = (body) => {
  const otpMatch = body.match(
    /to log into Net Banking for CRN\s+.*?\s+is\s+(\d{6})\./
  );
  return otpMatch ? otpMatch[1] : null;
};

const fetchLatestEmailFromSender = (senderEmail, callback) => {
  imap.search(["ALL", ["FROM", senderEmail]], (err, results) => {
    if (err) throw err;
    if (!results || !results.length) {
      console.log("No emails found from", senderEmail);
      return;
    }

    // Sort emails by time and fetch the latest one
    const latestEmailId = Math.max(...results);

    const f = imap.fetch(latestEmailId, { bodies: "" });
    f.on("message", (msg, seqno) => {
      const prefix = `(Message #${seqno}) `;
      msg.on("body", (stream) => {
        simpleParser(stream, async (err, parsed) => {
          if (err) {
            console.error(prefix + "Error parsing email:", err);
            return;
          }
          const { text, html } = parsed;
          const emailBody = text || html;
          console.log(emailBody);
          const otp = extractOtp(emailBody);

          if (otp) {
            console.log(prefix + "Extracted OTP:", otp);
            callback(otp);
          } else {
            console.log(prefix + "No OTP found in the email body.");
          }
        });
      });
      msg.once("attributes", (attrs) => {
        const { uid } = attrs;
        imap.addFlags(uid, ["\\Seen"], (err) => {
          if (err) console.error("Error marking email as read:", err);
        });
      });
    });
    f.once("error", (err) => {
      console.error("Fetch error:", err);
    });
  });
};

const main = async () => {
  const otpPromise = new Promise((resolve) => {
    imap.once("ready", () => {
      openInbox((err, box) => {
        if (err) throw err;
        console.log("Connection to inbox established");
        fetchLatestEmailFromSender("BankAlerts@kotak.com", resolve);
      });
    });

    imap.once("error", (err) => {
      console.error("Connection error:", err);
    });

    imap.once("end", () => {
      console.log("Connection ended");
    });

    imap.connect();
  });

  const otp = await otpPromise;
  console.log(otp);
  return otp;
};


  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://netbanking.kotak.com/knb2/", {
      waitUntil: "networkidle0",
    });

    await page.waitForSelector("#userName");
    await page.type("#userName", "890798789");

    await page.waitForSelector("#credentialInputField");
    await page.type("#credentialInputField", "Khushi@2007");
    setTimeout(async () => {
      await page.waitForSelector(
        ".btn.btn-primary.float-right.marb16.btnVertualsubmit.mt-3"
      );
      await page.click(
        ".btn.btn-primary.float-right.marb16.btnVertualsubmit.mt-3"
      );

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      // Wait for OTP input field and enter OTP
      await page.waitForSelector("#otpMobile");

      const otp = await main(); // Ensure the `main` function returns the OTP
      await page.type("#otpMobile", otp);

      await page.click(
        ".btn.btn-primary.float-right.btn-mar-right.ng-star-inserted"
      );

      await page.waitForNavigation({ waitUntil: "networkidle0" });

      // Wait for the element containing the form
      await page.waitForSelector(
        ".bg-gray.more-wrapper-align-reverse.more-wrapper-align-reverseNew"
      );
      await page.click(
        ".bg-gray.more-wrapper-align-reverse.more-wrapper-align-reverseNew"
      );

      setTimeout(async () => {
        const pageContent = await page.evaluate(
          () => document.documentElement.outerHTML
        );

        // Save the HTML content to a file
        fs.writeFileSync("pageContent.html", pageContent, "utf8");
        console.log("Page content saved to pageContent.html");

        const frames = page.frames();
        let targetFrame = null;

        for (const frame of frames) {
          if (frame.name() === "knb2ContainerFrame") {
            targetFrame = frame;
            break;
          }
        }

        if (targetFrame) {
          console.log('Found the target iframe "knb2ContainerFrame".');

          // Extract the complete HTML content of the target iframe
          const iframeContent = await targetFrame.content();
          fs.writeFileSync(
            "iframeContent_knb2ContainerFrame.html",
            iframeContent,
            "utf8"
          );
          console.log(
            'Saved content of iframe "knb2ContainerFrame" to iframeContent_knb2ContainerFrame.html'
          );

          // Extract and log the inner text of elements with specific classes inside the iframe
          // const elementInnerText = await targetFrame.evaluate(() => {
          //   const elements = document.querySelectorAll('.dataGrid.col5_01');
          //   return Array.from(elements).map(el => el.innerText).join('\n');
          // });

          // console.log('Inner text of elements with class "dataGrid col5_01" in iframe:', elementInnerText);
          try {
            //boxLinks

            // setInterval(async () => {
            if (targetFrame) {
              console.log('Found the target iframe "knb2ContainerFrame".');

              try {
                // Click on the first element with the class 'boxLinks'
                await targetFrame.evaluate(async () => {
                  // const firstBoxLink = document.querySelector('.boxLinks');
                  // if (firstBoxLink) {
                  //   firstBoxLink.click();
                  // }
                  const today = new Date();
                  const dd = String(today.getDate()).padStart(2, "0");
                  const mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
                  const yyyy = today.getFullYear();
                  const todayStr = `${dd}/${mm}/${yyyy}`;

                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 4);
                  const ydd = String(yesterday.getDate()).padStart(2, "0");
                  const ymm = String(yesterday.getMonth() + 1).padStart(2, "0");
                  const yyyyy = yesterday.getFullYear();
                  const yesterdayStr = `${ydd}/${ymm}/${yyyyy}`;
                  console.log(todayStr, yesterdayStr);
                  const frmDtElement = document.querySelector("#frmDt");
                  const toDtElement = document.querySelector("#toDt");

                  if (frmDtElement) {
                    frmDtElement.value = "";
                    frmDtElement.dispatchEvent(
                      new Event("input", { bubbles: true })
                    );
                    frmDtElement.value = yesterdayStr;
                    frmDtElement.dispatchEvent(
                      new Event("input", { bubbles: true })
                    );
                    frmDtElement.dispatchEvent(
                      new Event("change", { bubbles: true })
                    );
                  }

                  if (toDtElement) {
                    toDtElement.value = "";
                    toDtElement.dispatchEvent(
                      new Event("input", { bubbles: true })
                    );
                    toDtElement.value = todayStr;
                    toDtElement.dispatchEvent(
                      new Event("input", { bubbles: true })
                    );
                    toDtElement.dispatchEvent(
                      new Event("change", { bubbles: true })
                    );
                  }

                  const idGoButton = document.querySelector("#IdGo");
                  if (idGoButton) {
                    idGoButton.click();
                  }
                });
                console.log(
                  'Clicked on the first element with class "boxLinks".'
                );

                // Wait for 500 milliseconds
                await new Promise((resolve) => setTimeout(resolve, 5000));

                // Extract and log the inner text of elements with specific classes inside the iframe
                const elementInnerText = await targetFrame.evaluate(() => {
                  // Get all elements with the class 'dataGrid col5_01'
                  const elements =
                    document.querySelectorAll(".dataGrid.col5_01");

                  // Convert the NodeList to an array and extract the inner text
                  return Array.from(elements).map((el) => el.innerText);
                });

                // console.log(
                //   'Inner text of elements with class "dataGrid col5_01" in iframe:',
                //   elementInnerText
                // );

                // Process the extracted inner text to convert it into an array of objects
                const transactions = elementInnerText.flatMap((text) => {
                  // Split the text into lines and filter out empty lines
                  const lines = text
                    .split("\n")
                    .filter((line) => line.trim() !== "");

                  // Skip the header line
                  const [header, ...dataLines] = lines;

                  // Map the lines to transaction objects
                  return dataLines.reduce((acc, line, index) => {
                    // Assuming each transaction consists of 5 lines:
                    // date, description, reference, amount, and balance
                    if (index % 5 === 0) {
                      const [reference, description, amount, balance, date] =
                        dataLines.slice(index, index + 5);
                    //   console.log("reference", reference);
                    //   console.log("description", description);
                      const [type, ...restDescription] = description
                        ?.trim()
                        .split("-");
                      // Extract transaction ID from reference
                      const transactionIdMatch =
                        reference.match(/IMPS\/(\d+)\//);
                        const match = reference.match(/\/(\d+)$/);
                        const upiTxId = match ? match[1] : null;
                        
                      console.log('upi id',upiTxId)
                      const transactionId = transactionIdMatch
                        ? transactionIdMatch[1]
                        : null;

                      // Split the description to get type
                      if (transactionId) {
                        acc.push({
                          date: date?.trim(),
                          description: restDescription.join("-")?.trim(),
                          reference: reference?.trim(),
                          amount: amount?.trim(),
                          balance: parseFloat(
                            balance?.trim().replace(/[^0-9.-]+/g, "")
                          ), // Remove non-numeric characters
                          transactionId: transactionId?.trim(),
                          type: type?.trim(),
                        });
                      }
                      if (upiTxId) {
                        acc.push({
                          date: date?.trim(),
                          description: restDescription.join("-")?.trim(),
                          reference: reference?.trim(),
                          amount: amount?.trim(),
                          balance: parseFloat(
                            balance?.trim().replace(/[^0-9.-]+/g, "")
                          ), // Remove non-numeric characters
                          transactionId: upiTxId?.trim(),
                          type: type?.trim(),
                        });
                      }
                    }
                    return acc;
                  }, []);
                });

                // Log the transactions array
                console.log(transactions);
                if(transactions)
                {
                    transactions?.map(async (item)=>{
                        if(item?.type == 'UPI')
                        {
                            const query = {
                                transactionId: item.transactionId,
                              };
                              try{

                                  const transaction = await getTransaction(item.transactionId);
                                  const user = await getUserBalance2(query);
                                  console.log('tx',transaction)
                                  //console.log('user',user)
                                  if(transaction&&user)
                                  {
                                    let updateObj = {
                                        status: 'success',
                                        utr: '123456',
                                      };
                                      
                                       updateTransactionStatus(item.transactionId, updateObj);
                                  }
                                }catch(error)
                                {
                                    console.log(error)
                                }

                        }
                    })
                }
              } catch (e) {
                console.log(e);
              }
            } else {
              console.log('Target iframe "knb2ContainerFrame" not found.');
            }
            // }, 7000);
            //console.log('Transactions:', transactions);
          } catch (e) {
            console.log(e);
          }
        } else {
          console.log('Target iframe "knb2ContainerFrame" not found.');
        }
      }, 6000); // Adjust the timeout as needed
    }, 2000);
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // await browser.close();
  }



}


module.exports ={
    generateQrCode,

    payhubBankScrapper
}