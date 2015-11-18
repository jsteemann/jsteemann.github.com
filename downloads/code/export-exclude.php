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

  function transformDate($value) { 
    return preg_replace('/^(\\d+)-(\\d+)-(\\d+)$/', '\\2/\\3/\\1', $value);
  }

  function transform(array $document) {
    static $genders = array('male' => 'm', 'female' => 'f');

    $transformed = array(
      'gender'      => $genders[$document['gender']],
      'dob'         => transformDate($document['birthday']),
      'memberSince' => transformDate($document['memberSince']),
      'fullName'    => $document['name']['first'] . ' ' . $document['name']['last'],
      'email'       => $document['contact']['email'][0]
    );
   
    return $transformed;
  }

  function export($collection, Connection $connection) {
    $fp = fopen('output-transformed.json', 'w');

    if (! $fp) {
      throw new Exception('could not open output file!');
    }

    // settings to use for the export
    $settings = array(
      'batchSize' => 5000,  // export in chunks of 5K documents
      '_flat' => true,      // use simple PHP arrays
      'restrict' => array( 
        'type' => 'exclude',
        'fields' => array('_id', '_rev', '_key', 'likes')
      )
    ); 

    $export = new Export($connection, $collection, $settings);

    // execute the export. this will return an export cursor
    $cursor = $export->execute();

    // now we can fetch the documents from the collection in batches
    while ($docs = $cursor->getNextBatch()) {
      $output = '';
      foreach ($docs as $doc) {
        $output .= json_encode(transform($doc)) . PHP_EOL;
      } 

      // write out chunk
      fwrite($fp, $output);
    }

    fclose($fp);
  }

  // run the export
  export('users', $connection);

} catch (ConnectException $e) {
  print $e . PHP_EOL;
} catch (ServerException $e) {
  print $e . PHP_EOL;
} catch (ClientException $e) {
  print $e . PHP_EOL;
}
