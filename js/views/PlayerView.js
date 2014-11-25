define([
	"jquery",
	"underscore",
	"marionette-kexp",
	"backbone-modelbinder",
	"models/PlayerModel",
	"models/ShowModel",
	"views/PlayerFsm",
	"text!templates/player.html",
	"moment",
	"jquery-cycle" // jQuery Plugin
	], function($, _, Marionette, ModelBinder, PlayerModel, ShowModel, PlayerFsm, ViewTemplate, moment) {
	
	var PlayerView = Marionette.ItemView.extend({
		template: ViewTemplate,
		tagName: "div",
		className: "container-player",
		
		initialize: function(options) {

			this._playerBinder = new Backbone.ModelBinder();
			this.showModel = options.showModel || new ShowModel();
			this.audioEl = options.liveStreamEl;
			
			if (!_.isObject(this.model)) {
				this.model = new PlayerModel({
					volume: this.audioEl.volume * 10,
					muted: this.audioEl.muted
				});
			}
			this._playerFsm = new PlayerFsm(options.liveStreamEl, this.model);
		},
		initialEvents: function() {
			_.bindAll(this, "handlePlayerError");
			this._playerFsm.on("error", this.handlePlayerError);

			// Bind Model Event Handlers
			this.bindTo(this.model, "change:message", this.handleModelChangeMessage);
			this.bindTo(this.model, "change:paused", this.handleModelChangePaused);
			this.bindTo(this.model, "change:muted", this.handleModelChangeMuted);
			this.bindTo(this.showModel, "change", this.handleShowModelChange);
		},
		events: {
			"click #player-button": "handleInputTogglePlay",
			"change #player-volume": "handleInputChangeVolume",
			"click #player-mute": "handleInputToggleMute",
			"click div.player-status": "handleStatusClick"
		},
		beforeRender: function() {
			this._playerFsm.handle("initialize");
		},
		onRender: function() {
			var view = this,
				convertStatusMessage = function(direction, value) {
					return view.audioEl.muted ? value + " (Muted)" : value;
				},
				convertPause = function(direction, value, attribute, model) {
					return value ?
						'<i class="fa fa-play"></i> Play' :
						'<i class="fa fa-pause"></i> Pause';
				},
				convertMuted = function(direction, value) {
					return value ? "fa fa-volume-off" : "fa fa-volume-up";
				},
				bindings = {
					message: {
						selector: "#player-status-state span.player-status-message",
						converter: convertStatusMessage
					},
					paused: {
						selector: "#player-button",
						elAttribute: "html",
						converter: convertPause
					},
					disabled: {
						selector: "#player-button",
						elAttribute: "disabled"
					},
					volume: {
						selector: "#player-volume",
						elAttribute: "value"
					},
					muted: {
						selector: "#player-mute",
						elAttribute: "class",
						converter: convertMuted
					}
				};

			this._playerBinder.bind(this.model, this.$el, bindings);

			_.delay(function() {
				$('#player').addClass('in');
			}, 600);

		},
		makeStatusEl: function(id, message) {
			return this.make(
				"div",
				{
					"id": id,
					"class": "player-status"
				},
				'<span class="prefix-accent">\\\\\\</span> <span class="player-status-message">'+message+'</span>'
			);
		},
		renderShowStatus: function(showModel) {
			var titleEl = this.makeStatusEl("player-show-title", showModel.get("title"));
			var timeEl = this.makeStatusEl("player-show-time", showModel.formatTimeRange("hA"));
			var djEl = this.makeStatusEl("player-show-dj", showModel.get("dj"));

			if (_.isObject(this.$statusCycleEl)) {
				this.$statusCycleEl.cycle("destroy");
			}
			this.$statusCycleEl = $("#container-player-status", this.$el)
				.append(titleEl, timeEl, djEl)
				.cycle({
					fx:"scrollLeft",
					speed: 750,
					timeout: 16000,
					fit: true,
					width: "100%",
					startingSlide: 1
				});
		},
		onShow: function() {
			if (this.showModel.isValid()) {
				this.renderShowStatus(this.showModel);
			}
		},
		hasRenderedShowStatus: function() {
			return _.isObject(this.$statusCycleEl);
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
			this._playerFsm.handle("toggle");
			this.vent.trigger("analytics:trackevent", "LiveStream", "PlayToggle", this._playerFsm.state);
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
		},
		handleModelChangePaused: function(model, value, options) {
			this.vent.trigger("livestream:playing", value, model);
		},
		handleModelChangeMuted: function(model, value, options) {
			// Update Message for Pause Status
			var messageBinding = this._playerBinder._attributeBindings["message"];
			if (messageBinding) {
				this._playerBinder._copyModelToView(messageBinding);
			}
			this.restartShowStatusCycle();
		},
		handleShowModelChange: function(showModel) {
			if (!this.hasRenderedShowStatus()) {
				this.renderShowStatus(showModel);
			} else {
				this.$statusCycleEl.find("#player-show-title span.player-status-message").text(showModel.get("title"));
				this.$statusCycleEl.find("#player-show-time span.player-status-message").text(showModel.formatTimeRange("hA"));
				this.$statusCycleEl.find("#player-show-dj span.player-status-message").text(showModel.get("dj"));
			}
		},
		beforeClose: function() {
			this._playerBinder.unbind();
			if (_.isObject(this.$statusCycleEl)) {
				this.$statusCycleEl.cycle("destroy");
			}
			this._playerFsm.unbindAudioElEvents();
		}
	});

	return PlayerView;
});