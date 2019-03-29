<?php 
	
	$url = "http://localhost/spotidash";
	$client_id = 'f8c1676b7739450daf60050339b297b5';
	$client_secret = '6fa89bf4e01243d38414cee037b074e0';
	$redirect_uri = 'http://localhost/spotidash/auth.php';
	$token_uri = 'http://localhost/spotidash/refresh_token.php';
	$scope = [
		"user-read-email", 
		"user-read-currently-playing", 
		"user-read-playback-state",
		"user-modify-playback-state",
		"user-read-recently-played"
	];
	$scope = join("%20", $scope); // convert array to querystring

?>