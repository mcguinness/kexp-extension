define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "views/LastFmPopoverView",
  "jquery-kexp" // no need for arg
  ], function($, _, Marionette, LastFmPopoverView) {
  
  var LastFmMetaView = Marionette.ItemView.extend({
    tagName: "div",
    className: "container-nowplaying-meta",
    initialize: function(options) {
      var err;
      
      this.popoverEl = options.popoverEl;
      if (!this.popoverEl) {
        err = new Error("A popover 'el' must be specified");
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
          vent: this.vent,
          appConfig: this.appConfig
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

      /* 
       * Temp disable to troubleshoot memory leaks
       *

      $.when(this.popoverView ? this.popoverView.close(): true)
        .then(function() {
          if ($image.length > 0) {
            $image.fadeOut(400, function() {
              console.log('image fade done');
              beforeCloseDfr.resolve();
            });
          } else {
            beforeCloseDfr.resolve();
          }
        })

      return beforeCloseDfr.promise();

      */
    }
  });
  return LastFmMetaView;
});