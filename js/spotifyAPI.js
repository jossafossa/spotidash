class SpotifyAPI {		

	constructor(token, refresh_token, refresh_time) {
		this.token = token;
		this.refresh_token = refresh_token;
		this.refresh_time = (refresh_time - 100) * 1000;

		this.loop = new SpotifyLoop(this, 1000);

		var self = this;

		setTimeout(function() {self.refreshToken()}, this.refresh_time);
	}


	refreshToken() {
		// console.log("refresh_token.php?refresh_token=" + this.refresh_token);
		var self = this;
		this.buildRequest("GET", "refresh_token.php?refresh_token=" + this.refresh_token, function(token) {self.updateToken(token)});
	}

	updateToken(token) {
		console.log(token);
		this.token = token["access_token"];
		this.refresh_time = token["expires_in"] * 1000 - 100;
		var self = this;
		setTimeout(function() {self.refreshToken()}, this.refresh_time);
	}

	buildRequest(method, url, callback) {	
		var first = true;	
    var ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function(){
      if (ajax.readyState == 4 && ajax.status == 200){
        callback(JSON.parse(ajax.responseText));
      } else if (ajax.status == 204 && first) {
    		first = false;
    		if (callback) {    			
    			callback(false);
    		}
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
		this.buildRequest("POST", "https://api.spotify.com/v1/me/player/next", callback)
	}

	previous(callback) {	
		var self = this;
		this.buildRequest("POST", "https://api.spotify.com/v1/me/player/previous", callback);	
	}

	togglePlaying() {		
		this.loop.playingState = !this.loop.playingState;
		this.playing(this.loop.playingState);
	}

	playing(state, callback) {
		var self = this;
		if (state) {
			this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/play", callback);
		} else {			
			this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/pause", callback);
		}
	}

	toggleShuffle() {		
		this.loop.shuffleState = !this.loop.shuffleState;
		this.shuffle(this.loop.shuffleState);
	}

	shuffle(state, callback) {
		var self = this;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/shuffle?state=" + (state ? "true" : "false"), callback);
	}

	toggleRepeat() {		
		this.loop.repeatState = !this.loop.repeatState;
		this.repeat(this.loop.repeatState);
	}

	repeat(state, callback) {
		var self = this;
		this.buildRequest("PUT", "https://api.spotify.com/v1/me/player/repeat?state=" + (state ? "context" : "off") , callback);
	}

}

class SpotifyLoop {
	constructor(api, timeout) {
		this.api = api;
		this.timeout = timeout;
		this.loopObj;

		this.onReady = function(){};
		this.onActiveStateChange = function(){};
		this.onUpdate = function(){};
		this.onPlayerChange = function(){};
		this.onPlayingStateChange = function(){};
		this.onShuffleStateChange = function(){};
		this.onRepeatStateChange = function(){};
		this.onAlbumChange = function(){};
		this.onArtistChange = function(){};
		this.onSongChange = function(){};

		var self = this;
		this.api.playerInfo(function(data) {self.setInitialStates(data)});

		this.startLoop();
	}

	setInitialStates(playerInfo) {		
		this.active = true;
		if (playerInfo) {
			this.active = true;
			this.lastAlbum = playerInfo["item"]["album"]["id"];
			this.lastArtist = playerInfo["item"]["artists"][0]["id"];
			this.lastSong = playerInfo["item"]["id"];
			this.repeatState = playerInfo["repeat_state"] == "off" ? false : true;
			this.shuffleState = playerInfo["shuffle_state"];
			this.playingState = playerInfo["is_playing"];

			this.onReady(playerInfo);
		} else {
			if (playerInfo != this.active) {					
				this.active = false;
				var self = this;
				this.api.latestTrack(function(data) {self.onActiveStateChange(false)});
			}
		}
		
	}

	startLoop() {
		var self = this;
		this.loopObj = setInterval(function() {self.getPlayingData()}, self.timeout);
	}

	stopLoop() {
		clearInterval(this.loopObj);
	}

	getPlayingData() {
		var self = this;
		this.api.playerInfo(function(data) {self.loop(data)});
	}

	loop(playerInfo) {
		if (playerInfo) {
			if (this.playingState != playerInfo["is_playing"]) {
				this.playingState = playerInfo["is_playing"];
				this.onPlayerChange(playerInfo);
				this.onPlayingStateChange(playerInfo);
			}
			if (this.shuffleState != playerInfo["shuffle_state"]) {
				this.shuffleState = playerInfo["shuffle_state"];
				this.onPlayerChange(playerInfo);
				this.onShuffleStateChange(playerInfo);
			}
			if (this.repeatState != (playerInfo["repeat_state"] == "off" ? false : true)) {
				this.repeatState = playerInfo["repeat_state"] == "off" ? false : true;
				this.onPlayerChange(playerInfo);
				this.onRepeatStateChange(playerInfo);
			}
			if (this.lastAlbum != playerInfo["item"]["album"]["id"]) {
				this.lastAlbum = playerInfo["item"]["album"]["id"];
				this.onAlbumChange(playerInfo);
			}
			if (this.lastArtist != playerInfo["item"]["artists"][0]["id"]) {
				this.lastArtist = playerInfo["item"]["artists"][0]["id"];
				this.onArtistChange(playerInfo);
			}
			if (this.lastSong != playerInfo["item"]["id"]) {
				this.lastSong = playerInfo["item"]["id"];
				this.onSongChange(playerInfo);
			}
			this.onUpdate(playerInfo);
		}

		var playing = playerInfo == false ? false : true

		if (playing != this.active) {
			this.active = playing;
			var self = this;
			this.api.latestTrack(function(data) {self.onActiveStateChange(self.active)});			
		}
	}
}

class SpotiDash {
	constructor(api, config ) {
		this.imageElem = 				document.querySelectorAll(config["image"]);
		this.backgroundElem = 	document.querySelectorAll(config["background"]);
		this.titleElem = 				document.querySelectorAll(config["title"]);
		this.artistElem = 			document.querySelectorAll(config["artist"]);
		this.albumElem = 				document.querySelectorAll(config["album"]);
		this.progressBarElem = 	document.querySelectorAll(config["progressBar"]);
		this.durationTimeElem = document.querySelectorAll(config["durationTime"]);
		this.progressTimeElem = document.querySelectorAll(config["progressTime"]);
		this.shuffle = 					document.querySelectorAll(config["shuffle"]);
		this.previous = 				document.querySelectorAll(config["previous"]);
		this.play = 						document.querySelectorAll(config["play"]);
		this.next = 						document.querySelectorAll(config["next"]);
		this.repeat = 					document.querySelectorAll(config["repeat"]);
		this.api = api;

		var self = this;
		this.api.loop.onReady = function(playerInfo) {
			self.updateSong(playerInfo);
			self.updateTimer(playerInfo);
			self.updateButtons(playerInfo);
		}

		this.api.loop.onActiveStateChange = function(state) {
			if (!state) {
				self.api.latestTrack(function(latest) {
					var track = latest["items"][latest["items"].length - 1]["track"]
					self.updateSong({"item": track});
				})

				self.disableUI();
			} else {
				self.enableUI();
			}
		}


		this.api.loop.onSongChange = function(playerInfo) {
			self.updateSong(playerInfo);
		}

		this.api.loop.onUpdate = function(playerInfo) {
			self.updateTimer(playerInfo);
		}

		this.api.loop.onPlayerChange = function(playerInfo) {
			self.updateButtons(playerInfo);
		}

		this.setupListener(this.shuffle, 	function() { self.toggleShuffle(); });
		this.setupListener(this.previous, function() { self.api.previous(); });
		this.setupListener(this.play, 		function() { self.togglePlaying(); });
		this.setupListener(this.next, 		function() { self.api.next(); });
		this.setupListener(this.repeat, 	function() { self.toggleRepeat(); });
	}

	setupListener(element, callback) {
		var self = this;
		element.forEach(
			(el) => el.addEventListener('click', callback)
		);
	}

	toggleShuffle() {
		this.api.toggleShuffle();
		this.setButtonState(this.shuffle, this.api.loop.shuffleState);
	}

	togglePlaying() {
		this.api.togglePlaying();
		this.setButtonState(this.play, this.api.loop.playingState);
	}

	toggleRepeat() {
		this.api.toggleRepeat();
		this.setButtonState(this.repeat, this.api.loop.repeatState);
	}

	setButtonState(element, state) {
		element.forEach(function(item) {
			if (state) {
				item.classList.add("active");
			} else {
				item.classList.remove("active");
			}
		})
	}

	disableUI() {
		this.disableButton(this.shuffle);
		this.disableButton(this.previous);
		this.disableButton(this.play);
		this.disableButton(this.next);
		this.disableButton(this.repeat);
	}

	enableUI() {
		this.enableButton(this.shuffle);
		this.enableButton(this.previous);
		this.enableButton(this.play);
		this.enableButton(this.next);
		this.enableButton(this.repeat);
	}

	disableButton(element) {
		element.forEach(function(item) { item.classList.add("disabled")});
	}

	enableButton(element) {		
		element.forEach(function(item) { item.classList.remove("disabled") });
	}

	updateButtons(playerInfo) {		
		this.setButtonState(this.repeat, this.api.loop.repeatState);
		this.setButtonState(this.play, this.api.loop.playingState);
		this.setButtonState(this.shuffle, this.api.loop.shuffleState);
	}

	updateSong(playerInfo) {
		console.log("updating song");
		this.updateText(this.titleElem, playerInfo["item"]["name"]);
		this.updateText(this.artistElem, playerInfo["item"]["artists"][0]["name"]);
		this.updateText(this.albumElem, playerInfo["item"]["album"]["name"]);	
		this.updateImage(this.imageElem, playerInfo["item"]["album"]["images"][0]["url"]);
		this.updateBackground(this.backgroundElem, playerInfo["item"]["album"]["images"][0]["url"]);
	}

	updateTimer(playerInfo) {
		this.updateText(this.progressTimeElem, this.toTime(playerInfo["progress_ms"]))
		this.updateProgressBar(this.progressBarElem, playerInfo["progress_ms"], playerInfo["item"]["duration_ms"]);
		this.updateText(this.durationTimeElem, this.toTime(playerInfo["item"]["duration_ms"] - playerInfo["progress_ms"]))

	}

	toTime(time) {
		time = Math.round(time / 1000);
		var secs = time % 60;
	  time = (time - secs) / 60;
	  var mins = time % 60;
	  return mins+ ":" + ((secs.toString().length == 1) ? ("0" + secs) : secs);
	}

	updateText(element, text) {
		element.forEach(function(item) { item.innerHTML = text });
	}

	updateImage(element, url) {
		element.forEach(function(item) { item.src = url; });
	}

	updateBackground(element, url) {
		element.forEach(function(item) { item.style.backgroundImage = "url(" + url + ")"; });
	}

	updateProgressBar(element, from, to) {		
		var width = 100 / to * from + "%";
		element.forEach(function(item) { item.style.width = width });
	}
}

class SpotiFancyDash extends SpotiDash {
	constructor(api, config) {
		super(api, config);
	}

	updateImage(element, url) {
		var self = this;
		this.imageElem.forEach(function(item) {
			var last = item.children[item.children.length -1];
			console.log(last);
			if (last) {
				self.animateOut(last);
			}
			var image = document.createElement("img"); 
			image.src = url;
			item.append(image);
			self.animateIn(image);
		});
	}

	updateBackground(element, url) {
		var self = this;
		this.backgroundElem.forEach(function(item) {
			var last = item.children[item.children.length -1];
			console.log(last);
			if (last) {
				self.animateOut(last);
			}
			var bg = document.createElement("div"); 
			bg.style.backgroundImage = "url(" + url + ")";
			item.append(bg);
			self.animateIn(bg);
		});
	}

	animateOut(element) {
		element.classList.add("animate-out");

		var self = this;
		setTimeout(function() {
			self.removeElement(element);
		}, 1000)
	}

	animateIn(element) {
		element.classList.add("animate-in")
		var self = this;
		setTimeout(function() {
			self.stopAnimating(element);
		}, 1000)
	}

	stopAnimating(element) {
		element.classList.remove("animate-in");
	}

	removeElement(element) {
		element.remove();
	}
}

var api = new SpotifyAPI(spotify["token"],  spotify["refresh_token"], spotify["expires_in"]);
var config = {
	"image": ".image",
	"background": ".background",
	"title": ".title",
	"artist": ".artist",
	"album": ".album",
	"progressTime": ".progress",
	"durationTime": ".duration",
	"progressBar": ".bar > span",
	"shuffle": ".shuffle",
	"previous": ".previous",
	"play": ".play",
	"next": ".next",
	"repeat": ".repeat",
}

spotiDash = new SpotiFancyDash(api, config);

