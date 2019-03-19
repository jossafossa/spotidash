<?php 
	include "settings.php";

	session_start();
	// api settings
	
	/////////////////////////////////////////////////////////////////////////
	// GET CODE
	/////////////////////////////////////////////////////////////////////////
	if ( !isset( $_GET["code"]) ) {
		header("Location: https://accounts.spotify.com/authorize?client_id={$client_id}&redirect_uri={$redirect_uri}&scope={$scope}&response_type=code");
	} else {
		$code = $_GET["code"];
	}
	/////////////////////////////////////////////////////////////////////////
	// GET ACCESS TOKEN
	/////////////////////////////////////////////////////////////////////////
	$token_url = "https://accounts.spotify.com/api/token";
	$body = array(
		"grant_type" => "authorization_code",
	  "code" => $code,
	  "redirect_uri" => $redirect_uri,
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
	$refresh_token = $result->refresh_token;
	$expires_in = $result->expires_in;

	$_SESSION["code"] = $_GET["code"];
	$_SESSION["token"] = $token;
	$_SESSION["refresh_token"] = $refresh_token;
	$_SESSION["expires_in"] = $expires_in;

	header("refresh:0.1;url=" . $url)
?>