define(["machina", "underscore"], function(machina, _) {

  var PlayerFsm = function(audioElement) {

    if (audioElement === undefined) {
      throw new Error("HTMLAudioElement is required.");
    }

    var audioEl = audioElement;

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

    var fsm = new machina.Fsm({

      initialState: "uninitialized",
      events: ["Buffering", "Playing", "Paused", "Error"],
      retry: _.once(function() {
        if (audioEl.networkState === NetworkStatus.NetworkNoSource &&
          audioEl.readyState === ReadyStatus.HaveEnoughData) {
          this.transition("playing");
        }
      }),
      states: {
        "uninitialized": {
          "initialize": function() {
            if (audioEl.paused || audioEl.networkState === NetworkStatus.NetworkNoSource ||
              audioEl.networkState === NetworkStatus.NetworkEmpty) {
              this.transition("paused");
            } else {
              this.transition("playing");
            }
          }
        },
        "playing": {
          _onEnter: function() {
            console.log("Playing -> NetworkState:%s ReadyState:%s", audioEl.networkState, audioEl.readyState, audioEl);
            
            if (audioEl.networkState === NetworkStatus.NetworkNoSource ||
              audioEl.networkState === NetworkStatus.NetworkEmpty ||audioEl.readyState === ReadyStatus.HaveNothing) {
              
              this.fireEvent("Buffering");
              console.log("Buffering media for audio element...", audioEl);
              audioEl.load();
            }
            if (audioEl.paused) {
              console.log("Playing audio element...", audioEl);
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
            console.log("Paused -> NetworkState:%s ReadyState:%s", audioEl.networkState, audioEl.readyState, audioEl);
            
            if (!audioEl.paused) {
              console.log("Pausing audio element...", audioEl);
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
            console.log("Error -> NetworkState:%s ReadyState:%s", audioEl.networkState, audioEl.readyState, audioEl);
            //Attemp retry once, if success state will transition, otherwise fire error.
            this.retry();
            this.fireEvent("Error");
          },
          "toggle": function() {
            if (audioEl.paused || audioEl.networkState === NetworkStatus.NetworkNoSource ||
              audioEl.networkState === NetworkStatus.NetworkEmpty) {
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