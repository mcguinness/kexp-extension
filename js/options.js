require.config({
  paths: {
    "backbone": "libs/backbone-min",
    "backbone-kexp": "plugins/backbone-kexp",
    "backbone-indexeddb": "libs/backbone-indexeddb",
    "backbone-localstorage": "libs/backbone-localstorage",
    "backbone-replete": "plugins/backbone-replete",
    "bootstrap": "plugins/bootstrap.min",
    "ga": "https://ssl.google-analytics.com/ga",
    "gaq": "util/google-analytics",
    "htmlencoder": "util/htmlencoder",
    "jquery": "libs/jquery-1.7.2.min",
    "jquery-kexp": "plugins/jquery-kexp",
    "jquery-ui": "plugins/jquery-ui-1.8.20.custom.min",
    "marionette": "libs/backbone.marionette.min",
    "marionette-deferredclose": "plugins/backbone.marionette-deferredclose",
    "marionette-kexp": "plugins/backbone.marionette-kexp",
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
  "marionette-kexp",
  "KexpApp",
  "services/AnalyticsService",
  "collections/AppConfigCollection",
  "views/OptionsView",
  "twitter"
  ], function($, _, Backbone, Marionette, KexpApp, AnalyticsService, AppConfigCollection, OptionsView) {
   
  var optionsApp = new KexpApp();

  var AppRouter = Marionette.AppRouter.extend({
    appRoutes: {
      "*other": "showOptions" //Default View
    },
    controller: {
      showOptions: function() {
        var optionsView = new OptionsView({
          collection: optionsApp.appConfig
        });
        optionsApp.main.show(optionsView);
      }
    }
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

  optionsApp.start({
    appConfig: chrome.extension.getBackgroundPage().KexpStore.appConfig
  });

});