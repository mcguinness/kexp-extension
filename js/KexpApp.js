define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "marionette-kexp",
  "models/LastFmModel",
  "collections/AppConfigCollection",
  "collections/LastFmCollection",
  "services/LastFmApi"
  ], function($, _, Backbone, Marionette, LastFmModel, AppConfigCollection, LastFmCollection, LastFmApi) {
  
  var KexpApp = function() {
    var kexpApp = new Marionette.Application();

    kexpApp.addInitializer(function(options) {
      var self = this;
      // Close app on unload (app/views may have event handlers for background page)
      window.addEventListener("unload", function() {
          self.close();
      });
    });

    // Set Configuration
    kexpApp.addInitializer(function(options) {
      // Add Event Aggregator and Config to Options for future initializers
      if (!_.isObject(options.vent)) { options.vent = this.vent; }
      
      if (!_.isObject(options.appConfig)) {
        options.appConfig = new AppConfigCollection();
        options.appConfig.getDefaults();
        
        this.bindTo(options.appConfig, "change", function(model) {
            console.debug("Configuration model {%s} value has changed, saving changes...", model.id, JSON.stringify(model));
            model.save();
          }, this);
      }
      this.appConfig = options.appConfig;
    });

    // Set Marionette View Vent & Config
    kexpApp.addInitializer(function(options) {
      var self = this;
      // Add application event aggregator and config to all views if not specified in options
      Marionette.View.prototype.constructor = function(ctorOptions) {
        if (!ctorOptions) ctorOptions = {};
        this.vent = ctorOptions.vent || self.vent;
        this.appConfig = ctorOptions.appConfig || self.appConfig;

        Marionette.View.apply(this, arguments);
      };
    });

    // Set LastFmApi
    kexpApp.addInitializer(function(options) {
      var self = this,
        getLastFmApiConfig = function(model) {
          return _.pick(model.toJSON(), "apiKey", "apiSecret", "sessionKey");
        },
        lastFmConfig,
        handleSessionKeyChange;

      // Make LastFmApi & Watch for Session Key Changes
      if (!_.isObject(options.lastFmApi)) {
        lastFmConfig = this.appConfig.getLastFm();
        options.lastFmApi = new LastFmApi(getLastFmApiConfig(lastFmConfig));
        handleSessionKeyChange = function(model) {
          options.lastFmApi.setConfig(getLastFmApiConfig(model));
        };
        this.bindTo(lastFmConfig, "change:sessionKey", handleSessionKeyChange);
      }
      this.lastFmApi = options.lastFmApi;
      this.vent.pipe(this.lastFmApi, "all");

      // Add LastFm Sync to LastFm Collection & Model
      _.extend(LastFmModel.prototype, {
        sync: self.lastFmApi.sync
      });
      _.extend(LastFmCollection.prototype, {
        sync: self.lastFmApi.sync
      });
    });

    return kexpApp;
  };

  return KexpApp;
});