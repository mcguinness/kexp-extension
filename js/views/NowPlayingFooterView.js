define([
  "jquery",
  "backbone",
  "underscore",
  "marionette",
  "text!templates/nowplaying-footer.html",
  "gaq",
  "jquery-ui", // no need for arg
  "jquery-kexp", // no need for arg
  "bootstrap" // no need for arg
  ], function($, Backbone, _, Marionette, ViewTemplate, _gaq) {
  
  var NowPlayingFooterView = Backbone.Marionette.ItemView.extend({
    template: ViewTemplate,
    initialize: function(options) {
      this.vent = options.vent;
      this.collection = this.model.collection;
      this.bindTo(this.vent, "nowplaying:lastfm:popover:enabled", this.showLastFmButton, this);
      this.bindTo(this.vent, "nowplaying:refresh:background", this.handleBackgroundRefresh, this);
    },
    events: {
      "click #button-like": "handleLike",
      "click #button-lastfm": "handleLastFmPopoverToggle",
      "click #button-refresh": "handleRefresh"
    },
    onRender: function() {
      self = this;

      $(this.el)
        .find("#button-spotify")
          .attr("href", self.model.toSpotifyUrl())
            .tooltip({
              placement: "top",
              title: "Searches Spotify (requires Spotify app and access to launch from web)"
            });
      $(this.el)
        .find("#button-refresh")
          .tooltip({
            placement: "top",
            title: function() {
              return "Last Update: " + self.model.get("LastUpdate");
            }
          });

    },
    onShow: function() {
      var $footer = $(this.el).find("#song-footer");
      _.delay(function() {
        $footer.addClass("in");
      });

    },
    showRefreshAnimation: function() {
      var $icon = $("#button-refresh i", this.el).removeClass("rotate");
      _.delay(function() {
        $icon.addClass("rotate");
      });
    },
    showLastFmButton: function() {
      var $button = $("#button-lastfm", this.$el).removeClass("hide").addClass("fade");
      _.delay(function() {
        $button.addClass("in");
      });
    },
    handleLike: function(event) {
      var modelId = $(event.currentTarget).attr("data-id"),
        targetModel = this.collection.get(modelId),
        likedSong;

      if (_.isUndefined(targetModel)) {
        return;
      }

      _gaq.push(["_trackEvent", "Like", "click"]);

      likedSong = targetModel.getLikedSong() || targetModel.toSong();
      likedSong.like();

      // Note: collection:change event doesn't seem to fire if model is not new, rel:change event does fire
      // if adding new related model
      if (likedSong.isNew()) {
        likedSong.save();
        targetModel.setLikedSong(likedSong);
      } else {
        likedSong.save();
      }

      $(".badge", this.$el).toggleClass("badge-zero", false).text(likedSong.get("likeCount"));
    },
    handleBackgroundRefresh: function() {
      $("#button-refresh", this.$el).tooltip("hide");
      this.showRefreshAnimation();
    },
    handleRefresh: function(event) {
      _gaq.push(["_trackEvent", "Refresh", "click"]);
      this.handleBackgroundRefresh();
      this.vent.trigger("nowplaying:refresh:manual");
    },
    handleLastFmPopoverToggle: function() {
      this.vent.trigger("nowplaying:lastfm:popover:toggle");
    },
    beforeClose: function() {
      var fadeDfr = $.Deferred();
      $(this.el).find("#song-footer")
        .queueTransition(function() {
          fadeDfr.resolve();
        }).removeClass("in");

      return fadeDfr.promise();
    }
  });
  return NowPlayingFooterView;
});