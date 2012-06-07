define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "text!templates/nowplaying-footer.html",
  "moment",
  "jquery-ui", // no need for arg
  "jquery-kexp", // no need for arg
  "bootstrap" // no need for arg
  ], function($, _, Backbone, ViewTemplate) {
  
  var NowPlayingFooterView = Backbone.Marionette.ItemView.extend({
    template: ViewTemplate,
    className: "container-nowplaying-footer",
    initialize: function(options) {
      this.collection = this.model.collection;
      this.lastFmConfig = this.appConfig.getLastFm();
      
      this.bindTo(this.vent, "nowplaying:lastfm:popover:enabled", this.showLastFmButton, this);
      this.bindTo(this.vent, "nowplaying:refresh:background", this.handleBackgroundRefresh, this);
      this.bindTo(this.vent, "lastfm:track:love:success", this.showShareAnimation, this);
      this.bindTo(this.lastFmConfig, "change:sessionKey", this.handleLastFmAuthorizationChange, this);

    },
    events: {
      "click #button-like": "handleLike",
      "click #button-lastfm": "handleLastFmPopoverToggle",
      "click #button-refresh": "handleRefresh"
    },
    tooltips: {
      "#button-spotify" : "tooltip",
      "#button-refresh" : "tooltip",
      "#button-share" : "tooltip"
    },
    serializeData: function() {
      return {
        model: {
          id: this.model.id,
          likeCount: this.model.hasLikedSong() ? this.model.likedSong.get("likeCount") : 0,
          likeShareEnabled: this.lastFmConfig.isLikeShareEnabled()
        }
      };
    },
    onRender: function() {
      var view = this;

      $(this.el)
        .find("#button-spotify")
          .attr("href", view.model.toSpotifyUrl())
            .tooltip({
              placement: "top",
              title: "Searches Spotify (requires Spotify app and access to launch from web)"
            });
      if (_.isDate(view.model.get("timeLastUpdate"))) {
        $(this.el)
          .find("#button-refresh")
            .tooltip({
              placement: "top",
              title: function() {
                return "Last Update: " + moment.utc(view.model.get("timeLastUpdate")).local().format("M/D/YYYY h:mm:ss A");
              }
            });
      }
      $(this.el)
        .find("#button-share")
          .tooltip({
            placement: "top",
            title: function() {
              return view.lastFmConfig.isLikeShareEnabled() ?
              "<strong>Last.fm Sharing Enabled</strong> - Likes will be shared to your Last.fm profile as 'loves' (See Options)" :
              "<strong>Last.fm Sharing Disabled</strong> - Likes will only be locally stored and not shared with your Last.fm profile (See Options)";
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
      var $icon = $("#button-refresh i", this.$el).removeClass("rotate");
      _.delay(function() {
        $icon.addClass("rotate");
      });
    },
    showShareAnimation: function() {
      var $icon = $("#button-share i", this.$el).removeClass("pulse");
      _.delay(function() {
        $icon.addClass("pulse");
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
        likedSong, lastfmAttributes;

      if (_.isUndefined(targetModel)) return;

      likedSong = targetModel.likedSong || targetModel.toSong();
      likedSong.like();

      // Note: collection:change event doesn't seem to fire if model is not new, rel:change event does fire
      // if adding new related model
      if (likedSong.isNew()) {
        likedSong.save();
        targetModel.likedSong = likedSong;
      } else {
        lastfmAttributes = targetModel.getLastFmLikedSongAttributes();
        console.debug("[NowPlaying Like] merging now playing last.fm attributes [%s] to existing liked song [%s]",
          lastfmAttributes, JSON.stringify(likedSong));
        likedSong.set(lastfmAttributes);
        likedSong.save();
      }

      if (!_.isEmpty(likedSong.get("trackDownloadUrl"))) {
        this.vent.trigger("notification:info", "You can find the download link in the song info popover in your liked song collection.",
          "This song has a free download!");
      }

      this.vent.trigger("analytics:trackevent", "NowPlaying", "Like", targetModel.toDebugString(), likedSong.get("likeCount"));

      $(".badge", this.$el).toggleClass("badge-zero", false).text(likedSong.get("likeCount"));
      this.vent.trigger("nowplaying:like", targetModel);
    },
    handleBackgroundRefresh: function() {
      $("#button-refresh", this.$el).tooltip("hide");
      this.showRefreshAnimation();
    },
    handleRefresh: function(event) {
      this.vent.trigger("analytics:trackevent", "NowPlaying", "Refresh", "Manual");
      this.handleBackgroundRefresh();
      
      this.vent.trigger("nowplaying:refresh:manual");
    },
    handleLastFmPopoverToggle: function() {
      this.vent.trigger("nowplaying:lastfm:popover:toggle");
    },
    handleLastFmAuthorizationChange: function(model, value, options) {
      $("#button-share", this.$el).toggleClass("active", model.hasAuthorization());
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