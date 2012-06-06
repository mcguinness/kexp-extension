require.config({
  paths: {
    "jquery": "libs/jquery-1.7.2.min",
    "jquery-ui": "plugins/jquery-ui-1.8.20.custom.min",
    "jquery-kexp": "plugins/jquery-kexp",
    "underscore": "libs/underscore-min",
    "backbone": "libs/backbone-min",
    "backbone-extensions": "plugins/backbone.extensions",
    "backbone-relational": "plugins/backbone-relational",
    "backbone-localstorage": "libs/backbone-localstorage",
    "bootstrap": "plugins/bootstrap.min",
    "marionette": "libs/backbone.marionette.min",
    "indexeddb": "libs/backbone-indexeddb",
    "text": "libs/text-min",
    "moment": "libs/moment.min",
    "gaq": "util/google-analytics",
    "md5": "util/md5",
    "lastfm-api": "services/LastFmApi",
    "ga": "https://ssl.google-analytics.com/ga",
    "twitter": "https://platform.twitter.com/widgets"
  },
  shim: {
    "jquery-ui": ["jquery"],
    "jquery-kexp": ["jquery", "underscore"],
    "backbone-relational": ["backbone", "underscore"],
    "bootstrap": ["jquery"]
  }
});

require([
  "jquery",
  "underscore",
  "backbone-kexp",
  "services/AnalyticsService",
  "collections/AppConfigCollection",
  "views/OptionsView",
  "twitter"
  ], function($, _, Backbone, AnalyticsService, AppConfigCollection, OptionsView) {
   
  var optionsApp = new Backbone.Marionette.Application();

  var AppRouter = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
      "*other": "showOptions" //Default View
    },
    controller: {
      showOptions: function() {
        var optionsView = new OptionsView({
          collection: optionsApp.appConfig
        });
        optionsApp.main.show(optionsView, "append");
      }
    }
  });

  optionsApp.addInitializer(function(options) {
    var self = this;
    
    // Add Event Aggregator and Config to Options for future initializers
    if (!options.vent) options.vent = this.vent;
    if (!options.appConfig) options.appConfig = new AppConfigCollection();
    this.appConfig = options.appConfig;

    // Add application event aggregator and config to all views if not specified in options
    Backbone.Marionette.View.prototype.constructor = function(ctorOptions) {
      if (!ctorOptions) ctorOptions = {};
      this.vent = ctorOptions.vent || self.vent;
      this.appConfig = ctorOptions.appConfig || self.appConfig;

      Backbone.Marionette.View.apply(this, arguments);
    };

  });

  optionsApp.addService(new AnalyticsService());

  optionsApp.addInitializer(function(options) {
    this.addRegions({
      main: "#region-main"
    });
  });
  optionsApp.addInitializer(function(options) {
    this.router = new AppRouter();
    Backbone.history.start();
  });

  optionsApp.start({});

});