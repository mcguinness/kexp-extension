define([
  "jquery",
  "underscore",
  "backbone",
  "marionette"
  ], function($, _, Backbone, Marionette) {

  // Enable Require.js Template Cache
  Backbone.Marionette.TemplateCache.loadTemplate = function(template, callback) {
    // pre-compile the template and store that in the cache.
    var compiledTemplate = _.template(template);
    callback.call(this, compiledTemplate);
  };

  Backbone.Marionette.Renderer.renderTemplate = function(template, data) {
    // because `template` is the pre-compiled template object,
    // we only need to execute the template with the data
    return template(data);
  };

  // Add Services to Application
  _.extend(Backbone.Marionette.Application.prototype, {
    services: [],
    addService: function(service) {
      this.addInitializer(function(options) {
        this.services.push(service);
        service.start(options);
      });
    },
    close: function() {
      _.each(_.values(this), function(region) {
        if (region instanceof Backbone.Marionette.Region && _.isFunction(region.close)) {
          console.debug("Closing region {%s}", region.el, region);
          region.close();
        }
      });

      _.each(this.services, function(service) {
        console.debug("Stopping service", service);
        service.stop();
      });
    }
  });


  Backbone.Marionette.Region.prototype.show = function(view, appendMethod) {
    var that = this;
    this.ensureEl();

    $.when(this.close())
      .then(function() {
        that.open(view, appendMethod);
        that.currentView = view;
      });
  };

  Backbone.Marionette.Region.prototype.close = function() {
    var that = this;
    var deferredRegionClose = $.Deferred();
    var view = this.currentView;

    if (!view) {
      return deferredRegionClose.resolve().promise();
    }

    $.when((view.close) ? view.close() : true)
      .then(function() {
        that.trigger("view:closed", view);
        delete that.currentView;
        deferredRegionClose.resolve();
      });

    return deferredRegionClose.promise();
  };


  Backbone.Marionette.ItemView.prototype.close = function() {

    var that = this;
    var deferredClose = $.Deferred();

    this.trigger('item:before:close');
    $.when(Backbone.Marionette.View.prototype.close.apply(this, arguments) || true)
      .then(function() {
        that.trigger('item:closed');
        deferredClose.resolve();
      });
    return deferredClose.promise();
  };

  Backbone.Marionette.View.prototype.close = function() {
    var that = this;
    var deferredClose = $.Deferred();

    $.when((this.beforeClose) ? this.beforeClose() : true)
      .then(function() {
        that.unbindAll();
        that.remove();

        $.when((that.onClose) ? that.onClose() : true)
          .then(function() {
            that.trigger('close');
            that.unbind();
            deferredClose.resolve();
          });
      });

    return deferredClose.promise();
  };

  return Backbone;
  
});