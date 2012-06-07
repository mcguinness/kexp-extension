define([
  "jquery",
  "underscore",
  "backbone",
  "backbone-delimit", // Backbone Plugin
  "marionette", // Backbone Plugin
  "marionette-deferredclose", // Marionette Plugin
  "jquery-kexp" // jQuery Plugin
	], function($, _, Backbone) {

  Backbone.Collection.prototype.upsert = function(models, options) {
    var i, index, length, existingModel, model, cid, id, cids = {}, ids = {}, dups = [];
    options || (options = {});
    models = _.isArray(models) ? models.slice() : [models];

    // Begin by turning bare objects into model references, and preventing
    // invalid models or duplicate models from being added.
    for (i = 0, length = models.length; i < length; i++) {
      if (!(model = models[i] = this._prepareModel(models[i], options))) {
        console.warn("Can't update or add an invalid model to a collection", models[i], this, options);
        throw new Error("Can't update or add an invalid model to a collection");
      }
      cid = model.cid;
      id = model.id;
      if (cids[cid] || ((id != null) && (ids[id]))) {
        dups.push(i);
        continue;
      } else if  (this._byCid[cid] || (id != null) && (ids[id] || this._byId[id])) {
        existingModel = this.getByCid(cid) || this.get(id);
        existingModel.set(model, options);
        dups.push(i);
        continue;
      }

      cids[cid] = ids[id] = model;
    }

    // Remove duplicates.
    i = dups.length;
    while (i--) {
      models.splice(dups[i], 1);
    }

    return this.add(models, options);
  };

  Backbone.Collection.prototype.fetch = function(options) {
    options = options ? _.clone(options) : {};
    if (options.parse === undefined) options.parse = true;
    var collection = this;
    var fetchDfr = $.Deferred();

    if (options.success) {
      fetchDfr.done(options.success);
    }
    fetchDfr.fail(Backbone.wrapError(options.error, collection, options));

    options.success = function(resp, status, xhr) {
      try {
        collection[options.add ? 'add' : (options.upsert ? "upsert" : 'reset')](collection.parse(resp, xhr), options);
        fetchDfr.resolve(collection, resp);
      }
      catch (e) {
        console.warn("Error {%s} fetching collection =>", e.toString(), e.stack, collection, e, options);
        fetchDfr.reject(collection, e, options);
      }
    };
    options.error = function(collection, error, options) {
      fetchDfr.reject(collection, error, options);
    };

    (this.sync || Backbone.sync).call(this, 'read', this, options);
    return fetchDfr.promise();
  };


  Backbone.Model.prototype.fetch = function(options) {
    options = options ? _.clone(options) : {};
    if (options.parse === undefined) options.parse = true;
    var model = this;
    var fetchDfr = $.Deferred();

    if (options.success) {
      fetchDfr.done(options.success);
    }
    fetchDfr.fail(Backbone.wrapError(options.error, model, options));

    options.success = function(resp, status, xhr) {
      try {
        if (!model.set(model.parse(resp, xhr), options)) return false;
        fetchDfr.resolve(model, resp);
      }
      catch (e) {
        console.warn("Error {%s} fetching model =>", e.toString(), e.stack, model, e, options);
        fetchDfr.reject(model, e, options);
      }
    };
    options.error = function(model, error, options) {
      fetchDfr.reject(model, error, options);
    };

    (this.sync || Backbone.sync).call(this, 'read', this, options);
    return fetchDfr.promise();
  };

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