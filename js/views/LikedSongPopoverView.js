define([
  "jquery",
  "underscore",
  "marionette-extensions",
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
     this.hideOnClose = true;
    },
    serializeData: function() {
      var json = this.model.toJSON();

      json.isLikeShareEnabled = this.appConfig.getLastFm().isLikeShareEnabled();
      json.isLikeScrobbleEnabled = this.appConfig.getLastFm().isLikeScrobbleEnabled();
      json.hasLastFmLoveShare = this.model.hasLastFmShareStatus(LikedSongModel.LastFmShareStatus.TrackLove);
      json.artistSpotifyUrl = "spotify:search:" + encodeURI('artist:"' + json.artist + '"');
      json.albumSpotifyUrl = "spotify:search:" + encodeURI('artist:"' + json.artist + '" album:"' + json.album + '"');
      json.trackSpotifyUrl = "spotify:search:" + encodeURI('artist:"' + json.artist + '" track:"' + json.songTitle + '"');
      
      console.log("Popover JSON: ", json);

      return { model: json};
    },
    onShow: function() {
      var self = this;
      var $table = $("#table-liked-info");
      var loveTooltipTitle;

      $table.find("[rel=tooltip]").tooltip();

      $table
        .find("span.badge-likes")
          .tooltip({
            placement: "right",
            title: function() {
              return '<i class="icon-time icon-white"></i> ' + moment(self.model.get("timeLastLike")).format("MMM Do, YYYY @ hh:mm A");
            }
          });

      if (this.model.hasLastFmShareStatus(LikedSongModel.LastFmShareStatus.TrackLove) &&
        _.isDate(this.model.get("timeLastFmLoveShare"))) {
        
        loveTooltipTitle = '<i class="icon-time icon-white"></i> ' +
          moment(self.model.get("timeLastFmLoveShare")).format("MMM Do, YYYY @ hh:mm A");

      } else if (this.appConfig.getLastFm().isLikeShareEnabled()) {
        loveTooltipTitle = "<strong>Last.fm Sharing Enabled</strong> - Share this song to your Last.fm profile (Love)";
      } else {
        loveTooltipTitle = "<strong>Last.fm Sharing Disabled</strong> - Share likes with your Last.fm profile (See Options)";
      }

      $table
        .find("#btn-lastfm-love")
          .tooltip({
            placement: "right",
            title: function() {
              return loveTooltipTitle;
            }
          });


    },
    getPopoverTitle: function() {
      return this.model.get("songTitle");
    }
    
  });
  return LikedSongPopoverView;
});