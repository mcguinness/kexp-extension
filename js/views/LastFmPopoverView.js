define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "views/PopoverView",
  "text!templates/nowplaying-popover.html",
  "text!templates/nowplaying-popover-lastfm.html"
  ], function($, _, Marionette, PopoverView, PopoverTemplate, PopoverContentTemplate) {

  var LastFmPopoverView = PopoverView.extend({

    template: PopoverContentTemplate,
    popoverTemplate: PopoverTemplate,
    initialize: function(options) {
      this.bindTo(this.vent, "nowplaying:lastfm:popover:toggle", this.toggle, this);
    },
    tooltips: {
      "this": "popover yield"
    },
    serializeData: function() {
      return _.chain(this.model.lastFmMeta.models)
        .filter(function(model) {
          return _.any(["album", "artist"], function(entity) {
            return model.get("entity") === entity;
          });
        })
        .sortBy(function(model) {
          return (model.get("entity") === "artist");
        })
        .map(function(model) {
          return {
            entity: model.get("entity"),
            name: model.get("name"),
            url: model.get("url"),
            image: model.getImageBySize(["medium"]),
            summary: model.get("summary")
          };
        })
        .value();
    },
    renderHtml: function(json) {
      return Marionette.Renderer.render(this.template, {model: json});
    },
    onEnable: function() {
      this.vent.trigger("nowplaying:lastfm:popover:enabled", {
        target: $(this.el),
        model: this.model
      });
    },
    onShow: function() {
      this.vent.trigger("analytics:trackevent", "LastFm", "ShowPopover", this.model.toDebugString());
    }
  });
  return LastFmPopoverView;
});