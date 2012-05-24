define([
	"jquery",
	"backbone",
	"underscore",
	"marionette",
	"models/PlayerModel",
	"views/PlayerFsm",
	"text!templates/player.html"
	], function($, Backbone, _, Marionette, PlayerModel, PlayerFsm, ViewTemplate) {
	
	var PlayerView = Backbone.Marionette.ItemView.extend({
		template: ViewTemplate,
		tagName: 'div',
		
		initialize: function(options) {
			this.audioEl = options.audioElement;
			this.$audioEl = $(this.audioEl);
			this.playerFsm = new PlayerFsm(options.audioElement);
			var self = this;

			this.playerFsm.on("Error", function() {
				var errorMessage = "Unknown";
				if (self.audioEl.error) {
					switch(self.audioEl.error.code) {
						case 1 :
							errorMessage = "Aborted";
							break;
						case 2 :
							errorMessage = "Network";
							break;
						case 3 :
							errorMessage = "Decode";
							break;
						default :
							break;
					}
				}
				console.warn("[Player Error:%s]", errorMessage, self.audioEl.error, self.audioEl);
				self.vent.trigger("analytics:trackevent", "LiveStream", "error", errorMessage);
			});


			_.bindAll(this, "render", "handleAudioPlay", "handleAudioPause", "handleAudioBuffer",
				"handleAudioError", "handleTogglePlay", "handleChangeVolume", "handleToggleMute");

			
			this.$audioEl.on("playing", this.handleAudioPlay);
			this.$audioEl.on("pause", this.handleAudioPause);
			this.$audioEl.on("waiting", this.handleAudioBuffer);
			this.$audioEl.on("error", this.handleAudioError);

			this.model = new PlayerModel({
				volume: this.audioEl.volume * 10,
				muted: this.audioEl.muted
			});

			this.playerFsm.handle("initialize");
			if (this.playerFsm.state === "playing") {
				this.model.set({"paused": false});
			}

			// Model Event Handler
			this.model.bind("change:message", this.handleChangeMessage);
			this.model.bind("change:paused", this.handleChangePaused);
			this.model.bind("change:muted", this.handleChangeMuted);
			this.model.bind("change:disabled", this.handleChangeDisabled);
		},
		beforeClose: function() {
			this.$audioEl.off("playing", this.handleAudioPlay);
			this.$audioEl.off("pause", this.handleAudioPause);
			this.$audioEl.off("waiting", this.handleAudioBuffer);
			this.$audioEl.off("error", this.handleAudioError);
		},
		events: {
			"click #player-button": "handleTogglePlay",
			"change #player-volume": "handleChangeVolume",
			"click #player-mute": "handleToggleMute"
		},
		handleAudioPlay: function(event) {
			console.debug("[AudioElement] OnPlaying", event);
			this.model.set({
				"message": "Live Stream",
				"paused": false,
				"disabled": false
			});
		},
		handleAudioPause: function(event) {
			console.debug("[AudioElement] OnPause", event);
			this.model.set({
				"message": "Paused",
				"paused": true,
				"disabled": false
			});
		},
		handleAudioBuffer: function(event) {
			console.debug("[AudioElement] OnWaiting", event);
			this.model.set({
				"message": "Buffering",
				"disabled": true
			});
		},
		handleAudioError: function(event) {
			console.warn("[AudioElement] OnError", event);
			this.model.set({
				"message": "Stream Error",
				"paused": true,
				"disabled": false
			});
			this.playerFsm.transition("error");
		},
		handleTogglePlay: function() {
			this.playerFsm.handle("toggle");
			this.vent.trigger("analytics:trackevent", "LiveStream", "PlayToggle", this.playerFsm.state);
		},
		handleChangeVolume: function() {
			var currentVolume = $("#player-volume").val();
			var calcVolume = (currentVolume === 0) ? 0 : currentVolume / 10;
			if (this.audioEl.volume !== calcVolume && this.audioEl.muted && calcVolume !== 0) {
				this.handleToggleMute();
			}
			this.audioEl.volume = calcVolume;
			this.model.set({volume: calcVolume});
		},
		handleToggleMute: function() {
			this.vent.trigger("analytics:trackevent", "LiveStream", "Mute", !this.audioEl.muted);
			this.audioEl.muted = !this.audioEl.muted;
			this.model.set({muted: this.audioEl.muted});
		},
		handleChangeMessage: function(model, value, options) {
			console.log("[Player] Previous Status: " + $("#player-status").text());
			$("#player-status").text(value);
			console.log("[Player] Current Status: " + $("#player-status").text());
		},
		handleChangePaused: function(model, value, options) {
			$("#player-button").html(value ? '<i class="icon-play icon-white"></i> Play' : '<i class="icon-pause icon-white"></i> Pause');
		},
		handleChangeMuted: function(model, value, options) {
			$("#player-mute").attr("class", (value ? "icon-volume-off" : "icon-volume-up"));
		},
		handleChangeDisabled: function(model, value, options) {
			var result = value ? $("#player-button").attr("disabled", "disabled") : $("#player-button").removeAttr("disabled");
		}
	});

	return PlayerView;
});