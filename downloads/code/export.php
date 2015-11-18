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

  function export($collection, Connection $connection) {
    $fp = fopen("output.json", "w");

    if (! $fp) {
      throw new Exception("could not open output file!");
    }

    // settings to use for the export
    $settings = array(
      "batchSize" => 5000,  // export in chunks of 5K documents
      "_flat" => true       // use simple PHP arrays
    );

    $export = new Export($connection, $collection, $settings);

    // execute the export. this will return an export cursor
    $cursor = $export->execute();

    // statistics 
    $count   = 0;
    $batches = 0;
    $bytes   = 0;

    // now we can fetch the documents from the collection in batches
    while ($docs = $cursor->getNextBatch()) {
      $output = "";
      foreach ($docs as $doc) {
        $output .= json_encode($doc) . PHP_EOL;
      } 

      // write out chunk
      fwrite($fp, $output);

      // update statistics
      $count += count($docs);
      $bytes += strlen($output);
      ++$batches;
    }

    fclose($fp);

    echo sprintf("written %d documents in %d batches with %d total bytes", $count, $batches, $bytes) . PHP_EOL;
  }

  export("users", $connection);

} catch (ConnectException $e) {
  print $e . PHP_EOL;
} catch (ServerException $e) {
  print $e . PHP_EOL;
} catch (ClientException $e) {
  print $e . PHP_EOL;
}
