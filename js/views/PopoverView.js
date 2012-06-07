define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "bootstrap" // no need for arg
  ], function($, _, Backbone) {

  var PopoverView = Backbone.Marionette.ItemView.extend({
    popoverPlacement: "bottom",
    hideOnClose: false,
    constructor: function(options) {
      options = options || {};
      _.extend(this, options);

      _.bindAll(this, "getPopoverTemplate", "render", "toggle", "close");

      Backbone.Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    tooltips: {
      "this": "popover"
    },
    getPopoverTemplate: function() {
      return this.popoverTemplate;
    },
    render: function() {
      var $targetEl = $(this.el),
        popoverTemplate = this.getPopoverTemplate();
        json = this.serializeData(),
        view = this;

      if (_.isEmpty(popoverTemplate)) { throw new Error("Popover template is required"); }
      if ((_.isArray(json) && json.length < 1) || _.isEmpty(json)) { return; }

       $.when(this.renderHtml(json))
          .done(function(html) {
            view.popover = $targetEl.data("popover");
            if (_.isObject(view.popover)) {
              view.popover.options.content = function() {
                return html;
              };
            } else {
              $targetEl.popover({
                title: (_.isFunction(view.getPopoverTitle)) ? view.getPopoverTitle() : null,
                content: function() {
                  return html;
                },
                placement: view.popoverPlacement,
                trigger: "manual",
                template: view.popoverTemplate
              });
              view.popover = $targetEl.data("popover");
            }
            if (_.isFunction(view.onEnable)) { view.onEnable(); }
          });
    },
    toggle: function() {
      var view = this;
      var targetPopover = this.popover;

      if (_.isObject(targetPopover)) {
        targetPopover.toggle();
        if (targetPopover.enabled) {
          targetPopover.$tip.find(".close").one("click.popover.toggle", function() {
            $(this).off("click.popover.toggle");
            targetPopover.hide();
            if (_.isFunction(view.onHide)) { view.onHide(); }
            view.trigger("hide");
          });
          if (_.isFunction(view.onShow)) { view.onShow(); }
          view.trigger("show");
        }
      }
    },
    close: function() {
      // Very important we do not delete the view's el as we are only touching the popover data blob
      // We must override otherwise prototype will remove the popover's element
      
      this.unbindAll();
      this.unbind();

      return this.tooltipClose();
    }
  });

  return PopoverView;
});