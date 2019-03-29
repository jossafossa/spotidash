<?php 
	include "settings.php";

	$token_url = "https://accounts.spotify.com/api/token";

		$body = array(
			"grant_type" => "refresh_token",
			"refresh_token" => $_GET["refresh_token"],
		  'client_id' => $client_id,
		  'client_secret' => $client_secret
		);

		$opts = array(
			'http' => array(
		    'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
		    'content' => http_build_query($body)
		  )
		);

		$context  = stream_context_create($opts);

		$result = json_decode( file_get_contents($token_url, false, $context) );

		$token = $result->access_token;

		echo json_encode($result);

 ?>