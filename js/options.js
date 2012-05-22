require.config({
  paths: {
    "jquery": "libs/jquery-1.7.2.min",
    "jquery-ui": "libs/jquery-ui-1.8.20.custom.min",
    "underscore": "libs/underscore",
    "backbone": "libs/backbone",
    "backbone-extensions": "plugins/backbone.extensions",
    "backbone-relational": "libs/Backbone-relational",
    "backbone-localstorage": "libs/Backbone-localstorage",
    "marionette": "libs/backbone.marionette",
    "marionette-extensions": "plugins/backbone.marionette.extensions",
    "indexeddb": "libs/backbone-indexeddb",
    "machina": "libs/machina",
    "order": "libs/order",
    "text": "libs/text",
    "moment": "libs/moment.min",
    "ga": "https://ssl.google-analytics.com/ga",
    "gaq": "util/google-analytics",
    "lastfm-api": "services/LastFmApi",
    "md5": "util/md5",
    // Non AMD
    "bootstrap": "libs/bootstrap/bootstrap",
    "twitter": "https://platform.twitter.com/widgets"
  }
});

require([
  "jquery",
  "underscore",
  "marionette-extensions",
  "views/OptionsView",
  "twitter"
  ], function($, _, Backbone, OptionsView) {
   
  var optionsApp = new Backbone.Marionette.Application();

  var AppRouter = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
      "*other": "showOptions" //Default View
    },
    controller: {
      showOptions: function() {
        var optionsView = new OptionsView();
        optionsApp.main.show(optionsView, "append");
      }
    }
  });

  optionsApp.addInitializer(function(options) {
    this.addRegions({
      main: "#region-main"
    });
  });
  optionsApp.addInitializer(function(options) {
    this.router = new AppRouter();
    Backbone.history.start();
  });

  optionsApp.start();

});