define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "text!templates/nowplaying-error.html",
  "jquery-ui" // no need for arg
  ], function($, _, Marionette, ViewTemplate) {

  var NowPlayingErrorView = Marionette.ItemView.extend({
    template: ViewTemplate,
    className: "kexp-error kexp-box-striped",
    events: {
      "click #button-refresh.active": "handleRefresh",
      "click #button-page-prev.active": "handlePagePrev"
    },
    serializeData: function() {
      return {
        model: this.model.toJSON()
      };
    },
    onRender: function() {
        this.$el.hide();
    },
    onShow: function() {
        var view = this;
        this.$el.show("slide", {direction: "left"}, 500, function() {
          $("#button-refresh", view.$el).addClass("active");
        });
    },
    handleRefresh: function() {
      var $icon = $("#button-refresh", this.$el);
      if ($icon.length > 0) {
        $icon.removeClass("rotate");
        _.delay(function() {
          $icon.addClass("rotate");
        });
      }
      this.vent.trigger("nowplaying:refresh:manual");
    },
    handlePagePrev: function() {
      this.vent.trigger("nowplaying:page:prev");
    }
  });

  return NowPlayingErrorView;
});