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
  };

  _.extend(KexpAppController.prototype, {
    showLikedSongs: function() {
      var self = this;
      var likedSongsView = new LikedSongListView();
      //console.log("[Fetch LikedSongListView Collection]");
      likedSongsView.collection.fetch()
        .then(function(collection, resp) {
          //console.log("[Show LikedSongListView]");
          self.app.main.show(likedSongsView);
        });
    },
    showNowPlaying: function() {
      var self = this;
      var collection = new NowPlayingCollection();
      //console.log("[Fetch NowPlayingLayout Collection]");
      collection.fetch({upsert: true})
        .always(function() {
          var layout = new NowPlayingLayout({
            collection: collection,
            vent: self.app.vent,
            appConfig: self.app.appConfig,
            lastFmApi: self.app.lastFmApi
          });
          //console.log("[Show NowPlayingLayout]");
          self.app.main.show(layout);
          layout.enablePoll(60000);
        });
    }
  });

  return KexpAppController;
});