define([
  "jquery",
  "underscore",
  "collections/NowPlayingCollection",
  "views/NowPlayingLayout",
  "views/LikedSongListView"
  ], function($, _, NowPlayingCollection,
    NowPlayingLayout, LikedSongListView) {

  var KexpAppController = function(application) {
    this.app = application;
    this.collections = {
      nowPlaying: new NowPlayingCollection()
    };
    
    this.enablePoll(60000);
  };

  _.extend(KexpAppController.prototype, {
    handleLikesRoute: function() {
      var self = this;
      var likedSongsView = new LikedSongListView();
      //console.log("[Fetch LikedSongListView Collection]");
      likedSongsView.collection.fetch()
        .then(function(collection, resp) {
          //console.log("[Show LikedSongListView]");
          self.app.main.show(likedSongsView);
        });
    },
    handleDefaultRoute: function() {
      var self = this;
      if (self.collections.nowPlaying.size() > 0) {
        self.showNowPlaying();
      } else {
        // Wait for Fetch (Success or Error)
        self.collections.nowPlaying.fetch({upsert: true})
          .always(function() {
            self.showNowPlaying();
          });
      }
    },
    disablePoll: function() {
      if (this._pollIntervalId !== undefined) {
        clearInterval(this._pollIntervalId);
        delete this._pollIntervalId;
      }
    },
    enablePoll: function(intervalMs) {
      var self = this;
      self.disablePoll();
      self._pollIntervalId = setInterval(function() {
        self.app.vent.trigger("nowplaying:refresh:background", self.collections.nowPlaying);
        self.collections.nowPlaying.fetch({upsert: true});
      }, intervalMs);
    },
    showNowPlaying: function() {
      var layout = new NowPlayingLayout({
        collection: this.collections.nowPlaying,
        lastFmApi: this.app.lastFmApi
      });
      this.app.main.show(layout);
    },
    close: function() {
      this.disablePoll();
    }
  });

  return KexpAppController;
});