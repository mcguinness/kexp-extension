define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "marionette",
  "text!templates/nowplaying-error.html",
  "jquery-ui" // no need for arg
  ], function($, Backbone, _, Marionette, ViewTemplate) {

  var NowPlayingErrorView = Backbone.Marionette.ItemView.extend({
    template: ViewTemplate,
    className: "kexp-error kexp-box-striped",
    events: {
      "click #button-refresh": "handleRefresh"
    },
    onRender: function() {
        this.$el.hide();
    },
    onShow: function() {
        this.$el.show("slide", {
            direction: "left"
        }, 500);
    },
    handleRefresh: function() {
      var $icon = $("#button-refresh i", this.$el);
      if ($icon.length > 0) {
        $icon.removeClass("rotate");
        _.delay(function() {
          $icon.addClass("rotate");
        });
      }
      this.vent.trigger("nowplaying:refresh:manual");
    }
  });

  return NowPlayingErrorView;
});