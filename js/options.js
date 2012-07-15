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
  
  var options = {chromeExtension: (window.chrome && window.chrome.extension)},
      backgroundApp;

  if (options.chromeExtension) {
    backgroundApp = chrome.extension.getBackgroundPage().KexpBackgroundApp;
    options.appConfig = backgroundApp.appConfig,
  }

  var optionsApp = new KexpApp();

  optionsApp.addInitializer(function(options) {
    this.addService(new AnalyticsService(), options);
  });

  optionsApp.addInitializer(function(options) {
    this.addRegions({
      main: "#region-main"
    });
  });
  optionsApp.addInitializer(function(options) {
    var self = this;
    var AppRouter = Marionette.AppRouter.extend({
      appRoutes: {
        "*other": "showOptions" //Default View
      },
      controller: {
        showOptions: function() {
          var optionsView = new OptionsView({
            collection: self.appConfig
          });
          self.main.show(optionsView);
        }
      }
    });

    this.addRouter(new AppRouter());
    Backbone.history.start();
  });

  optionsApp.start(options);

});