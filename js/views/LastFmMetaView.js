define([
  "jquery",
  "backbone",
  "underscore",
  "marionette",
  "views/LastFmPopoverView",
  "jquery-kexp" // no need for arg
  ], function($, Backbone, _, Marionette, LastFmPopoverView) {
  
  var LastFmMetaView = Backbone.Marionette.ItemView.extend({
    tagName: "div",
    className: "meta-image",
    initialize: function(options) {
      this.vent = options.vent;
      this.popoverEl = options.popoverEl;
    },
    render: function() {
      var lastFmCollection = this.model.getLastFmCollection(),
        lastFmImageModel = lastFmCollection.getImageBySort([
          {
          entity: "album",
          imageSort: ["large", "medium", "small"]
        },
              {
          entity: "artist",
          imageSort: ["extralarge", "large", "medium", "small"]
        }
        ]);

      if (lastFmCollection.length > 0 && !_.isEmpty(this.popoverEl)) {
        this.popoverView = new LastFmPopoverView({
          el: this.popoverEl,
          model: this.model,
          vent: this.vent
        });
        this.popoverView.render();
      }

      if (lastFmImageModel) {
        this.$el.loadImage(lastFmImageModel.image.url, "kexp-box-small", {
          "title": lastFmImageModel.model.get("name"),
          "alt": lastFmImageModel.model.get("name")
        });
      }
    },
    beforeClose: function() {
      var $songImage = $("img", this.$el),
        beforeCloseDfr = $.Deferred();

      if (this.popoverView) {
        this.popoverView.close();
      }

      if ($songImage.length > 0) {
        $songImage.fadeOut(function() {
          beforeCloseDfr.resolve();
        });
      } else {
        beforeCloseDfr.resolve();
      }

      return beforeCloseDfr.promise();
    }
  });
  return LastFmMetaView;
});