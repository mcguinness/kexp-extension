define([
  "jquery",
  "underscore",
  "services/Service"
  ], function($, _, Service) {

  var LastFmLikeSyncService = Service.extend({
    onStart: function() {
      var lastFmConfig = this.appConfig.getLastFm();
      
      if (lastFmConfig.isLikeShareEnabled()) {
        console.debug("Enabling Last.fm Sync Service...");
        this._api = lastFmConfig.getApi();
        this.pipeToVent(this._api, "all");
        this.bindTo(this.vent, "nowplaying:like", this.handleSync, this);
      }
    },
    handleSync: function(nowPlayingModel) {
      
      if (!nowPlayingModel) return;

      console.debug("[LastFmLikeSyncService] processing nowplaying:like event for song {%s}",
        nowPlayingModel.toDebugString(), nowPlayingModel);
    
      var likedSong = nowPlayingModel.getLikedSong();
      if (!likedSong || likedSong.hasLastFmSyncStatusTrackLove()) return;
      
      var self = this,
        track = likedSong.get("songTitle"),
        artist = likedSong.get("artist");

      this._api.loveTrack(track, artist).then(
        function() {
          likedSong.setLastFmSyncStatusTrackLove();
          likedSong.save();
          self.vent.trigger("lastfm:love:success", likedSong);
        },
        function(resp, error, options) {
          console.warn("[LastFmLikeSyncService Error] %s for loving %s", resp.message, nowPlayingModel.toDebugString(), resp, options);
          self.vent.trigger("lastfm:love:fail", resp, likedSong, options);
        }
      );
    }
  });
  return LastFmLikeSyncService;
});