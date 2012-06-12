define([
	"jquery",
	"underscore",
	"marionette-kexp",
	"models/PlayerModel",
	"models/ShowModel",
	"views/PlayerFsm",
	"text!templates/player.html",
	"moment", // Global
	"jquery-cycle" // jQuery Plugin
	], function($, _, Marionette, PlayerModel, ShowModel, PlayerFsm, ViewTemplate) {
	
	var PlayerView = Marionette.ItemView.extend({
		template: ViewTemplate,
		tagName: "div",
		className: "container-player",
		
		initialize: function(options) {
			
			_.bindAll(this, "handlePlayerError", "disablePollFetchShow", "enablePollFetchShow", "pollFetchShow");
			
			this.audioEl = options.audioElement;
			
			if (!_.isObject(this.model)) {
				this.model = new PlayerModel({
					volume: this.audioEl.volume * 10,
					muted: this.audioEl.muted
				});
			}
			this.showModel = options.showModel || new ShowModel();

			this.playerFsm = new PlayerFsm(options.audioElement, this.model);
			this.playerFsm.on("error", this.handlePlayerError);

			// Bind Model Event Handlers
			this.bindTo(this.model, "change:message", this.handleModelChangeMessage);
			this.bindTo(this.model, "change:paused", this.handleModelChangePaused);
			this.bindTo(this.model, "change:muted", this.handleModelChangeMuted);
			this.bindTo(this.model, "change:volume", this.handleModelChangeVolume);
			this.bindTo(this.model, "change:disabled", this.handleModelChangeDisabled);
			this.bindTo(this.showModel, "change", this.handleShowModelChange);
		},
		events: {
			"click #player-button": "handleInputTogglePlay",
			"change #player-volume": "handleInputChangeVolume",
			"click #player-mute": "handleInputToggleMute",
			"click span.player-status": "handleStatusClick"
		},
		beforeRender: function() {
			// Init State & Model
			this.playerFsm.handle("initialize");
		},
		makeStatusEl: function(id, className, message) {
			return this.make(
				"div",
				{
					"id": id,
					"class": className
				},
				'<span class="prefix-accent">\\\\\\</span> <span class="player-status">'+message+'</span>'
			);
		},
		renderShowStatus: function(showModel) {
			var titleEl = this.makeStatusEl("player-show-title", "show-title", showModel.get("title"));
			var timeEl = this.makeStatusEl("player-show-time", "show-time", showModel.formatTimeRange("hA"));
			var djEl = this.makeStatusEl("player-show-dj", "show-dj", showModel.get("dj"));

			if (_.isObject(this.$statusCycleEl)) {
				this.$statusCycleEl.cycle("destroy");
			}
			this.$statusCycleEl = $("div.container-player-status", this.$el)
				.append(titleEl, timeEl, djEl)
				.cycle({
					fx:"scrollLeft",
					speed: 750,
					timeout: 18000,
					fit: true,
					width: "100%"
				});
		},
		onShow: function() {
			this.pollFetchShow();
		},
		disablePollFetchShow: function() {
			if (this._showFetchTimeoutId) {
				window.clearTimeout(this.showFetchTimeoutId);
				delete this._showFetchTimeoutId;
			}
		},
		enablePollFetchShow: function(nextPollSeconds) {
			this.disablePollFetchShow();
			console.log("Will poll kexp show info in [%s] seconds...", nextPollSeconds);
			this._showFetchTimeoutId = window.setTimeout(this.pollFetchShow, nextPollSeconds * 1000);
		},
		hasRenderedShowStatus: function() {
			return _.isObject(this.$statusCycleEl);
		},
		pollFetchShow: function() {
			var view = this,
				// Add random seconds (up to 1 minute) to poll so not every client hits server at the same time
				nextPollGraceSeconds = (2 * 60) + Math.round(((Math.random() * 60) + 1)),
				nextPollSeconds;
			console.log("Polling kexp show info...");
			$.when(this.showModel.fetch())
				.done(function(model) {
					nextPollSeconds = moment(model.get("timeEnd")).diff(moment(), "seconds");
					nextPollSeconds += nextPollGraceSeconds;
					if (nextPollSeconds <= 0) {
						nextPollSeconds = nextPollGraceSeconds;
					}
					view.enablePollFetchShow(nextPollSeconds);
					if (!view.hasRenderedShowStatus()) {
						view.renderShowStatus(model);
					}
				})
				.fail(function(model, error, options) {
					console.warn("Error [%s] fetching kexp show", error);
					view.enablePollFetchShow(nextPollGraceSeconds);
				});

		},
		restartShowStatusCycle: function() {
			if (_.isObject(this.$statusCycleEl)) {
				this.$statusCycleEl.cycle(0);
			}
		},
		handlePlayerError: function(error) {
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
		handleStatusClick: function() {
			if (_.isObject(this.$statusCycleEl)) {
				this.$statusCycleEl.cycle("next");
			}
		},
		handleModelChangeMessage: function(model, value, options) {
			this.restartShowStatusCycle();
			var $titleStatus = $("#player-title span.player-status", this.$el);
			console.log("[Player] Previous Status: " + $titleStatus.text());
			$titleStatus.text(this.audioEl.muted ? value + " (Muted)" : value);
			console.log("[Player] Current Status: " + $titleStatus.text());
		},
		handleModelChangePaused: function(model, value, options) {
			$("#player-button", this.$el).html(
				value ?
				'<i class="icon-play icon-white"></i> Play' :
				'<i class="icon-pause icon-white"></i> Pause'
			);
		},
		handleModelChangeMuted: function(model, value, options) {
			$("#player-mute", this.$el).attr("class", (value ? "icon-volume-off" : "icon-volume-up"));
			this.model.trigger("change:message", this.model, this.model.get("message"));
		},
		handleModelChangeVolume: function(model, value, options) {
			$("#player-volume", this.$el).val(value);
		},
		handleModelChangeDisabled: function(model, value, options) {
			var result = value ?
				$("#player-button", this.$el).attr("disabled", "disabled") :
				$("#player-button", this.$el).removeAttr("disabled");
		},
		handleShowModelChange: function(showModel) {
			if (_.isObject(this.$statusCycleEl)) {
				this.$statusCycleEl.find("#player-show-title span.player-status").text(showModel.get("title"));
				this.$statusCycleEl.find("#player-show-time span.player-status").text(showModel.formatTimeRange("hA"));
				this.$statusCycleEl.find("#player-show-dj span.player-status").text(showModel.get("dj"));
			}
		},
		beforeClose: function() {
			this.disablePollFetchShow();
			if (_.isObject(this.$statusCycleEl)) {
				this.$statusCycleEl.cycle("destroy");
			}
			this.playerFsm.unbindAudioElEvents();
			delete this.playerFsm;
		}
	});

	return PlayerView;
});