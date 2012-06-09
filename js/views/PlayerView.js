define([
	"jquery",
  "backbone-kexp",
	"underscore",
	"marionette",
	"models/PlayerModel",
	"views/PlayerFsm",
	"text!templates/player.html"
	], function($, Backbone, _, Marionette, PlayerModel, PlayerFsm, ViewTemplate) {
	
	var PlayerView = Backbone.Marionette.ItemView.extend({
		template: ViewTemplate,
		tagName: "div",
		className: "container-player",
		
		initialize: function(options) {
			this.audioEl = options.audioElement;
			
			if (!_.isObject(this.model)) {
				this.model = new PlayerModel({
					volume: this.audioEl.volume * 10,
					muted: this.audioEl.muted
				});
			}

			this.playerFsm = new PlayerFsm(options.audioElement, this.model);
			_.bind(this.handleStreamError, this);
			this.playerFsm.on("error", this.handleStreamError);

			// Bind Model Event Handlers
			this.bindTo(this.model, "change:message", this.handleModelChangeMessage);
			this.bindTo(this.model, "change:paused", this.handleModelChangePaused);
			this.bindTo(this.model, "change:muted", this.handleModelChangeMuted);
			this.bindTo(this.model, "change:volume", this.handleModelChangeVolume);
			this.bindTo(this.model, "change:disabled", this.handleModelChangeDisabled);
		},
		events: {
			"click #player-button": "handleInputTogglePlay",
			"change #player-volume": "handleInputChangeVolume",
			"click #player-mute": "handleInputToggleMute"
		},
		beforeRender: function() {
			// Init State & Model
			this.playerFsm.handle("initialize");
		},
		handleStreamError: function(error) {
			var errorMessage = "Unknown";
			if (_.isObject(error)) {
				switch(error.code) {
					case 1 :
						errorMessage = "Aborted";
						break;
					case 2 :
						errorMessage = "Network";
						break;
					case 3 :
						errorMessage = "Decode";
						break;
					case 4 :
						errorMessage = "SourceNotSupported";
						break;
					default :
						break;
				}
				this.vent.trigger("analytics:trackevent", "LiveStream", "error", errorMessage);
			}
		},
		handleInputTogglePlay: function() {
			this.playerFsm.handle("toggle");
			this.vent.trigger("analytics:trackevent", "LiveStream", "PlayToggle", this.playerFsm.state);
		},
		handleInputChangeVolume: function() {
			var currentVolume = $("#player-volume").val();
			var calcVolume = (currentVolume === 0) ? 0 : currentVolume / 10;
			if (this.audioEl.volume !== calcVolume && this.audioEl.muted && calcVolume !== 0) {
				this.handleInputToggleMute();
			}
			this.audioEl.volume = calcVolume;
		},
		handleInputToggleMute: function() {
			this.vent.trigger("analytics:trackevent", "LiveStream", "Mute", !this.audioEl.muted);
			this.audioEl.muted = !this.audioEl.muted;
		},
		handleModelChangeMessage: function(model, value, options) {
			console.log("[Player] Previous Status: " + $("#player-status").text());
			$("#player-status").text(this.audioEl.muted ? value + " (Muted)" : value);
			console.log("[Player] Current Status: " + $("#player-status").text());
		},
		handleModelChangePaused: function(model, value, options) {
			$("#player-button").html(value ? '<i class="icon-play icon-white"></i> Play' : '<i class="icon-pause icon-white"></i> Pause');
		},
		handleModelChangeMuted: function(model, value, options) {
			$("#player-mute").attr("class", (value ? "icon-volume-off" : "icon-volume-up"));
			this.model.trigger("change:message", this.model, this.model.get("message"));
		},
		handleModelChangeVolume: function(model, value, options) {
			$("#player-volume").val(value);
		},
		handleModelChangeDisabled: function(model, value, options) {
			var result = value ? $("#player-button").attr("disabled", "disabled") : $("#player-button").removeAttr("disabled");
		},
		beforeClose: function() {
			this.playerFsm.unbindAudioElEvents();
			delete this.playerFsm;
		},
	});

	return PlayerView;
});