define(["jquery", "underscore", "machina", "moment"], function($, _, Machina, moment) {

  var NetworkState = {
    "NetworkEmpty":     0,  // When set, always in the HAVE_NOTHING state.
    "NetworkIdle":      1,
    "NetworkLoading":   2,
    "NetworkNoSource":  3
  };
  Object.freeze(NetworkState);

  // Note: In practice, the difference between HAVE_METADATA and
  // HAVE_CURRENT_DATA is negligible. Really the only time the difference is
  // relevant is when painting a video element onto a canvas, where it
  // distinguishes the case where something will be drawn (HAVE_CURRENT_DATA or
  // greater) from the case where nothing is drawn (HAVE_METADATA or less).
  // Similarly, the difference between HAVE_CURRENT_DATA (only the current frame)
  // and HAVE_FUTURE_DATA (at least this frame and the next) can be negligible
  // (in the extreme, only one frame). The only time that distinction really
  // matters is when a page provides an interface for "frame-by-frame"
  // navigation.
  var ReadyState = {
    "HaveNothing":      0, // No information regarding the media resource is available
    "HaveMetadata":     1, // No media data is available for the immediate current playback position.
    "HaveCurrentData":  2,
    "HaveFutureData":   3,
    "HaveEnoughData":   4
  };
  Object.freeze(ReadyState);

  var PlayerFsm = function(liveStreamEl, playerModel) {

    if (!_.isObject(liveStreamEl)) {
      throw new Error("HTMLAudioElement is required.");
    }
    if (!_.isObject(playerModel)) {
      throw new Error("PlayerModel is required.");
    }

    var fsm = new Machina.Fsm({
      model: playerModel,
      audioEl: liveStreamEl,
      $audioEl: $(liveStreamEl),

      initialState: "uninitialized",
      events: ["empty", "buffering", "playing", "paused", "error"],

      isPotentiallyPlaying: function() {
        // http://www.w3.org/TR/html5/media-elements.html#potentially-playing

        // A waiting DOM event can be fired as a result of an element that is potentially
        // playing stopping playback due to its readyState attribute changing to a value
        // lower than HAVE_FUTURE_DATA.

        return (!this.audioEl.paused && !this.audioEl.ended && !_.isObject(this.audioEl.error));
      },
      hasValidAudioResource: function() {
        return (this.audioEl.networkState !== NetworkState.NetworkEmpty &&
          this.audioEl.networkState !== NetworkState.NetworkNoSource &&
          this.audioEl.readyState !== ReadyState.HaveNothing);
      },
      hasValidAudioData: function() {
        return (this.audioEl.networkState === NetworkState.NetworkLoading &&
              this.audioEl.readyState >= ReadyState.HaveFutureData);
      },
      hasValidPauseDelta: function() {
        var pauseISOString = this.$audioEl.attr("data-pause-time");
        var pauseMoment = (pauseISOString) ? moment(pauseISOString) : moment();
        console.log("Stream Pause Time: %s", pauseMoment.toString());
        var pauseDeltaSeconds = moment().diff(pauseMoment, "seconds");
        console.log("Stream Pause Delta Time: %s (seconds)", pauseDeltaSeconds);

        return (pauseDeltaSeconds < 120);
      },
      canResumeStream: function() {
        return (!this.audioEl.paused || this.audioEl.paused && this.hasValidPauseDelta()) &&
          (!this.audioEl.ended && !_.isObject(this.audioEl.error) && this.hasValidAudioData());
      },
      pauseStream: function() {
        console.log("[Player Action:Pause]");
        this.audioEl.pause();
        this.$audioEl.attr("data-pause-time", new Date().toISOString());
      },
      playStream: function() {
        if (!this.canResumeStream() || !this.hasValidAudioData()) {
          console.log("[Player Action:Load]");
          this.audioEl.load();
          console.log("[Player Action:Play]");
          this.audioEl.play();
        } else {
          console.log("[Player Action:Play]");
          if (this.audioEl.paused) {
            this.audioEl.play();
          }
        }
      },
      handleAudioEvent: function(event) {
        switch(event.type) {
          case "waiting" :
            console.debug("[AudioElement] OnWaiting");
            return this.transition("buffering");
          case "playing" :
            console.debug("[AudioElement] OnPlaying");
            return this.transition("playing");
          case "pause" :
            console.debug("[AudioElement] OnPaused");
            return this.transition("paused");
          case "error" :
            console.debug("[AudioElement] OnError");
            return this.transition("error");
          case "volumechange" :
            console.debug("[AudioElement] OnVolumeChange");
            return this.model.set({
              "muted": this.audioEl.muted,
              "volume": this.audioEl.volume * 10
            });
          case "emptied" :
            console.debug("[AudioElement] OnEmptied");
            return;
          default :
            return;
        }
      },
      bindAudioElEvents: function() {
        this.audioEl.addEventListener("playing", this.handleAudioEvent);
        this.audioEl.addEventListener("pause", this.handleAudioEvent);
        this.audioEl.addEventListener("waiting", this.handleAudioEvent);
        this.audioEl.addEventListener("error", this.handleAudioEvent);
        this.audioEl.addEventListener("volumechange", this.handleAudioEvent);
        this.audioEl.addEventListener("emptied", this.handleAudioEvent);
      },
      unbindAudioElEvents: function() {
        this.audioEl.removeEventListener("playing", this.handleAudioEvent);
        this.audioEl.removeEventListener("pause", this.handleAudioEvent);
        this.audioEl.removeEventListener("waiting", this.handleAudioEvent);
        this.audioEl.removeEventListener("error", this.handleAudioEvent);
        this.audioEl.removeEventListener("volumechange", this.handleAudioEvent);
        this.audioEl.removeEventListener("emptied", this.handleAudioEvent);
      },
      states: {
        "uninitialized": {
          "initialize": function() {
            console.log("[Player State:Initialize] -> NetworkState:%s ReadyState:%s", this.audioEl.networkState, this.audioEl.readyState);
            if (this.audioEl.paused && _.isObject(this.audioEl.error)) {
              this.transition("error");
            } else if (this.isPotentiallyPlaying()) {
              this.transition("playing");
            } else if (!this.hasValidAudioResource()) {
              this.transition("empty");
            } else {
              if (this.canResumeStream()) {
                this.transition("paused");
              } else {
                console.log("[Player Action:Load]");
                this.audioEl.load();
                this.transition("empty");
              }
            }
          }
        },
        "empty": {
          _onEnter: function() {
            console.log("[Player State:Empty] NetworkState:%s ReadyState:%s", this.audioEl.networkState, this.audioEl.readyState);
            this.model.set({
              "message": "Listen Now",
              "disabled": false
            });
            this.fireEvent("empty");
          },
          "toggle": function() {
            this.playStream();
          }
        },
        "buffering": {
          _onEnter: function() {
            console.log("[Player State:Buffering] NetworkState:%s ReadyState:%s", this.audioEl.networkState, this.audioEl.readyState);
            this.model.set({
              "message": "Buffering",
              "disabled": true
            });

            this.fireEvent("buffering");
          },
          "toggle": function() {
            // No-Op Disabled
          }
        },
        "playing": {
          _onEnter: function() {
            var isPotentiallyPlaying = this.isPotentiallyPlaying();
            var hasValidAudioData = this.hasValidAudioData();

            console.log("[Player State:Playing] NetworkState:%s ReadyState:%s " +
              "IsPotentiallyPlaying:%s HasValidMediaData:%s",
              this.audioEl.networkState,
              this.audioEl.readyState,
              isPotentiallyPlaying,
              hasValidAudioData);

            if (isPotentiallyPlaying && hasValidAudioData) {
              this.model.set({
                "message": "Live Stream",
                "paused": false,
                "disabled": false
              });

              this.fireEvent("playing");
            } else {
              this.playStream();
            }
          },
          "toggle": function() {
            this.pauseStream();
          }
        },
        "paused": {
          _onEnter: function() {
            var isPotentiallyPlaying = this.isPotentiallyPlaying();
            console.log("[Player State:Paused] NetworkState:%s ReadyState:%s IsPotentiallyPlaying:%s",
              this.audioEl.networkState, this.audioEl.readyState, isPotentiallyPlaying);
            
            if (!isPotentiallyPlaying) {
              this.model.set({
                "message": "Paused",
                "paused": true,
                "disabled": false
              });

              this.fireEvent("paused");
            } else {
              this.pauseStream();
            }
          },
          "toggle": function() {
            this.playStream();
          }
        },
        "error": {
          _onEnter: function() {
            console.log("[Player State:Error] -> NetworkState:%s ReadyState:%s", this.audioEl.networkState, this.audioEl.readyState);
            this.model.set({
              "message": "KEXP Stream Error",
              "paused": true,
              "disabled": false
            });
            this.fireEvent("error", this.audioEl.error);
          },
          "toggle": function() {
            this.playStream();
          }
        }
      }
    });

    // Need to bind audio element and set context for event handlers
    // IMPORTANT!!! do not forget to unbind event handlers when done
    _.bindAll(fsm);
    fsm.bindAudioElEvents();
    return fsm;
  };

  return PlayerFsm;
});