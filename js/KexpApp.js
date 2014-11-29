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
  
  var KexpApp = Marionette.Application.extend({

    initialize: function() {

      // Add Event Aggregator and Config to Options for future initializers
      this.addInitializer(function(options) {

        if (!_.isObject(options.vent)) {
          options.vent = this.vent;
        }

        if (!_.isObject(options.appConfig)) {
          options.appConfig = new AppConfigCollection();

          if (options.background) {
            this.bindTo(options.appConfig, "change", function(model) {
                console.debug("Configuration model {%s} value has changed, saving changes...", model.id, JSON.stringify(model));
                model.save();
              }, this);
          }
        }
        this.appConfig = options.appConfig;
      });

      // Set LastFmApi
      this.addInitializer(function(options) {
        var lastFmConfig;

        // Make LastFmApi & Watch for Session Key Changes
        if (!_.isObject(options.lastFmApi)) {
          lastFmConfig = this.appConfig.getLastFm();
          options.lastFmApi = new LastFmApi(lastFmConfig.getApiConfig());
          this.bindTo(lastFmConfig, "change:sessionKey", this.handleSessionKeyChange, this);
        }
        this.lastFmApi = options.lastFmApi;
        this.vent.pipe(this.lastFmApi, "all");

        // Add LastFm Sync to LastFm Collection & Model for Popup Only
        if (!options.background) {
          _.extend(LastFmModel.prototype, {
            sync: this.lastFmApi.sync
          });
          _.extend(LastFmCollection.prototype, {
            sync: this.lastFmApi.sync
          });
        }
      });
    },

    handleSessionKeyChange: function(model) {
      this.lastFmApi.setConfig(model.getApiConfig());
    },

    onClose: function() {
      // Reset Sync Handlers
      _.extend(LastFmModel.prototype, {
        sync: Backbone.sync
      });
      _.extend(LastFmCollection.prototype, {
        sync: Backbone.sync
      });
    }
  });


  return KexpApp;
});