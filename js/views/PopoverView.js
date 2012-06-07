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

      _.bindAll(this, "toggle");

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
        self = this;

      if (!popoverTemplate) throw new Error("Popover template is required");
      if ((_.isArray(json) && json.length < 1) || _.isEmpty(json)) { return; }

       $.when(this.renderHtml(json))
          .done(function(html) {
            self.popover = $targetEl.data("popover");
            if (_.isObject(self.popover)) {
              self.popover.options.content = function() {
                return html;
              };
            } else {
              $targetEl.popover({
                title: (_.isFunction(self.getPopoverTitle)) ? self.getPopoverTitle() : null,
                content: function() {
                  return html;
                },
                placement: self.popoverPlacement,
                trigger: "manual",
                template: self.popoverTemplate
              });
              self.popover = $targetEl.data("popover");
            }
            if (self.onEnable) self.onEnable();
          });
    },
    toggle: function() {
      var self = this;
      var targetPopover = this.popover;

      if (targetPopover) {
        targetPopover.toggle();
        if (targetPopover.enabled) {
          targetPopover.$tip.find(".close").one("click.popover.toggle", function() {
            $(this).off("click.popover.toggle");
            targetPopover.hide();
            if (self.onHide) self.onHide();
            self.trigger("hide");
          });
          if (self.onShow) self.onShow();
          self.trigger("show");
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