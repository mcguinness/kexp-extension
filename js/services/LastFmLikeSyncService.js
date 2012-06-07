define([
  "jquery",
  "underscore",
  "services/Service",
  "models/LikedSongModel",
  "moment"
  ], function($, _, Service, LikedSongModel) {

  var LastFmLikeSyncService = Service.extend({
    onStart: function() {
      var self = this;
      this.lastFmConfig = this.appConfig.getLastFm();
      _.bindAll(this, "enableSync", "disableSync", "handleSync");
      
      if (this.lastFmConfig.isLikeShareEnabled() || this.lastFmConfig.isLikeScrobbleEnabled()) {
        console.debug("Enabling Last.fm Sync Service...");
        
        this._api = this.lastFmConfig.getApi();
        this.pipeToVent(this._api, "all");
        
        this.enableSync();
        this.bindTo(this.lastFmConfig, "change:sessionKey", function(model, value) {
          model.hasAuthorization() ? self.enableSync() : self.disableSync();
        }, this);
      }
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


      if (this.lastFmConfig.isLikeShareEnabled() &&
        !likedSong.hasLastFmShareStatus(LikedSongModel.LastFmShareStatus.TrackLove)) {
        
        this._api.loveTrack(track, artist).then(
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

      if (this.lastFmConfig.isLikeScrobbleEnabled() && !_.isEmpty(album)) {
        this._api.scrobbleTrack(track, artist, album, false, timePlayed)
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