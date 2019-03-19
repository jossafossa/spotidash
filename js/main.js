class SpotifyAPI {
	constructor(token, refresh_token, refresh_time) {
		this.token = token;
		this.refresh_token = refresh_token;
		this.refresh_time = refresh_time - 100;

		var self = this;
		this.playerInfo(function(e) {self.setInitialStates(e)});
	}

	setInitialStates(playerInfo) {
		console.log(playerInfo);
		this.shuffle = playerInfo["shuffle_state"];
		this.repeat = playerInfo["repeat_state"] == "off" ? false : true;
		this.playing = playerInfo["is_playing"];
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

	currentTrack(callback) {
		this.buildRequest("GET", "https://api.spotify.com/v1/me/player/currently-playing", callback);
	}

	audioAnalysis(callback) {
		this.buildRequest("GET", "https://api.spotify.com/v1/audio-analysis/", callback);
	}

	latestTrack(callback) {
		this.buildRequest("GET", "https://api.spotify.com/v1/me/player/recently-played", callback);
	}

	playerInfo(callback) {
		this.buildRequest("GET", "https://api.spotify.com/v1/me/player", callback);
	}

	next(callback) {		
		this.buildRequest("POST", "https://api.spotify.com/v1/me/player/next", callback);
	}

	previous(callback) {		
		this.buildRequest("POST", "https://api.spotify.com/v1/me/player/previous", callback);
	}

	togglePlayState(callback) {
		if (this.playing) {			
			this.pause();
		} else {
			this.play();
		}
	}

	play(callback) {
		this.playing = true;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/play", callback);
	}

	pause(callback) {	
		this.playing = false;	
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/pause", callback);
	}	

	toggleShuffle(callback) {
		if (this.shuffle) {			
			this.disableShuffle();
		} else {
			this.enableShuffle();
		}
	}

	enableShuffle(callback) {
		this.shuffle = true;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/shuffle?state=true", callback);
	}

	disableShuffle(callback) {
		this.shuffle = false;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/shuffle?state=false", callback);
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
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/repeat?state=context", callback);
	}

	disableRepeat(callback) {
		this.repeat = false;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/repeat?state=off", callback);
	}

	getAlbum(id, callback) {		
		this.buildRequest("GET", `https://api.spotify.com/v1/albums/${id}`, callback);
	}

	getArtistTopTracks(id, callback) {		
		this.buildRequest("GET", `https://api.spotify.com/v1/artists/${id}/top-tracks`, callback);
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
		setInterval(function() {self.update()}, 1000);

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
		// console.log(track, this);	
		var artist = track["item"]["artists"][0]["name"];

		this.setText(this.titleElem, track["item"]["name"]);
		this.setText(this.artistElem, artist);
		this.setText(this.albumElem, track["item"]["album"]["name"]);	
		this.setImage(this.imageElem, track["item"]["album"]["images"][0]["url"]);
		this.setBackground(this.backgroundElem, track["item"]["album"]["images"][0]["url"]);
		this.setText(this.progressElem, this.toTime(track["progress_ms"]));
		this.setText(this.durationElem, this.toTime(track["item"]["duration_ms"] - track["progress_ms"]));
		this.setLength(this.timeBarElem, track["progress_ms"], track["item"]["duration_ms"])

	}

	setText(element, text) {
		for (var i = 0; i < element.length; i++) {
			element[i].innerHTML = text;
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
		time = Math.floor(time / 1000);
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