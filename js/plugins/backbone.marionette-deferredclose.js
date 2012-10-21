define([
  "jquery",
  "underscore",
  "marionette"
  ], function($, _, Marionette) {

 Marionette.Region.prototype.show = function(view, appendMethod) {
    var that = this;
    this.ensureEl();

    $.when(this.close())
      .then(function() {
        that.open(view, appendMethod);
        that.currentView = view;
      });
  };

  Marionette.Region.prototype.close = function() {
    var that = this;
    var deferredRegionClose = $.Deferred();
    var view = this.currentView;

    if (!view) {
      return deferredRegionClose.resolve().promise();
    }

    $.when(_.isFunction(view.close) ? view.close() : true)
      .then(function() {
        that.trigger("view:closed", view);
        delete that.currentView;
        deferredRegionClose.resolve();
      });

    return deferredRegionClose.promise();
  };


  Marionette.ItemView.prototype.close = function() {

    var that = this;
    var deferredClose = $.Deferred();

    this.trigger('item:before:close');
    $.when(Marionette.View.prototype.close.apply(this, arguments) || true)
      .then(function() {
        that.trigger('item:closed');
        deferredClose.resolve();
      });
    return deferredClose.promise();
  };

  Marionette.View.prototype.close = function() {
    var that = this;
    var deferredClose = $.Deferred();

    console.log("closing %s: {%s:%s}", this.cid, this.el, this.className);

    $.when(_.isFunction(this.beforeClose) ? this.beforeClose() : true)
      .then(function() {
        if (_.isFunction(that.tooltipClose)) { that.tooltipClose(); }
        that.unbindAll();
        that.remove();

        $.when(_.isFunction(that.onClose) ? that.onClose() : true)
          .then(function() {
            that.trigger('close');
            that.unbind();
            deferredClose.resolve();
          });
      });

    return deferredClose.promise();
  };

  return Marionette;
});