define([
  "jquery",
  "underscore",
  "backbone-kexp",
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
      if (this._currentLoader) {
        delete this._currentLoader;
      }
      var layout = this,
        loader = this._currentLoader = new NowPlayingFsm(nowPlayingModel),
        loaderDfr = $.Deferred().always(function() {
          delete layout._currentLoader;
          loader = null;
        });

      loader.on("initialized", function() {
        layout.showSongView(nowPlayingModel);
      });
      loader.on("resolve:liked", function() {
        layout.showFooterView(nowPlayingModel);
      });
      loader.on("resolve:lastfm", function() {
        layout.showMetaView(nowPlayingModel);
      });
      loader.on("reconciled", function() {
        console.log("[Loaded NowPlaying] %s", nowPlayingModel.toDebugString());
        loaderDfr.resolve(nowPlayingModel);
      });
      loader.on("error", function(error) {
        layout.vent.trigger("analytics:trackevent", "NowPlaying", "Error", error);
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
      var layout = this;
      layout.disablePoll();
      layout.pollIntervalId = setInterval(function() {
        layout.vent.trigger("nowplaying:refresh:background", layout.collection);
        layout.pollNowPlaying();
      }, intervalMs);
    },
    pollNowPlaying: function(event) {
      var collection = (event instanceof Backbone.Collection) ? event : this.collection;
      collection.fetch({upsert: true});
    },
    handleError: function(collection, model) {
      var layout = this;
      console.debug("[Error NowPlaying] - Added adding new new playing to view collection", model, collection);
      this.vent.trigger("analytics:trackevent", "NowPlaying", "Error", model && _.isFunction(model.toDebugString) ?
        model.toDebugString() : "");
      
      this.showNowPlaying(void 0);
    },
    handleNewSong: function(model, collection) {
      console.debug("[New NowPlaying] - Added new %s to view collection", model.toDebugString());
      this.showNowPlaying(model);
    },
    handleUpdatedSong: function(model) {
      var key;
      var identityChange = _.any(Object.keys(model.changed), function(key) {
        return model.frozenAttributeKeys.indexOf(key) !== -1;
      });
      var songChange = _.any(Object.keys(model.changed), function(key) {
        return model.amendableAttributeKeys.indexOf(key) !== -1;
      });

      if (identityChange) {
        this.showNowPlaying(model);
      } else if (songChange) {
        console.debug("[Updated NowPlaying] - Attributes changed for %s", model.toDebugString());
        this.showSongView(model);
      }
    },
    beforeClose: function() {
      if (this._currentLoader) {
        delete this._currentLoader;
      }
      this.disablePoll();
    }
  });

  return NowPlayingLayout;
});