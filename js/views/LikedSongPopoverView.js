define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "models/LikedSongModel",
  "views/PopoverView",
  "text!templates/likedsong-popover.html",
  "text!templates/likedsong-popover-info.html",
  "moment"
  ], function($, _, Backbone, LikedSongModel, PopoverView, PopoverTemplate, PopoverContentTemplate) {

  var LikedSongPopoverView = PopoverView.extend({

    template: PopoverContentTemplate,
    popoverTemplate: PopoverTemplate,
    initialize: function(options) {
     this.waitForHideOnClose = true;
     this.lastFmConfig = this.appConfig.getLastFm();
    },
    tooltips: {
      "[rel=tooltip]": "tooltip",
      "span.badge-likes": "tooltip",
      "span.badge-scrobbles": "tooltip",
      "#btn-lastfm-love": "tooltip",
      "this": "popover wait"
    },
    serializeData: function() {
      var json = this.model.toJSON();

      json.isLikeShareEnabled = this.lastFmConfig.isLikeShareEnabled();
      json.isLikeScrobbleEnabled = this.lastFmConfig.isLikeScrobbleEnabled();
      json.hasLastFmLoveShare = this.model.hasLastFmShareStatus(LikedSongModel.LastFmShareStatus.TrackLove);
      json.artistSpotifyUrl = "spotify:search:" + encodeURI('artist:"' + json.artist + '"');
      json.albumSpotifyUrl = "spotify:search:" + encodeURI('artist:"' + json.artist + '" album:"' + json.album + '"');
      json.trackSpotifyUrl = "spotify:search:" + encodeURI('artist:"' + json.artist + '" track:"' + json.songTitle + '"');

      return { model: json};
    },
    onShow: function() {
      var self = this;
      var $table = $("#table-liked-info");
      var hasTrackLoveDate = this.model.hasLastFmShareStatus(LikedSongModel.LastFmShareStatus.TrackLove) &&
        _.isDate(this.model.get("timeLastFmLoveShare"));

      $table.find("[rel=tooltip]").tooltip();

      $table
        .find("span.badge-likes")
          .tooltip({
            placement: "right",
            title: function() {
              return '<i class="icon-time icon-white"></i> ' + moment(self.model.get("timeLastLike")).format("MMM Do, YYYY @ hh:mm A");
            }
          });

      $table
        .find("span.badge-scrobbles")
          .tooltip({
            placement: "bottom",
            title: function() {
              return self.lastFmConfig.isLikeScrobbleEnabled() ?
                "<strong>Last.fm Scrobble Enabled</strong> - Last.fm Track Scrobbles (Listens)" :
                (self.model.get("lastFmTrackScrobbleCount") > 0 ?
                  "<strong>Last.fm Scrobble Disabled</strong> - Previous Last.fm Track Scrobbles (Listens)" :
                  "<strong>Last.fm Scrobble Disabled</strong> - Scrobble listens with your Last.fm profile (See Options)");
            }
          });

      $table
        .find("#btn-lastfm-love")
          .tooltip({
            placement: "right",
            title: function() {
              return hasTrackLoveDate ?
                '<i class="icon-time icon-white"></i> ' + moment(self.model.get("timeLastFmLoveShare")).format("MMM Do, YYYY @ hh:mm A") :
                (self.lastFmConfig.isLikeShareEnabled() ?
                  "<strong>Last.fm Sharing Enabled</strong> - Share this song to your Last.fm profile (Love)" :
                  "<strong>Last.fm Sharing Disabled</strong> - Share likes with your Last.fm profile (See Options)");
            }
          });


    },
    getPopoverTitle: function() {
      return this.model.get("songTitle");
    }
    
  });
  return LikedSongPopoverView;
});