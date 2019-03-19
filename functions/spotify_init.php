<?php 
	function init_api() {
		session_start();

		if (!isset($_SESSION["code"])) {
			header("location: http://localhost/spotidash/auth.php");
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