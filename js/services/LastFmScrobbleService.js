define([
  "jquery",
  "underscore",
  "services/Service",
  "moment"
  ], function($, _, Service) {

  var LastFmScrobbleService = Service.extend({
    onStart: function(options) {

      var self = this;
      this._lastFmConfig = this.appConfig.getLastFm();
      this._lastFmApi = options.lastFmApi;
      this._nowPlayingCollection = options.nowPlayingCollection;
      this._audioEl = options.liveStreamEl;

      this.bindTo(this._lastFmConfig, "change:sessionKey", this.handlePlayScrobbleChange, this);
      this.bindTo(this._lastFmConfig, "change:playScrobbleEnabled", this.handlePlayScrobbleChange, this);
      
      this.handlePlayScrobbleChange(this._lastFmConfig);
    },
    enableScrobble: function() {
      if (_.isUndefined(this.handleScrobbleBinding)) {
        this.handleScrobbleBinding = this.bindTo(this._nowPlayingCollection, "add", this.handlePlayScrobble, this);
      }
    },
    disableScrobble: function() {
      if (this.handleScrobbleBinding) {
        this.vent.unbindFrom(this.handleScrobbleBinding);
        delete this.handleScrobbleBinding;
      }
    },
    handlePlayScrobbleChange: function(model) {
      if (model.isPlayScrobbleEnabled()) {
        this.enableScrobble();
      } else {
        this.disableScrobble();
      }
    },
    handlePlayScrobble: function(nowPlayingModel) {
      // Only process event for valid state
      if (!this._lastFmConfig.isPlayScrobbleEnabled() || this._audioEl.paused || _.isUndefined(nowPlayingModel) ||
        nowPlayingModel.get("airBreak")) { return; }
    
      var self = this,
        track = nowPlayingModel.get("songTitle"),
        artist = nowPlayingModel.get("artist"),
        album = nowPlayingModel.get("album"),
        timePlayed = nowPlayingModel.get("timePlayed");

      // Skip processing if empty track, artist, or album
      if (!_.isEmpty(track) && !_.isEmpty(artist) && !_.isEmpty(album)) {

        this._lastFmApi.scrobbleTrack(track, artist, album, false, timePlayed)
          .then(
            function() {
              if (_.isObject(nowPlayingModel.likedSong)) {
                nowPlayingModel.likedSong.scrobble();
                nowPlayingModel.likedSong.save();
              }
              self.vent.trigger("lastfm:track:scrobble:success", nowPlayingModel);
              self.vent.trigger("analytics:trackevent", "LastFm", "Scrobble", nowPlayingModel.toDebugString());
            },
            function(resp, error, options) {
              console.warn("[LastFmScrobbleService Error] %s track.scrobble %s", resp.message, nowPlayingModel.toDebugString(), resp, options);
              self.vent.trigger("lastfm:track:scrobble:fail", resp, nowPlayingModel, options);
              self.vent.trigger("analytics:trackevent", "LastFm", "Scrobble", "Error", error);
            }
          );

      }
    },
    toString: function() {
      return "LastFmScrobbleService";
    }
  });
  return LastFmScrobbleService;
});