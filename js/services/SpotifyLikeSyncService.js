define([
  "jquery",
  "underscore",
  "services/Service",
  "collections/SpotifyTrackCollection",
  "moment"
  ], function($, _, Service, SpotifyTrackCollection, moment) {

  var SpotifyLikeSyncService = Service.extend({
    onStart: function(options) {
      _.bindAll(this, "enableSync", "disableSync", "handleSyncChange");
      var self = this;
      this._spotifyConfig = this.appConfig.getSpotify();
      this._spotifySync = this._spotifyConfig.getSync();

      this.bindTo(this._spotifyConfig, "change:refreshToken", this.handleSyncChange);
      this.bindTo(this._spotifyConfig, "change:likeShareEnabled", this.handleSyncChange);
      this.handleSyncChange(this._spotifyConfig);
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

      console.debug("[SpotifyLikeSyncService] processing nowplaying:like event for song [%s]",
        nowPlayingModel.toDebugString());
    
      var likedSong    = nowPlayingModel.likedSong,
          self         = this,
          track        = likedSong.get("songTitle"),
          artist       = likedSong.get("artist"),
          album        = likedSong.get("album");
          tracks       = new SpotifyTrackCollection(),
          tracks.sync  = this._spotifySync,
          searchParams = null;

      // Skip processing if empty track or artist
      if (_.isEmpty(track) || _.isEmpty(artist) || _.isEmpty(album)) { return; }

      if (this._spotifyConfig.isLikeShareEnabled()) {

        searchParams = { q: 'track:"' + track.replace(' ', '+') + '"album:"' + album.replace(' ', '+') + '"artist:"' + artist.replace(' ', '+') +'"', type: "track"};

        tracks.fetch({ 
          data: $.param(searchParams), 
          success: function(collection, resp) {
            var track;
            if (collection.models.length > 0) {
              track = collection.at(0);
              console.log("[SpotifyLikeSyncService] adding track [%s] to playlist [%s] for user [%s]", 
                JSON.stringify(track),
                self._spotifyConfig.get('playListId'),
                self._spotifyConfig.get('userId'));
              $.ajax({
                url: self._spotifyConfig.get('apiUrl') + 
                  '/users/' + 
                  self._spotifyConfig.get('userId') + 
                  '/playlists/' + 
                  self._spotifyConfig.get('playListId') +
                  '/tracks',
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({ 
                  uris: [track.get('uri')]
                }),
                headers: self._spotifyConfig.getAuthorizationHeader(),
                success: function(response) {
                  console.log("[SpotifyLikeSyncService] successfully added track [%s] to playlist", track.get('uri'));
                },
                error: function(xhr, ajaxOptions, thrownError) {
                  console.warn("[SpotifyLikeSyncService Error] unable to add track [%s] to playlist [%s] for user [%s] due to error [%s]", 
                      track.get('uri'),
                      self._spotifyConfig.get('playListId'),
                      self._spotifyConfig.get('userId'),
                      xhr.statusText);
                  
                  self.vent.trigger("spotify:playlist:add:fail", JSON.parse(xhr.statusText), track, ajaxOptions);
                  self.vent.trigger("analytics:trackevent", "Spotify", "Playlist", "Error", xhr.statusText);
                }
              });
            } else {
              console.log("[SpotifyLikeSyncService] Unable to find track in Spotify");
            }
          },
          error : function(collection, error, options) {
            console.warn("[SpotifyLikeSyncService Error] %s", error);
            self.vent.trigger("spotify:track:search:fail", JSON.parse(error), likedSong, options);
            self.vent.trigger("analytics:trackevent", "Spotify", "Search", "Error", error);
          }
        });
      }
    },
    toString: function() {
      return "SpotifyLikeSyncService";
    }
  });
  return SpotifyLikeSyncService;
});