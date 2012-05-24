define(["jquery", "underscore", "machina", "moment"], function($, _, Machina, moment) {

  var PlayerFsm = function(audioElement) {

    if (audioElement === undefined) {
      throw new Error("HTMLAudioElement is required.");
    }

    var audioEl = audioElement;
    var $audioEl = $(audioEl);

    var NetworkStatus = {
      "NetworkEmpty": 0,
      "NetworkIdle": 1,
      "NetworkLoading": 2,
      "NetworkNoSource": 3
    };
    var ReadyStatus = {
      "HaveNothing": 0,
      "HaveMetadata": 1,
      "HaveCurrentData": 2,
      "HaveFutureData": 3,
      "HaveEnoughData": 4
    };

    var fsm = new Machina.Fsm({

      initialState: "uninitialized",
      events: ["Buffering", "Playing", "Paused", "Error"],
      retry: _.once(function() {
        if (!this.hasValidBuffer()) {
          console.log("[Player Error:Retry]");
          this.transition("playing");
        }
      }),
      hasValidBuffer: function() {
        return (audioEl.networkState !== NetworkStatus.NetworkNoSource &&
              audioEl.networkState !== NetworkStatus.NetworkEmpty && audioEl.readyState !== ReadyStatus.HaveNothing);
      },
      hasValidPauseDelta: function() {
        var pauseISOString = $audioEl.attr("data-pause-time");
        var pauseMoment = (pauseISOString) ? moment(pauseISOString) : moment();
        console.log("Stream Pause Time: %s", pauseMoment.toString());
        var pauseDeltaSeconds = moment().diff(pauseMoment, "seconds");
        console.log("Stream Pause Delta Time: %s (seconds)", pauseDeltaSeconds);

        return (pauseDeltaSeconds < 180);
      },
      states: {
        "uninitialized": {
          "initialize": function() {
            if (audioEl.paused || !this.hasValidBuffer()) {
              this.transition("paused");
            } else {
              this.transition("playing");
            }
          }
        },
        "playing": {
          _onEnter: function() {
            console.log("[Player State:Playing] NetworkState:%s ReadyState:%s", audioEl.networkState, audioEl.readyState, audioEl);
            
            if (audioEl.paused && this.hasValidPauseDelta() && this.hasValidBuffer()) {
              console.log("[Player Action:Play]");
              audioEl.play();
            } else if (audioEl.paused) {
              this.fireEvent("Buffering");
              console.log("[Player Action:Load]");
              audioEl.load();
              console.log("[Player Action:Play]");
              audioEl.play();
            }
            this.fireEvent("Playing");

          },
          "toggle": function() {
            this.transition("paused");
          }
        },
        "paused": {
          _onEnter: function() {
            console.log("[Player State:Paused] NetworkState:%s ReadyState:%s", audioEl.networkState, audioEl.readyState, audioEl);
            
            $audioEl.attr("data-pause-time", new Date().toISOString());
            
            if (!audioEl.paused) {
              console.log("[Player Action:Pause]");
              audioEl.pause();
            }
            this.fireEvent("Paused");
          },
          "toggle": function() {
            if (audioEl.paused) {
              this.transition("playing");
            }
          }
        },
        "error": {
          _onEnter: function() {
            console.log("[Player State:Error] -> NetworkState:%s ReadyState:%s", audioEl.networkState, audioEl.readyState, audioEl);
            //Attemp retry once, if success state will transition, otherwise fire error.
            this.retry();
            this.fireEvent("Error");
          },
          "toggle": function() {
            if (audioEl.paused || !this.hasValidBuffer()) {
              this.transition("playing");
            } else {
              this.transition("paused");
            }
          }
        }
      }
    });
    return fsm;
  };

  return PlayerFsm;
});