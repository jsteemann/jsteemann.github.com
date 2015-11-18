<?php

namespace triagens\ArangoDb;

// use the driver's autoloader to load classes
require 'arangodb-php/autoload.php';
Autoloader::init();

// set up connection options
$connectionOptions = array(
  // endpoint to connect to
  ConnectionOptions::OPTION_ENDPOINT     => 'tcp://localhost:8529', 
  // can use Keep-Alive connection
  ConnectionOptions::OPTION_CONNECTION   => 'Keep-Alive',           
  // use basic authorization
  ConnectionOptions::OPTION_AUTH_TYPE    => 'Basic',                 
  // user for basic authorization
  ConnectionOptions::OPTION_AUTH_USER    => 'root',                      
  // password for basic authorization
  ConnectionOptions::OPTION_AUTH_PASSWD  => '',                      
  // timeout in seconds
  ConnectionOptions::OPTION_TIMEOUT      => 30,
  // database name 
  ConnectionOptions::OPTION_DATABASE     => '_system'
);

try {
  // establish connection
  $connection = new Connection($connectionOptions);

  echo 'Connected!' . PHP_EOL;

  // TODO: now do something useful with the connection!

} catch (ConnectException $e) {
  print $e . PHP_EOL;
} catch (ServerException $e) {
  print $e . PHP_EOL;
} catch (ClientException $e) {
  print $e . PHP_EOL;
}

