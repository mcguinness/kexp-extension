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

      $table
        .find("span.badge-likes")
          .tooltip({
            placement: "right",
            title: function() {
              return '<i class="icon-time icon-white"></i> ' + moment(self.model.get("timeLastLike")).format("MMM Do, YYYY @ hh:mm A");
            }
          });

      if (this.appConfig.getLastFm().isLikeShareEnabled() &&
        this.model.hasLastFmShareStatus(LikedSongModel.LastFmShareStatus.TrackLove) &&
        _.isDate(this.model.get("timeLastFmLoveShare"))) {

          $table
            .find("#btn-lastfm-love")
              .tooltip({
                placement: "right",
                title: function() {
                  return '<i class="icon-time icon-white"></i> ' + moment(self.model.get("timeLastFmLoveShare")).format("MMM Do, YYYY @ hh:mm A");
                }
              });
      }


    },
    getPopoverTitle: function() {
      return this.model.get("songTitle");
    }
    
  });
  return LikedSongPopoverView;
});