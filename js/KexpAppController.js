define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "collections/NowPlayingCollection",
  "views/NowPlayingLayout",
  "views/LikedSongListView"
  ], function($, _, Backbone, NowPlayingCollection,
    NowPlayingLayout, LikedSongListView) {

  var KexpAppController = function(kexpApp) {
    this.kexpApp = kexpApp;
  };

  _.extend(KexpAppController.prototype, {
    showLikedSongs: function() {
      var self = this;
      var likedSongsView = new LikedSongListView();
      //console.log("[Fetch LikedSongListView Collection]");
      likedSongsView.collection.fetch()
        .then(function(collection, resp) {
          //console.log("[Show LikedSongListView]");
          self.kexpApp.main.show(likedSongsView);
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
            vent: self.kexpApp.vent,
            appConfig: self.kexpApp.appConfig
          });
          //console.log("[Show NowPlayingLayout]");
          self.kexpApp.main.show(layout);
          layout.enablePoll(60000);
        });
    }
  });

  return KexpAppController;
});