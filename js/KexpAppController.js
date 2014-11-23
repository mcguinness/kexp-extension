define([
  "jquery",
  "underscore",
  "models/ShowModel",
  "collections/NowPlayingCollection",
  "views/PlayerView",
  "views/NowPlayingLayout",
  "views/LikedSongListView",
  "moment"
  ], function($, _, ShowModel, NowPlayingCollection,
    PlayerView, NowPlayingLayout, LikedSongListView) {

  var KexpAppController = function(application, options) {
    options || (options = {});

    this.app = application;

    // Controller State
    this.collections = {
      nowPlaying: options.nowPlayingCollection || new NowPlayingCollection()
    };
    this.models = {
      show: new ShowModel()
    };
    // Player Region is static across all routers
    this.views = {
      player: new PlayerView({
        liveStreamEl: options.liveStreamEl,
        showModel: this.models.show
      })
    };
    application.footer.show(this.views.player);

    _.bindAll(this, "handleFetchShowPoll");
    this.handleFetchShowPoll();
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
            _.delay(_.bind(self.showNowPlaying, self), 250);
    
          });
      }
    },
    showNowPlaying: function() {
      var layout = new NowPlayingLayout({
        collection: this.collections.nowPlaying,
        lastFmApi: this.app.lastFmApi
      });
      this.app.main.show(layout);
    },
    disableFetchShowPoll: function() {
      if (this._showFetchTimeoutId) {
        window.clearTimeout(this.showFetchTimeoutId);
        delete this._showFetchTimeoutId;
      }
    },
    enableFetchShowPoll: function(nextPollSeconds) {
      this.disableFetchShowPoll();
      console.log("Will poll kexp show info in [%s] seconds...", nextPollSeconds);
      this._showFetchTimeoutId = window.setTimeout(this.handleFetchShowPoll, nextPollSeconds * 1000);
    },
    handleFetchShowPoll: function() {
      var self = this,
          // Add random seconds (up to 1 minute) to poll so not every client hits server at the same time
          nextPollGraceSeconds = (2 * 60) + Math.round(((Math.random() * 60) + 1));
      
      console.log("Polling kexp show info...");
      $.when(this.models.show.fetch())
        .done(function(model) {
          var nextPollSeconds = moment(model.get("timeEnd")).diff(moment(), "seconds");
          nextPollSeconds += nextPollGraceSeconds;
          if (nextPollSeconds <= nextPollGraceSeconds) {
            nextPollSeconds = nextPollGraceSeconds;
          }
          self.enableFetchShowPoll(nextPollSeconds);
        })
        .fail(function(model, error, options) {
          console.warn("Error [%s] fetching kexp show", JSON.stringify(error));
          self.enableFetchShowPoll(nextPollGraceSeconds);
        });
    },
    close: function() {
      Backbone.history.stop();
      this.disableFetchShowPoll();

      _.each(this.views, function(view) {
        view.close();
        delete this.views;
      });

      delete this.models;
      delete this.collections;
    }
  });

  return KexpAppController;
});