define([
  "jquery",
  "underscore",
  "marionette-extensions",
  "views/NowPlayingFsm",
  "views/NowPlayingSongView",
  "views/NowPlayingFooterView",
  "views/LastFmMetaView",
  "views/NowPlayingErrorView",
  "collections/NowPlayingCollection",
  "text!templates/nowplaying.html"
  ], function($, _, Backbone, NowPlayingFsm, NowPlayingSongView, NowPlayingFooterView,
    LastFmMetaView, NowPlayingErrorView, NowPlayingCollection, LayoutTemplate) {

  var NowPlayingLayout = Backbone.Marionette.Layout.extend({

    template: LayoutTemplate,
    regions: {
      song: "#region-nowplaying-song",
      meta: "#region-nowplaying-meta",
      footer: "#region-nowplaying-footer"
    },
    initialize: function(options) {
      
      if (this.collection === undefined) {
        this.collection = new NowPlayingCollection();
      }

      _.bindAll(this, "showNowPlaying", "disablePoll", "enablePoll", "pollNowPlaying");

      this.bindTo(this.collection, "add", this.handleNewSong, this);
      this.bindTo(this.collection, "change", this.handleUpdatedSong, this);
      this.bindTo(this.collection, "error", this.handleError, this);

      this.bindTo(this.vent, "nowplaying:refresh:manual", this.pollNowPlaying, this);
    },
    onShow: function() {
      this.showNowPlaying(this.collection.last());
    },
    showNowPlaying: function(nowPlayingModel) {

      var loader = new NowPlayingFsm(nowPlayingModel),
        loaderDfr = $.Deferred(),
        layout = this;

      loader.on("initialized", function() {
        layout.showSongView(nowPlayingModel);
      });
      loader.on("resolve:liked", function() {
        layout.showFooterView(nowPlayingModel);
      });
      loader.on("resolve:lastfm", function() {
        layout.showMetaView(nowPlayingModel);
      });
      loader.on("loaded", function() {
        console.log("[Loaded NowPlaying]");
        loaderDfr.resolve(nowPlayingModel);
      });
      loader.on("error", function(error) {
        this.vent.trigger("analytics:trackevent", "NowPlaying", "Error", error);
        layout.showErrorView();
        loaderDfr.reject(nowPlayingModel, error);
      });
      // Wait for fade out transitions
      $.when(
        layout.footer ? layout.footer.close() : true,
        layout.meta ? layout.meta.close() : true)
        .then(function() {
          loader.handle("initialize");
        });

      return loaderDfr.promise();
    },
    showSongView: function(nowPlayingModel) {
      var songView = new NowPlayingSongView({
        model: nowPlayingModel
      });
      return this.song.show(songView, "append");
    },
    showFooterView: function(nowPlayingModel) {
      var footerView = new NowPlayingFooterView({
        model: nowPlayingModel
      });
      return this.footer.show(footerView, "append");
    },
    showMetaView: function(nowPlayingModel) {
      var metaView = new LastFmMetaView({
        model: nowPlayingModel,
        popoverEl: "#navbar-top"
      });
      return this.meta.show(metaView, "append");
    },
    showErrorView: function(nowPlayingModel) {
      var errorView = new NowPlayingErrorView();
      return this.song.show(errorView, "append");
    },
    disablePoll: function() {
      if (this.pollIntervalId !== undefined) {
        clearInterval(this.pollIntervalId);
        delete this.pollIntervalId;
      }
    },
    enablePoll: function(intervalMs) {
      var self = this;
      self.disablePoll();
      self.pollIntervalId = setInterval(function() {
        self.vent.trigger("nowplaying:refresh:background", self.collection);
        self.pollNowPlaying();
      }, intervalMs);
    },
    pollNowPlaying: function(event) {
      var collection = (event instanceof Backbone.Collection) ? event : this.collection;
      collection.fetch({upsert: true});
    },
    handleError: function(collection, model) {
      var self = this;
      console.debug("[Error NowPlaying] - Added adding new new playing to view collection", model, collection);
      this.vent.trigger("analytics:trackevent", "NowPlaying", "Error", model && _.isFunction(model.toDebugString) ?
        model.toDebugString() : "");
      $.when(
        self.footer ? self.footer.close() : true,
        self.meta ? self.meta.close() : true)
        .then(function() {
          self.showErrorView();
        });
      
    },
    handleNewSong: function(model, collection) {
      console.debug("[New NowPlaying] - Added new %s to view collection", model.toDebugString(), model, collection);
      this.showNowPlaying(model);
    },
    handleUpdatedSong: function(model) {
      console.debug("[Updated NowPlaying] - Attributes changed for %s", model.toDebugString(), model);

      var identityChange = _.any(Object.keys(model.changed), function(key) {
        return (key === ("album" || "artist" || "songTitle"));
      });
      var songChange = _.any(Object.keys(model.changed), function(key) {
        return (key === ("albumYear" || "albumLabel" || "comments" || "timePlayed"));
      });

      if (identityChange) {
        this.showNowPlaying(model);
      } else if (songChange) {
        this.showSongView(model);
      }
    },
    beforeClose: function() {
      this.disablePoll();
    }
  });

  return NowPlayingLayout;
});