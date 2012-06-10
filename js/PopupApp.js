define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "marionette-kexp",
  "htmlencoder",
  "KexpApp",
  "KexpAppController",
  "services/NotificationService",
  "services/LastFmLikeSyncService",
  "services/AnalyticsService",
  "services/FeatureManagerService",
  "services/PopoutService",
  "services/PopoverCleanupService",
  "views/NavRegionView",
  "views/PlayerView"
  ], function(
    $,
    _,
    Backbone,
    Marionette,
    HtmlEncoder,
    KexpApp,
    KexpAppController,
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
  var popupApp = new KexpApp();

  popupApp.addService(new NotificationService());
  popupApp.addService(new LastFmLikeSyncService());
  popupApp.addService(new AnalyticsService());
  popupApp.addService(new FeatureManagerService());
  popupApp.addService(new PopoutService());
  popupApp.addService(new PopoverCleanupService());
  

  // Add Regions
  popupApp.addInitializer(function(options) {
    this.addRegions({
      nav: NavRegionView,
      main: "#region-content",
      player: "#region-player"
    });

    // Marionette.Region does not have Marionette.View as prototype, and we can't pass options through so...
    _.extend(this.nav, {
      vent: this.vent,
      appConfig: this.appConfig
    });
    
  });

  // Show Player
  popupApp.addInitializer(function(options) {
    var playerView = new PlayerView(options);
    this.player.show(playerView);
  });

  popupApp.addInitializer(function(options) {
    var AppRouter = Marionette.AppRouter.extend({
      appRoutes: {
        "likes": "showLikedSongs",
        "*other": "showNowPlaying" //Default View
      },
      controller: new KexpAppController(this)
    });

    this.router = new AppRouter();
    Backbone.history.start();
  });

  return popupApp;
});