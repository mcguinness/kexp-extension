define([
  "jquery",
  "underscore",
  "backbone",
  "backbone-extensions",
  "marionette",
  "marionette-extensions",
  "views/NavRegionView",
  "views/PlayerView",
  "views/NowPlayingLayout",
  "views/LikedSongListView",
  "views/AboutView",
  "collections/NowPlayingCollection"
  ], function($, _, Backbone, BackboneExt, Marionette, MarionetteExt,
    NavRegionView,
    PlayerView,
    NowPlayingLayout,
    LikedSongListView,
    AboutView,
    NowPlayingCollection) {

  var kexpApp = new Backbone.Marionette.Application();

  var AppRouter = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
      "about": "showAbout",
      "likes": "showLikedSongs",
      //Default View
      "*other": "showNowPlaying"
    },
    controller: {
      showAbout: function() {
        var aboutView = new AboutView();
        //console.log("[Show LikedSongListView");
        kexpApp.main.show(aboutView, "append");
      },
      showLikedSongs: function() {
        var self = this;
        var likedSongsView = new LikedSongListView();
        //console.log("[Fetch LikedSongListView Collection]");
        likedSongsView.collection.fetch()
          .then(function(collection, resp) {
            //console.log("[Show LikedSongListView]");
            kexpApp.main.show(likedSongsView, "append");
          });
      },
      showNowPlaying: function() {
        var collection = new NowPlayingCollection();
        //console.log("[Fetch NowPlayingLayout Collection]");
        collection.fetch({upsert: true})
          .always(function() {
            var layout = new NowPlayingLayout({
              collection: collection
            });
            //console.log("[Show NowPlayingLayout]");
            kexpApp.main.show(layout, "append");
            layout.enablePoll(60000);
          });
      }
    }
  });

  kexpApp.addInitializer(function(options) {
    var self = this;
    
    this.addRegions({
      nav: NavRegionView,
      main: "#view-content",
      player: "#view-player"
    });
    
    // Must close player on window unload since we are hooking event handlers to background page
    this.close = function() {
      self.nav.close();
      self.main.close();
      self.player.close();
    };
  });

  kexpApp.addInitializer(function(options) {
    var playerView = new PlayerView({
      audioElement: options.audioElement
    });
    this.player.show(playerView);
  });

  kexpApp.addInitializer(function(options) {
    this.router = new AppRouter();
    Backbone.history.start();
  });

  return kexpApp;
});