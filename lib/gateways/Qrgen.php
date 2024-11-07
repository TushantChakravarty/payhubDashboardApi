<?php

$username = '2374952'; // Username
$password = 'EpSl3xNJ'; // Password
$secret = 'RbVqe3xTjiwvlYCB'; // API key
$mercid = '12234' ;

$key256 = hash('SHA256', $username."~:~".$password);





$orderid    = "230918184855912BuA4lwHk";
$amt        = "300.00";
$buyerPhone = "9999999999";
$buyerEmail = "test@gmail.com";
$mer_dom    = base64_encode('http://localhost');
$call_type  = "upiqr";


$alldata = $mercid.$orderid.$amt.$buyerPhone.$buyerEmail.$mer_dom.$call_type;

$checksum = hash('SHA256', $key256.'@'.$alldata.date('Y-m-d'));

$fields               = array();
$fields['mercid']     = $mercid;
$fields['orderid']    = $orderid;
$fields['amount']     = $amt;
$fields['buyerPhone'] = $buyerPhone;
$fields['buyerEmail'] = $buyerEmail;
$fields['mer_dom']    = $mer_dom;
$fields['call_type']  = $call_type;

$json_data = json_encode($fields);

$encKey = md5($secret);
$iv = bin2hex(openssl_random_pseudo_bytes(8));
$raw = openssl_encrypt( $json_data , "AES-256-CBC" , $encKey, $options=OPENSSL_RAW_DATA , $iv);
$encData = $iv . base64_encode($raw);


$curl = curl_init();

$post_fields = json_encode(array('encData'=>$encData,'checksum'=>$checksum,'mercid'=>$mercid));

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://kraken.airpay.co.in/airpay/api/generateOrder.php',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS =>$post_fields,
  CURLOPT_HTTPHEADER => array(
    'Content-Type: application/json'
  ),
));

 $response = curl_exec($curl);

curl_close($curl);

$redData = json_decode($response);

$encryptedData = $redData->data;

$iv = substr($encryptedData, 0, 16);
$data = substr($encryptedData, 16);


$DecryptedData = openssl_decrypt(base64_decode($data), 'AES-256-CBC', $encKey, $options=OPENSSL_RAW_DATA, $iv);
print_r($DecryptedData);


?>