define([
  "jquery",
  "backbone",
  "underscore",
  "marionette",
  "text!templates/likedsong-popover.html",
  "text!templates/likedsong-popover-info.html",
  "bootstrap" // no need for arg
  ], function($, Backbone, _, Marionette, PopoverTemplate, PopoverContentTemplate) {

  var LikedSongPopoverView = Backbone.Marionette.ItemView.extend({

    template: PopoverContentTemplate,
    popoverTemplate: PopoverTemplate,
    serializeData: function() {
      return { model: this.model.toJSON()};
    },
    render: function() {
      var $targetEl = $(this.el),
        json = this.serializeData(),
        self = this,
        popover;

      $.when(this.renderHtml(json))
        .done(function(html) {
          popover = $targetEl.data("popover");
            $targetEl.popover({
              content: function() {
                return html;
              },
              placement: "bottom",
              trigger: "manual",
              template: self.popoverTemplate
            });
        });
    },
    toggle: function() {
      var $el = $(this.el);
      var popover = $el.data("popover");
      if (popover) {
        $(this.el).popover("toggle");
        if (popover.enabled) {
          this.vent.trigger("analytics:trackevent", "SongCollection", "Popover", "Show");
          popover.$tip.find(".close").click(function() {
            popover.hide();
          });
        }
      }
    },
    close: function() {
      // Very important we do not delete the views el as we are only touch the popover data blob
      // We must override other prototype will remove element
      
      this.unbindAll();
      this.unbind();

      var data = $(this.el).data();
      if (data && data.popover) {
        delete data.popover;
      }
    }
  });
  return LikedSongPopoverView;
});