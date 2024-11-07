async function generateTokenGlobalpay(details)
{
    const response = await fetch('https://api.gsxsolutions.com/user/login',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(details),
    })
    const resJson = await response.json()
    console.log('token globalPay',resJson)
    if(resJson?.token)
    {
        return resJson?.token
    }
    return false
}

async function getPayinPageGlobalpay(details)
{
    const response = await fetch('https://api.gsxsolutions.com/payin/hosted/hostedPage',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(details),
    })
    const resJson = await response.json()
    console.log('page generated globalPay',resJson)
    if(resJson?.statusCode==200)
    {
        return resJson
    }
    return false
}

module.exports={
    generateTokenGlobalpay,

    getPayinPageGlobalpay
}