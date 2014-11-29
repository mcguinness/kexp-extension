define([
  "jquery",
  "underscore",
  "marionette",
  "marionette-deferredclose", // Marionette Plugin
  "jquery-kexp" // jQuery Plugin
  ], function($, _, Marionette) {

  // Enable Require.js Template Cache
  Marionette.TemplateCache.loadTemplate = function(template, callback) {
    // pre-compile the template and store that in the cache.
    var compiledTemplate = _.template(template);
    callback.call(this, compiledTemplate);
  };

  Marionette.Renderer.renderTemplate = function(template, data) {
    // because `template` is the pre-compiled template object,
    // we only need to execute the template with the data
    return template(data);
  };

  // Add Services & Close to Application
  _.extend(Marionette.Application.prototype, {
    constructor: function(options) {
      this.services = [];
      this.routers = [];

      if (this.initialize) {
        this.initialize.apply(this, arguments);
      }
    },
    addService: function(service, options) {
      if (_.isObject(service)) {
        this.services.push(service);
        service.start(options);
      }
    },
    addRouter: function(router) {
      this.routers.push(router);
    },
    close: function() {
      
      this.vent.trigger("application:before:close");
      if (_.isFunction(this.beforeClose)) { this.beforeClose(); }

      _.each(_.values(this), function(region) {
        if (region instanceof Marionette.Region && _.isFunction(region.close)) {
          console.log("Closing region {%s}", region.el);
          region.close();
        }
      });

      _.each(this.services, function(service) {
        console.log("Stopping service {%s}", service.toString());
        service.stop();
      });

      _.each(this.routers, function(router) {
        console.log("Closing router");
        if (_.isObject(router.controller) && _.isFunction(router.controller.close)) {
          router.controller.close();
        }
      });

      console.log("Closing event handlers");
      this.vent.unbindAll();
      this.unbindAll();

      if (_.isFunction(this.onClose)) { this.onClose(); }
      this.trigger("close");

      this.unbind();
    }
  });

  // Add vent and config from options
  _.extend(Marionette.View.prototype, {
    constructor: function(options) {
      if (!options) options = {};
      this.vent = options.vent;
      this.appConfig = options.appConfig;

      Marionette.View.apply(this, arguments);
    },
    onClose: function() {
      this.vent = null;
      this.appConfig =  null;
    }
  });

  // Add pipe to EventAggregator
  _.extend(Marionette.EventAggregator.prototype, {
    pipe: function(target, events) {
      var self = this;
      return Marionette.BindTo.bindTo.call(this, target, events, function() {
        var args = Array.prototype.slice.call(arguments);
        self.trigger.apply(self, args);
      }, this);
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
  Marionette.View.prototype.tooltipClose = function() {
    
    // Exit early if no tooltip hash is defined
    if (!_.isObject(this.tooltips)) { return; }

    var tooltipDfrs = [],
        closeDfr = $.Deferred(),
        self = this;

    _.each(self.tooltips, function(value, selector) {
      
      var splitParts,
          tooltipKey,
          waitForHideOnClose = false,
          yieldOnClose = false,
          $tooltips;
        
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
        
        var data = $(this).data() || {},
            tooltip = data[tooltipKey],
            $tooltip,
            tooltipDfr;

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

  return Marionette;
});