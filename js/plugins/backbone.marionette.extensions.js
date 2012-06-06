define([
  "jquery",
  "underscore",
  "backbone",
  "marionette",
  "jquery-kexp"
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
        that.tooltipClose();
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

  var tooltipSplitter = /\s+/;
  Backbone.Marionette.View.prototype.tooltipClose = function() {
    
    // Exit early if no tooltip hash is defined
    if (!_.isObject(this.tooltips)) { return; }

    // Tooltips are created as document child element $tip and not a child of a view
    // They do not get removed on view close by default

    var value,
      selector,
      splitParts,
      tooltipKey,
      waitForHideOnClose = false,
      $tooltips,
      $tooltip,
      index,
      data,
      tooltip,
      tooltipDfr,
      tooltipDfrs = [],
      closeDfr = $.Deferred(),
      self = this;
    
    _.each(self.tooltips, function(value, selector) {
      
      // Validate & Parse Hash Value, continue to next element is not valid
      if (_.isEmpty(value)) { return; }
      splitParts = value.split(tooltipSplitter);
      if (_.isUndefined(splitParts) || splitParts.length < 1) { return; }
      
      tooltipKey = splitParts.shift();
      if (splitParts.length > 0) {
        waitForHideOnClose = (splitParts.shift().toLowerCase() === "wait");
      }

      $tooltips = (selector === "this") ? self.$el : self.$el.find(selector);
      $tooltips.each(function(index) {
        
        data = $(this).data() || {};
        tooltip = data[tooltipKey];
        // Skip element if no tooltip data or wrapped element
        if (!_.isObject(tooltip) || !_.isObject(tooltip.$tip)) { return; }
        $tooltip = tooltip.$tip;

        if (waitForHideOnClose && tooltip.enabled && $tooltip.index() >= 0) {
            tooltipDfr = $.Deferred();
            tooltipDfrs.push(tooltipDfr);
            // Popover fades out with CSS animation, wait for fade out before close is finished
            $tooltip.queueTransition(function() {
              delete data[tooltipKey];
              tooltipDfr.resolve();
            });
            // Trigger animation
            tooltip.hide();
        } else {
          tooltip.enabled ? tooltip.hide() : $tooltip.remove();
          delete data[tooltipKey];
        }
      });
    });
    
    $.when.apply($, tooltipDfrs).then(
      function() {
        closeDfr.resolve();
      },
      function() {
        closeDfr.reject();
      });

    return closeDfr.promise();
  };

  return Backbone;
  
});