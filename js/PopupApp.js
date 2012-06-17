define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "marionette-kexp",
  "KexpApp",
  "KexpAppController",
  "services/NotificationService",
  "services/LastFmLikeSyncService",
  "services/AnalyticsService",
  "services/FeatureManagerService",
  "services/PopoutService",
  "services/PopoverCleanupService",
  "services/ChromeTabService",
  "views/NavRegionView",
  "views/PlayerView"
  ], function(
    $,
    _,
    Backbone,
    Marionette,
    KexpApp,
    KexpAppController,
    NotificationService,
    LastFmLikeSyncService,
    AnalyticsService,
    FeatureManagerService,
    PopoutService,
    PopoverCleanupService,
    ChromeTabService,
    NavRegionView,
    PlayerView) {
  
  // Create App
  var popupApp = new KexpApp();

  popupApp.addService(new NotificationService());
  popupApp.addService(new LastFmLikeSyncService());
  popupApp.addService(new AnalyticsService());
  popupApp.addService(new FeatureManagerService());
  popupApp.addService(new PopoutService());
  popupApp.addService(new PopoverCleanupService());
  popupApp.addService(new ChromeTabService());
  
  // Add Regions
  popupApp.addInitializer(function(options) {
    this.addRegions({
      nav: NavRegionView,
      main: "#region-content",
      footer: "#region-footer"
    });

    // Marionette.Region does not have Marionette.View as prototype, and we can't pass options through so...
    _.extend(this.nav, {
      vent: this.vent,
      appConfig: this.appConfig
    });

    this.footer.show(new PlayerView(options));
    
  });

  popupApp.addInitializer(function(options) {
    var AppRouter = Marionette.AppRouter.extend({
      appRoutes: {
        "likes": "handleLikesRoute",
        "*other": "handleDefaultRoute"
      },
      controller: new KexpAppController(this)
    });
    this.addRouter(new AppRouter());
    Backbone.history.start();
  });

  return popupApp;
});