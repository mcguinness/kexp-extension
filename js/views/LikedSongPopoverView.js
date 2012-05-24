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

      json.timeLastLike = moment(json.timeLastLike).format("MMM Do, YYYY @ hh:mm A");
      json.isLikeShareEnabled = this.appConfig.getLastFm().isLikeShareEnabled();
      json.hasLastFmLoveShare = this.model.hasLastFmShareStatus(LikedSongModel.LastFmShareStatus.TrackLove);
      json.timeLastFmLoveShare = _.isEmpty(json.timeLastFmLoveShare) ? "" :
        moment(json.timeLastFmLoveShare).format("MMM Do, YYYY @ hh:mm A");

      console.log("Popover JSON: ", json);

      return { model: json};
    },
    getPopoverTitle: function() {
      return this.model.get("songTitle");
    }
    
  });
  return LikedSongPopoverView;
});