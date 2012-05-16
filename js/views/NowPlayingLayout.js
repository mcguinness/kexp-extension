define([
  "jquery",
  "backbone",
  "underscore",
  "marionette",
  "views/NowPlayingFsm",
  "views/NowPlayingSongView",
  "views/NowPlayingFooterView",
  "views/LastFmMetaView",
  "views/NowPlayingErrorView",
  "collections/NowPlayingCollection",
  "text!templates/nowplaying.html",
  "gaq"
  ], function($, Backbone, _, Marionette, NowPlayingFsm, NowPlayingSongView, NowPlayingFooterView,
    LastFmMetaView, NowPlayingErrorView, NowPlayingCollection, LayoutTemplate, _gaq) {

  var NowPlayingLayout = Backbone.Marionette.Layout.extend({

    template: LayoutTemplate,
    regions: {
      song: "#region-song",
      meta: "#region-meta",
      footer: "#region-footer"
    },
    initialize: function() {
      if (this.collection === undefined) {
        this.collection = new NowPlayingCollection();
      }

      _.bindAll(this, "showNowPlaying", "disablePoll", "enablePoll", "pollNowPlaying");

      this.collection.bind("add", this.handleNewSong, this);
      this.collection.bind("change", this.handleUpdatedSong, this);
      this.collection.bind("error", this.handleError, this);

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
        _gaq.push(["_trackEvent", "NowPlaying", "error"]);
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
        model: nowPlayingModel,
        vent: this.vent
      });
      return this.song.show(songView, "append");
    },
    showFooterView: function(nowPlayingModel) {
      var footerView = new NowPlayingFooterView({
        model: nowPlayingModel,
        vent: this.vent
      });
      return this.footer.show(footerView, "append");
    },
    showMetaView: function(nowPlayingModel) {
      var metaView = new LastFmMetaView({
        model: nowPlayingModel,
        vent: this.vent,
        popoverEl: "#navbar-top"
      });
      return this.meta.show(metaView, "append");
    },
    showErrorView: function(nowPlayingModel) {
      var errorView = new NowPlayingErrorView({
        vent: this.vent
      });
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
    handleError: function() {
      console.debug("[Error NowPlaying] - Added adding new new playing to view collection", this.collection);
      _gaq.push(["_trackEvent", "NowPlaying", "error"]);
      this.showErrorView();
    },
    handleNewSong: function(model, collection) {
      console.debug("[New NowPlaying] - Added new %s to view collection", model.toDebugString(), model, collection);
      this.showNowPlaying(model);
    },
    handleUpdatedSong: function(model) {
      console.debug("[Updated NowPlaying] - Attributes changed for %s", model.toDebugString(), model);

      var identityChange = _.any(Object.keys(model.changed), function(key) {
        return (key === ("Album" || "Artist" || "SongTitle"));
      });
      var songChange = _.any(Object.keys(model.changed), function(key) {
        return (key === ("ReleaseYear" || "LabelName" || "Comments" || "TimePlayed"));
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