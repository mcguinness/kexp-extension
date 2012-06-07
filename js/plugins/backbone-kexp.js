define([
  "jquery",
  "underscore",
  "backbone",
  "backbone-replete", // Backbone Plugin
  "marionette", // Backbone Plugin
  "marionette-deferredclose", // Marionette Plugin
  "jquery-kexp" // jQuery Plugin
	], function($, _, Backbone) {

 
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


  // TODO Simplify design to not require this crap
  // HACK
  // I am totally abusing bootstrap popovers.  Due to chrome extension fixed window size
  // popups are using the navbar as the target element.
  //
  // Tooltips are created as document child element $tip and not a child of a view
  // They do not get removed on view close
  // This is an over-engineered attempt to make sure there are no memory leaks
  // 
  // In a future version, look at using an app route as an overlay
  var tooltipSplitter = /\s+/;
  Backbone.Marionette.View.prototype.tooltipClose = function() {
    
    // Exit early if no tooltip hash is defined
    if (!_.isObject(this.tooltips)) { return; }

    var value,
      selector,
      splitParts,
      tooltipKey,
      waitForHideOnClose = false,
      yieldOnClose = false,
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
      while (splitParts.length > 0) {
        switch (splitParts.shift().toLowerCase()) {
          case "wait" :
            waitForHideOnClose = true;
            break;
          case "yield" :
            yieldOnClose = true;
            break;
          default :
            break;
        }
      }

      $tooltips = (selector === "this") ? self.$el : self.$el.find(selector);
      
      $tooltips.each(function(index) {
        data = $(this).data() || {};
        tooltip = data[tooltipKey];
        
        if (_.isObject(tooltip)) {
          $tooltip = tooltip.$tip;

          if (_.isObject($tooltip)) {
            if (waitForHideOnClose && $tooltip.index() >= 0) {
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
              if ($tooltip.index() >= 0) {
                if (!yieldOnClose) {
                  $tooltip.remove();
                  delete data[tooltipKey];
                }
              } else {
                delete data[tooltipKey];
              }
            }
          } else {
            delete data[tooltipKey];
          }
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