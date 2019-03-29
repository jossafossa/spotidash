class SpotifyAPI {
	constructor(token, refresh_token, refresh_time) {
		this.token = token;
		this.refresh_token = refresh_token;
		this.refresh_time = refresh_time - 100;

		// var self = this;
		// this.playerInfo(function(e) {self.setInitialStates(e)});

		this.onUpdate = function(){};
		this.onSongChange = function(){};
		this.onAlbumChange = function(){};
		this.onArtistChange = function(){};
		this.onPlayerChange = function(){};

		this.startLoop();
	}

	startLoop(interval = 1000) {
		this.latestInfo = [];
		this.shuffle = false;
		this.repeat = false;
		this.playing = false;
		var self = this;
		setInterval(function() {self.loop()}, interval);
	}

	loop() {
		var self = this;
		this.playerInfo(function(info) {self.updatePlayerStates(info); self.updateTrackStates(info)});
	}

	updateTrackStates(info) {
		if (this.latestInfo.length == 0) {
			this.latestInfo = info;
		}
		if (info["item"]["id"] != this.latestInfo["item"]["id"]) { this.onSongChange(info); }
		if (info["item"]["album"]["id"] != this.latestInfo["item"]["album"]["id"]) { this.onAlbumChange(info); }
		if (info["item"]["artists"][0]["id"] != this.latestInfo["item"]["artists"][0]["id"]) { this.onArtistChange(info); }
		this.latestInfo = info;
	}

	updatePlayerStates(playerInfo = false) {
		if (!playerInfo) {
			playerInfo = this.latestInfo;
		}

		if (playerInfo["shuffle_state"] != this.shuffle) { this.onPlayerChange(playerInfo); }
		this.shuffle = playerInfo["shuffle_state"];

		var repeat = playerInfo["repeat_state"] == "off" ? false : true;
		if (repeat != this.repeat) { this.onPlayerChange(playerInfo); }
		this.repeat = repeat;

		if (playerInfo["is_playing"] != this.playing) { this.onPlayerChange(playerInfo); }
		this.playing = playerInfo["is_playing"];		
		this.onUpdate(playerInfo);
	}

	buildRequest(method, url, callback) {		
    var ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function(){
      if (ajax.readyState == 4 && ajax.status == 200){
        callback(JSON.parse(ajax.responseText));
      }
    }
    ajax.open(method, url, true);
    ajax.setRequestHeader('Authorization', 'Bearer ' + this.token)
    ajax.send();
	}

	currentTrack(callback) { this.buildRequest("GET", "https://api.spotify.com/v1/me/player/currently-playing", callback); }

	audioAnalysis(callback) {	this.buildRequest("GET", "https://api.spotify.com/v1/audio-analysis/", callback);	}

	latestTrack(callback) {	this.buildRequest("GET", "https://api.spotify.com/v1/me/player/recently-played", callback);	}

	playerInfo(callback) { this.buildRequest("GET", "https://api.spotify.com/v1/me/player", callback); }

	getAlbum(id, callback) { this.buildRequest("GET", `https://api.spotify.com/v1/albums/${id}`, callback);	}

	getArtistTopTracks(id, callback) { this.buildRequest("GET", `https://api.spotify.com/v1/artists/${id}/top-tracks`, callback);	}

	next(callback) { 
		var self = this;
		this.buildRequest("POST", "https://api.spotify.com/v1/me/player/next", function(data) { 
			self.updatePlayerStates();
			callback(data);
		})
	}

	previous(callback) {	
		var self = this;
		this.buildRequest("POST", "https://api.spotify.com/v1/me/player/previous", function(data) { 
			self.updatePlayerStates();
			callback(data);
		});	
	}

	togglePlayState(callback) {
		if (this.playing) {			
			this.pause(callback);
		} else {
			this.play(callback);
		}
	}

	play(callback) {
		var self = this;
		this.playing = true;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/play", function(data) { 
			self.updatePlayerStates();
			callback(data);
		});
	}

	pause(callback) {	
		var self = this;
		this.playing = false;	
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/pause", function(data) { 
			self.updatePlayerStates();
			callback(data);
		});
	}	

	toggleShuffle(callback) {
		if (this.shuffle) {			
			this.disableShuffle(callback);
		} else {
			this.enableShuffle(callback);
		}
	}

	enableShuffle(callback) {
		this.shuffle = true;
		var self = this;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/shuffle?state=true", function(data) { 
			self.updatePlayerStates();
			callback(data);
		});
	}

	disableShuffle(callback) {
		this.shuffle = false;
		var self = this;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/shuffle?state=false", function(data) { 
			self.updatePlayerStates();
			callback(data);
		});
	}

	toggleRepeat(callback) {
		if (this.repeat) {			
			this.disableRepeat();
		} else {
			this.enableRepeat();
		}
	}

	enableRepeat(callback) {
		this.repeat = true;
		var self = this;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/repeat?state=context", function(data) { 
			self.updatePlayerStates();
			callback(data);
		});
	}

	disableRepeat(callback) {
		this.repeat = false;
		var self = this;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/repeat?state=off", function(data) { 
			self.updatePlayerStates([]);
			callback(data);
		});
	}
} 


class SpotiDash {
	constructor(api, config ) {
		this.imageElem = 			document.querySelectorAll(config["image"]);
		this.backgroundElem = document.querySelectorAll(config["background"]);
		this.titleElem = 			document.querySelectorAll(config["title"]);
		this.artistElem = 		document.querySelectorAll(config["artist"]);
		this.albumElem = 			document.querySelectorAll(config["album"]);
		this.progressElem = 	document.querySelectorAll(config["progress"]);
		this.durationElem = 	document.querySelectorAll(config["duration"]);
		this.timeBarElem = 		document.querySelectorAll(config["progressBar"]);
		this.shuffle = 				document.querySelectorAll(config["shuffle"]);
		this.previous = 			document.querySelectorAll(config["previous"]);
		this.play = 					document.querySelectorAll(config["play"]);
		this.next = 					document.querySelectorAll(config["next"]);
		this.repeat = 				document.querySelectorAll(config["repeat"]);
		this.api = api;
		this.currentTrack;

		var self = this;
		// setInterval(function() {self.update()}, 1000);
		
		this.api.onSongChange = 	function(track) {self.setInfo(track)};
		this.api.onPlayerChange = function(info) {self.setPlayerStates(info)};
		this.api.onUpdate = 			function(info) {self.setTime(info)};

		this.setupListener(this.shuffle, function() {self.api.toggleShuffle()});
		this.setupListener(this.previous, function() {self.api.previous()});
		this.setupListener(this.play, function() {self.api.togglePlayState()});
		this.setupListener(this.next, function() {self.api.next()});
		this.setupListener(this.repeat, function() {self.api.toggleRepeat()});
		this.update();
	}

	setupListener(element, callback) {
		var self = this;
		element.forEach(
			(el) => el.addEventListener('click', callback)
		);
	}

	update() {
		var self = this;
		var currentTrack = api.currentTrack(function(track) {self.setInfo(track)});
	}

	setInfo(track) {
		console.log("updating track display");
		var artist = track["item"]["artists"][0]["name"];

		this.setText(this.titleElem, track["item"]["name"]);
		this.setText(this.artistElem, artist);
		this.setText(this.albumElem, track["item"]["album"]["name"]);	
		this.setImage(this.imageElem, track["item"]["album"]["images"][0]["url"]);
		this.setBackground(this.backgroundElem, track["item"]["album"]["images"][0]["url"]);
	}

	setPlayerStates(info) {	
		console.log("updating player");
		this.setState(this.shuffle, info["shuffle_state"]);

		this.setState(this.play, info["is_playing"]);

		var repeat = info["repeat_state"] == "off" ? false : true;
		this.setState(this.repeat, repeat);

	}

	setTime(info) {
		// console.log("updating track progress");
		this.setText(this.progressElem, this.toTime(info["progress_ms"]));
		this.setText(this.durationElem, this.toTime(info["item"]["duration_ms"] - info["progress_ms"]));
		this.setLength(this.timeBarElem, info["progress_ms"], info["item"]["duration_ms"])
	}

	setText(element, text) {
		for (var i = 0; i < element.length; i++) {
			element[i].innerHTML = text;
		}
	}

	setState(element, state) {
		if(state) {
			for (var i = 0; i < element.length; i++) {
				element[i].classList.add("active");
			}
		} else {
			for (var i = 0; i < element.length; i++) {
				element[i].classList.remove("active");
			}
		}
	}

	setImage(element, url) {
		for (var i = 0; i < element.length; i++) {
			element[i].src = url;
		}
	}

	setBackground(element, url) {
		for (var i = 0; i < element.length; i++) {
			element[i].style.backgroundImage = "url(" + url + ")";
		}
	}

	setLength(element, time, duration) {
		var width = 100 / duration * time;
		for (var i = 0; i < element.length; i++) {
			element[i].style.width = width + "%";
		}
	}

	toTime(time) {
		time = Math.round(time / 1000);
		var secs = time % 60;
	  time = (time - secs) / 60;
	  var mins = time % 60;
	  return mins+ ":" + ((secs.toString().length == 1) ? ("0" + secs) : secs);
	}



}
var api = new SpotifyAPI(spotify["token"],  spotify["refresh_token"], spotify["refresh_time"]);

var config = {
	"image": ".image",
	"background": ".background",
	"title": ".title",
	"artist": ".artist",
	"album": ".album",
	"progress": ".progress",
	"duration": ".duration",
	"progressBar": ".bar > span",
	"shuffle": ".shuffle",
	"previous": ".previous",
	"play": ".play",
	"next": ".next",
	"repeat": ".repeat",
}

var spotidash = new SpotiDash(api, config);