require.config({
  paths: {
    "backbone": "libs/backbone-min",
    "backbone-kexp": "plugins/backbone-kexp",
    "backbone-localstorage": "libs/backbone-localstorage",
    "backbone-replete": "plugins/backbone-replete",
    "bootstrap": "plugins/bootstrap.min",
    "ga": "https://ssl.google-analytics.com/ga",
    "gaq": "util/google-analytics",
    "indexeddb": "libs/backbone-indexeddb",
    "jquery": "libs/jquery-1.7.2.min",
    "jquery-kexp": "plugins/jquery-kexp",
    "jquery-ui": "plugins/jquery-ui-1.8.20.custom.min",
    "lastfm-api": "services/LastFmApi",
    "marionette": "libs/backbone.marionette.min",
    "marionette-deferredclose": "plugins/backbone.marionette-deferredclose",
    "md5": "util/md5",
    "moment": "libs/moment.min",
    "text": "libs/text-min",
    "twitter": "https://platform.twitter.com/widgets",
    "underscore": "libs/underscore-min"
  },
  shim: {
    "bootstrap": ["jquery"],
    "jquery-kexp": ["jquery", "underscore"],
    "jquery-ui": ["jquery"]
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