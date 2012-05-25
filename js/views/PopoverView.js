define([
  "jquery",
  "underscore",
  "marionette-extensions",
  "jquery-kexp",
  "bootstrap" // no need for arg
  ], function($, _, Backbone) {

  var PopoverView = Backbone.Marionette.ItemView.extend({
    popoverPlacement: "bottom",
    constructor: function(options) {
      options = options || {};
      this.hideOnClose = false;
      _.extend(this, options);

      _.bindAll(this, "toggle");

      Backbone.Marionette.ItemView.prototype.constructor.apply(this, arguments);
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
      if ((_.isArray(json) && json.length < 1) || _.isEmpty(json)) return;

       $.when(this.renderHtml(json))
          .done(function(html) {
            self.popover = $targetEl.data("popover");
            if (self.popover !== undefined) {
              self.popover.options.content = function() {
                return html;
              };
            } else {
              $targetEl.popover({
                title: (self.getPopoverTitle) ? self.getPopoverTitle() : null,
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
      var self = this,
        popover = this.popover ? this.popover : $(this.el).data("popover");
      if (popover) {
        $(this.el).popover("toggle");
        if (popover.enabled) {
          popover.$tip.find(".close").click(function() {
            popover.hide();
            if (self.onHide) self.onHide();
            self.trigger("hide");
          });
          if (this.onShow) this.onShow();
          this.trigger("show");
        }
      }
    },
    close: function() {
      // Very important we do not delete the view's el as we are only touching the popover data blob
      // We must override otherwise prototype will remove the popover's element
      
      this.unbindAll();
      this.unbind();

      var elData = $(this.el).data(),
        popover = this.popover ? this.popover : elData.popover,
        closeDfr = $.Deferred();

      if (!popover) return closeDfr.resolve().promise();
      // Ok, I know this is nasty and should be redone...
      // I should probably use routes instead of popovers....
      if (popover.enabled && popover.$tip.index() >= 0 && this.hideOnClose) {
          // Popover fades out with CSS animation, wait for fade out before close is finished
          popover.$tip.queueTransition(function() {
            popover.$tip.remove();
            delete this.popover;
            delete elData.popover;
            closeDfr.resolve();
          });
          // Trigger animation
          popover.hide();
          if (self.onHide) self.onHide();
          self.trigger("hide");
      } else {
        delete this.popover;
        delete elData.popover;
        closeDfr.resolve();
      }
      return closeDfr.promise();
    }
  });

  return PopoverView;
});