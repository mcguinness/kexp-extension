define([
  "jquery",
  "underscore",
  "backbone-extensions",
  "marionette-extensions",
  "htmlencoder",
  "KexpAppController",
  "collections/AppConfigCollection",
  "services/NotificationService",
  "services/LastFmLikeSyncService",
  "services/AnalyticsService",
  "services/FeatureManagerService",
  "services/PopoutService",
  "services/PopoverCleanupService",
  "views/NavRegionView",
  "views/PlayerView"
  ], function($, _, Backbone, Marionette, HtmlEncoder,
    KexpAppController,
    AppConfigCollection,
    NotificationService,
    LastFmLikeSyncService,
    AnalyticsService,
    FeatureManagerService,
    PopoutService,
    PopoverCleanupService,
    NavRegionView,
    PlayerView) {
  
  // Add encoding helpers to view and models
  Backbone.View.prototype.htmlEncoder = HtmlEncoder;
  Backbone.Model.prototype.htmlEncoder = HtmlEncoder;

  // Create App
  var kexpApp = new Backbone.Marionette.Application();

  kexpApp.addInitializer(function(options) {
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

    // Save any config changes
    this.appConfig.on("change", function(model) {
      console.debug("Configuration model {%s} value has changed, saving changes...", model.id, model);
      model.save();
    }, this);
  });


  // Add Services to App
  kexpApp.addService(new NotificationService());
  kexpApp.addService(new LastFmLikeSyncService());
  kexpApp.addService(new AnalyticsService());
  kexpApp.addService(new FeatureManagerService());
  kexpApp.addService(new PopoutService());
  kexpApp.addService(new PopoverCleanupService());

  // Add Regions
  kexpApp.addInitializer(function(options) {
    this.addRegions({
      nav: NavRegionView,
      main: "#region-content",
      player: "#region-player"
    });
  });

  // Show Player
  kexpApp.addInitializer(function(options) {
    var playerView = new PlayerView(options);
    this.player.show(playerView);
  });

  kexpApp.addInitializer(function(options) {
    var AppRouter = Backbone.Marionette.AppRouter.extend({
      appRoutes: {
        "likes": "showLikedSongs",
        "*other": "showNowPlaying" //Default View
      },
      controller: new KexpAppController(this)
    });

    this.router = new AppRouter();
    Backbone.history.start();
  });

  return kexpApp;
});