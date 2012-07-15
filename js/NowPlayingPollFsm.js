define([
  "machina",
  "jquery",
  "underscore"
  ], function(Machina, $, _) {

  var NowPlayingPollFsm = function(audioElement, nowPlayingCollection) {

    var nowPlayingFsm = new Machina.Fsm({
      audioEl: audioElement,
      collection: nowPlayingCollection,
      attachedViewCount: 0,
      pollIntervalMs: 60000,
      initialState: "uninitialized",
      states: {
        "uninitialized": {
          _onEnter: function() {
            this.verifyState();
          }
        },
        "polling": {
          _onEnter: function() {
            var self = this;
            if (this._pollIntervalId === undefined) {
              console.log("enabling now playing poll with interval: %s", this.pollIntervalMs);
              this._pollIntervalId = setInterval(function() {
                console.log("polling now playing with session {%s}...", self._pollIntervalId);
                self.collection.fetch({upsert: true});
              }, this.pollIntervalMs);
              console.log("now playing poll session {%s} is active", this._pollIntervalId);
            }
          }
        },
        "idle": {
          _onEnter: function() {
            console.log("disabling now playing poll session {%s}...", this._pollIntervalId);
            if (this._pollIntervalId !== undefined) {
              clearInterval(this._pollIntervalId);
              delete this._pollIntervalId;
            }
            this.collection.reset();
          }
        }
      },
      attachView: function() {
        console.log("Attaching view to now playing poll...");
        this.attachedViewCount++;
        this.verifyState();
        console.log("Attached Views: %s", this.attachedViewCount);
      },
      detachView: function() {
        console.log("Detaching view from now playing poll...");
        this.attachedViewCount--;
        this.verifyState();
        console.log("Attached Views: %s", this.attachedViewCount);
      },
      verifyState: function() {
        if (!this.audioEl.paused || this.attachedViewCount > 0) {
          this.transition("polling");
        } else {
          this.transition("idle");
        }
      },
      bindAudioElEvents: function() {
        this.audioEl.addEventListener("playing", this.verifyState);
        this.audioEl.addEventListener("pause", this.verifyState);
      },
      unbindAudioElEvents: function() {
        this.audioEl.removeEventListener("playing", this.verifyState);
        this.audioEl.removeEventListener("pause", this.verifyState);
      }
    });
    // Need to bind audio element and set context for event handlers
    // IMPORTANT!!! do not forget to unbind event handlers when done
    _.bindAll(nowPlayingFsm);
    nowPlayingFsm.bindAudioElEvents();
    return nowPlayingFsm;
  };
  return NowPlayingPollFsm;
});