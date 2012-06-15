define([
  "jquery",
  "underscore",
  "views/PopoverView",
  "models/LikedSongModel",
  "text!templates/likedsong-popover.html",
  "text!templates/likedsong-popover-info.html",
  "moment"
  ], function($, _, PopoverView, LikedSongModel, PopoverTemplate, PopoverContentTemplate) {

  var LikedSongPopoverView = PopoverView.extend({

    template: PopoverContentTemplate,
    popoverTemplate: PopoverTemplate,
    initialize: function(options) {
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
      json.artistKexpUrl = "http://kexp.org/search/search.aspx?q=" + encodeURI(json.artist);
      json.artistSpotifyUrl = "spotify:search:" + encodeURI('artist:"' + json.artist + '"');
      json.albumKexpUrl = "http://kexp.org/search/search.aspx?q=" + encodeURI(json.album);
      json.albumSpotifyUrl = "spotify:search:" + encodeURI('artist:"' + json.artist + '" album:"' + json.album + '"');
      json.trackKexpUrl = "http://kexp.org/search/search.aspx?q=" + encodeURI(json.songTitle);
      json.trackSpotifyUrl = "spotify:search:" + encodeURI('artist:"' + json.artist + '" track:"' + json.songTitle + '"');

      return { model: json};
    },
    onShow: function() {
      var view = this;
      var $table = $("#table-liked-info");
      var hasTrackLoveDate = this.model.hasLastFmShareStatus(LikedSongModel.LastFmShareStatus.TrackLove) &&
        _.isDate(this.model.get("timeLastFmLoveShare"));

      $table.find("[rel=tooltip]").tooltip();

      $table
        .find("span.badge-likes")
          .tooltip({
            placement: "right",
            title: function() {
              return '<i class="icon-time icon-white"></i> ' + moment(view.model.get("timeLastLike")).format("MMM Do, YYYY @ hh:mm A");
            }
          });

      $table
        .find("span.badge-scrobbles")
          .tooltip({
            placement: "bottom",
            title: function() {
              return view.lastFmConfig.isLikeScrobbleEnabled() ?
                "<strong>Last.fm Scrobble Enabled</strong> - Last.fm Track Scrobbles (Listens)" :
                (view.model.get("lastFmTrackScrobbleCount") > 0 ?
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
                '<i class="icon-time icon-white"></i> ' + moment(view.model.get("timeLastFmLoveShare")).format("MMM Do, YYYY @ hh:mm A") :
                (view.lastFmConfig.isLikeShareEnabled() ?
                  "<strong>Last.fm Sharing Enabled</strong> - Share this song to your Last.fm profile (Love)" :
                  "<strong>Last.fm Sharing Disabled</strong> - Share likes with your Last.fm profile (See Options)");
            }
          });


    },
    getPopoverTitle: function() {
      var title = this.model.get("songTitle");
      if (_.isEmpty(title)) {
        title = this.model.get("artist");
        if (_.isEmpty(title)) {
          title = this.model.get("album");
        }
      }

      return title;
    }
    
  });
  return LikedSongPopoverView;
});