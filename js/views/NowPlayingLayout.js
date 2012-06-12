define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "views/NowPlayingFsm",
  "views/NowPlayingSongView",
  "views/NowPlayingFooterView",
  "views/LastFmMetaView",
  "views/NowPlayingErrorView",
  "collections/NowPlayingCollection",
  "text!templates/nowplaying.html"
  ], function($, _, Marionette, NowPlayingFsm, NowPlayingSongView, NowPlayingFooterView,
    LastFmMetaView, NowPlayingErrorView, NowPlayingCollection, LayoutTemplate) {

  // Value is used as mask, so order matters
  var ShowType = {
    Reset: 0,
    Page: 1,
    Update: 2,
    New: 3
  };
  Object.freeze(ShowType);


  var NowPlayingLayout = Marionette.Layout.extend({

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
      _.bindAll(this, "pollNowPlaying", "handleManualPageTimeout");

      this.bindTo(this.collection, "add", this.handleNewSong, this);
      this.bindTo(this.collection, "change", this.handleUpdatedSong, this);
      this.bindTo(this.collection, "error", this.handleError, this);

      this.bindTo(this.vent, "nowplaying:refresh:manual", this.handleManualRefresh, this);
      this.bindTo(this.vent, "nowplaying:page:prev", this.handlePagePrev, this);
      this.bindTo(this.vent, "nowplaying:page:next", this.handlePageNext, this);

    },
    onShow: function() {
      var mostRecentModel = this.collection.last();
      this.showNowPlaying(mostRecentModel, ShowType.Reset);
      this.vent.trigger("nowplaying:cycle", mostRecentModel);
    },
    showNowPlaying: function(nowPlayingModel, showType) {
      if (this._currentLoader) {
        delete this._currentLoader;
      }

      showType || (showType = ShowType.New);

      // Skip New or Changed models if Manual page is activated and current page is not the model
      if (showType > ShowType.Page && this.hasManualPageEnabled() && this._currentNowPlaying !== nowPlayingModel) {
        return;
      }

      // Shortcut for Updates
      if (showType === ShowType.Update && this._currentNowPlaying === nowPlayingModel) {
        this.showSongView(nowPlayingModel);
        return;
      }

      var layout = this,
        loader = this._currentLoader = new NowPlayingFsm(nowPlayingModel),
        loaderDfr = $.Deferred().always(function() {
          delete layout._currentLoader;
          loader = null;
        });

      loader.on("initialized", function(model) {
        // Set Now Playing Current State
        layout._currentNowPlaying = model;
        layout.showSongView(model);
      });
      loader.on("resolve:liked", function(model) {
        layout.showFooterView(model);
      });
      loader.on("resolve:lastfm", function(model) {
        layout.showMetaView(model);
      });
      loader.on("reconciled", function(model) {
        console.log("[Loaded NowPlaying] %s", model.toDebugString());
        loaderDfr.resolve(model);
      });
      loader.on("error", function(model, error) {
        layout.vent.trigger("analytics:trackevent", "NowPlaying", "Error",
          _.isObject(model) && _.isFunction(model.toDebugString) ?
            model.toDebugString() : "");
        layout.showErrorView();
        loaderDfr.reject(model, error);
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
      var songIndex = this.collection.indexOf(nowPlayingModel);
      var footerView = new NowPlayingFooterView({
        model: nowPlayingModel,
        pager: {
          canPagePrev: songIndex > 0,
          canPageNext:  songIndex < this.collection.size() - 1
        }
      });
      
      var regionView = this.footer.show(footerView, "append");
      this.footer.$el.toggleClass("hide", false);
      return regionView;
    },
    showMetaView: function(nowPlayingModel) {
      var metaView = new LastFmMetaView({
        model: nowPlayingModel,
        popoverEl: "#navbar-top"
      });
      return this.meta.show(metaView, "append");
    },
    showErrorView: function(nowPlayingModel) {
      $(this.footer.el).toggleClass("hide", true);
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
    hasManualPageEnabled: function() {
      return (!_.isUndefined(this._manualPageTimeoutId));
    },
    disableManualPage: function() {
      if (!_.isUndefined(this._manualPageTimeoutId)) {
        window.clearTimeout(this._manualPageTimeoutId);
        delete this._manualPageTimeoutId;
      }
    },
    enableManualPage: function() {
      this.disableManualPage();
      this._manualPageTimeoutId = window.setTimeout(this.handleManualPageTimeout, 30 * 1000);
    },
    handleError: function(collection, model) {
      console.debug("[Error NowPlaying] - Unable to upsert now playing to view collection");
      this.showNowPlaying(void 0, ShowType.Reset);
      this.vent.trigger("nowplaying:cycle");
    },
    handleNewSong: function(model, collection) {
      console.debug("[New NowPlaying] - Added new %s to view collection", model.toDebugString());
      this.showNowPlaying(model, ShowType.New);
      this.vent.trigger("nowplaying:cycle", model);
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
        this.showNowPlaying(model, ShowType.New);
      } else if (songChange) {
        console.debug("[Updated NowPlaying] - Attributes changed for %s", model.toDebugString());
        this.showNowPlaying(model, ShowType.Update);
      }
    },
    handleManualRefresh: function() {
      this.handleManualPageTimeout();
      this.pollNowPlaying();
    },
    handleManualPageTimeout: function() {
      this.disableManualPage();
      var mostRecentNowPlaying = this.collection.last();
      if (this._currentNowPlaying !== mostRecentNowPlaying) {
        this.showNowPlaying(mostRecentNowPlaying, ShowType.Reset);
      }
    },
    handlePagePrev: function(model) {
      var songIndex = this.collection.indexOf(model) - 1;
      if (songIndex >= 0) {
        this.showNowPlaying(this.collection.at(songIndex), ShowType.Page);
        this.enableManualPage();
      }
    },
    handlePageNext: function(model) {
      var songIndex = this.collection.indexOf(model) + 1;
      if (songIndex > 0 && songIndex <= this.collection.size() - 1) {
        this.showNowPlaying(this.collection.at(songIndex), ShowType.Page);
        this.enableManualPage();
      }
    },
    beforeClose: function() {
      // Song "could" be loading during close.  This should kill any event handlers
      if (this._currentLoader) {
        this._currentLoader.eventListeners = {};
        delete this._currentLoader;
      }
      this.disablePoll();
      this.disableManualPage();
    }
  });

  return NowPlayingLayout;
});