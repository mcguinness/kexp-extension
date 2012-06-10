define([
  "jquery",
  "underscore",
  "services/Service",
  "services/LastFmApi",
  "models/LikedSongModel",
  "moment"
  ], function($, _, Service, LastFmApi, LikedSongModel) {

  var LastFmLikeSyncService = Service.extend({
    onStart: function(options) {
      _.bindAll(this, "enableSync", "disableSync", "handleSyncChange");
      var self = this;
      this._lastFmConfig = this.appConfig.getLastFm();
      this._lastFmApi = options.lastFmApi;

      this.bindTo(this._lastFmConfig, "change:sessionKey", this.handleSyncChange);
      this.bindTo(this._lastFmConfig, "change:likeShareEnabled", this.handleSyncChange);
      this.bindTo(this._lastFmConfig, "change:likeScrobbleEnabled", this.handleSyncChange);

      this.handleSyncChange(this._lastFmConfig);
    },
    enableSync: function() {
      if (_.isUndefined(this.handleSyncBinding)) {
        this.handleSyncBinding = this.bindTo(this.vent, "nowplaying:like", this.handleSync, this);
      }
    },
    disableSync: function() {
      if (this.handleSyncBinding) {
        this.vent.unbindFrom(this.handleSyncBinding);
        delete this.handleSyncBinding;
      }
    },
    handleSyncChange: function(model) {
      if (model.hasSharingEnabled()) {
        this.enableSync();
      } else {
        this.disableSync();
      }
    },
    handleSync: function(nowPlayingModel) {
      // Skip processing if no valid model or liked song
      if (_.isUndefined(nowPlayingModel) || !nowPlayingModel.hasLikedSong()) { return; }

      console.debug("[LastFmLikeSyncService] processing nowplaying:like event for song {%s}",
        nowPlayingModel.toDebugString());
    
      var likedSong = nowPlayingModel.likedSong;
      var self = this,
        track = likedSong.get("songTitle"),
        artist = likedSong.get("artist"),
        album = likedSong.get("album"),
        timePlayed = nowPlayingModel.get("timePlayed");

      // Skip processing if empty track or artist
      if (_.isEmpty(track) || _.isEmpty(artist)) { return; }


      if (this._lastFmConfig.isLikeShareEnabled() &&
        !likedSong.hasLastFmShareStatus(LikedSongModel.LastFmShareStatus.TrackLove)) {
        
        this._lastFmApi.loveTrack(track, artist).then(
          function() {
            likedSong.setLastFmShareStatus(LikedSongModel.LastFmShareStatus.TrackLove);
            likedSong.save();
            self.vent.trigger("lastfm:track:love:success", likedSong);
            self.vent.trigger("analytics:trackevent", "LastFm", "Love", likedSong.toDebugString());
          },
          function(resp, error, options) {
            console.warn("[LastFmLikeSyncService Error] %s track.love %s", resp.message, nowPlayingModel.toDebugString(), resp, options);
            self.vent.trigger("lastfm:track:love:fail", resp, likedSong, options);
            self.vent.trigger("analytics:trackevent", "LastFm", "Love", "Error", error);
          }
        );
      }

      if (this._lastFmConfig.isLikeScrobbleEnabled() && !_.isEmpty(album)) {
        this._lastFmApi.scrobbleTrack(track, artist, album, false, timePlayed)
          .then(
            function() {
              likedSong.scrobble();
              likedSong.save();
              self.vent.trigger("lastfm:track:scrobble:success", likedSong);
              self.vent.trigger("analytics:trackevent", "LastFm", "Scrobble", likedSong.toDebugString());
            },
            function(resp, error, options) {
              console.warn("[LastFmLikeSyncService Error] %s track.scrobble %s", resp.message, nowPlayingModel.toDebugString(), resp, options);
              self.vent.trigger("lastfm:track:scrobble:fail", resp, likedSong, options);
              self.vent.trigger("analytics:trackevent", "LastFm", "Scrobble", "Error", error);
            }
          );
      }
    }
  });
  return LastFmLikeSyncService;
});