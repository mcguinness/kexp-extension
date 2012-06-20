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

  // Create Audio Element is not Chrome Extension w/Background Page
  popupApp.addInitializer(function(options) {
    if (!_.isObject(options.audioElement)) {
      $("#region-footer").append('<audio id="background-audio" src="http://kexp-mp3-2.cac.washington.edu:8000/;" preload="none">');
      options.audioElement = document.getElementById("background-audio");
    }
  });


  // Add Services
  popupApp.addInitializer(function(options) {
    this.addService(new NotificationService(), options);
    this.addService(new LastFmLikeSyncService(), options);
    this.addService(new AnalyticsService(), options);
    this.addService(new FeatureManagerService(), options);
    this.addService(new PopoutService(), options);
    this.addService(new PopoverCleanupService(), options);
    if (options.chromeExtension) {
      this.addService(new ChromeTabService(), options);
    }
  });

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
  });

  popupApp.addInitializer(function(options) {
    var AppRouter = Marionette.AppRouter.extend({
      appRoutes: {
        "likes": "handleLikesRoute",
        "*other": "handleDefaultRoute"
      },
      controller: new KexpAppController(this, options)
    });
    this.addRouter(new AppRouter());
    Backbone.history.start();
  });

  return popupApp;
});