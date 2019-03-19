<?php 
	function init_api() {
		global $redirect_uri;
		session_start();

		if (!isset($_SESSION["code"])) {
			header("location: " . $redirect_uri);
		}

		$code = $_SESSION["code"];
		$token = $_SESSION["token"];
		$refresh_token = $_SESSION["refresh_token"];
		$expires_in = $_SESSION["expires_in"];
		$data = $_SESSION;
		session_destroy();
		return $data;
	}


 ?>