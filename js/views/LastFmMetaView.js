define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "marionette",
  "views/LastFmPopoverView",
  "jquery-kexp" // no need for arg
  ], function($, Backbone, _, Marionette, LastFmPopoverView) {
  
  var LastFmMetaView = Backbone.Marionette.ItemView.extend({
    tagName: "div",
    className: "container-nowplaying-meta",
    initialize: function(options) {
      _.bindAll(this, "render", "beforeClose");

      this.popoverEl = options.popoverEl;
      if (!this.popoverEl) {
        var err = new Error("A popover 'el' must be specified");
        err.name = "NoElError";
        throw err;
      }
    },
    render: function() {
      var lastFmCollection = this.model.lastFmMeta,
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
        this.$el.loadImage(lastFmImageModel.image.url, "kexp-box-small nowplaying-image", {
          "title": lastFmImageModel.model.get("name"),
          "alt": lastFmImageModel.model.get("name")
        });
      }
    },
    beforeClose: function() {
      var $image = $("img", this.$el),
        beforeCloseDfr = $.Deferred();

      if (this.popoverView) {
        this.popoverView.close();
        delete this.popoverView;
      }

      if ($image.length > 0) {
        $image.fadeOut(function() {
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