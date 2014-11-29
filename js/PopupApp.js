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
  "services/ChromePopupViewService",
  "services/SpotifyLikeSyncService",
  "collections/NowPlayingCollection"
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
    ChromePopupViewService,
    SpotifyLikeSyncService,
    NowPlayingCollection) {

  var PopupApp = KexpApp.extend({
    initialize: function() {

      KexpApp.prototype.initialize.apply(this, arguments);

      // Create Audio Element if not Chrome Extension w/Background Page
      this.addInitializer(function(options) {
        if (!_.isObject(options.liveStreamEl)) {
          $("#region-footer").append('<audio id="background-audio" src="http://kexp-mp3-2.cac.washington.edu:8000/;" preload="none">');
          options.liveStreamEl = document.getElementById("background-audio");
        }
      });

      this.addInitializer(function(options) {
        if (!_.isObject(options.nowPlayingCollection)) {
          options.nowPlayingCollection = new NowPlayingCollection();
        }
      });

      // Add Services
      this.addInitializer(function(options) {
        this.addService(new NotificationService(), options);
        this.addService(new LastFmLikeSyncService(), options);
        this.addService(new AnalyticsService(), options);
        this.addService(new FeatureManagerService(), options);
        this.addService(new PopoutService(), options);
        this.addService(new PopoverCleanupService(), options);
        this.addService(new SpotifyLikeSyncService(), options);
        if (options.chromeExtension) {
          this.addService(new ChromeTabService(), options);
          this.addService(new ChromePopupViewService(), options);
        }
      });

      // Add Regions
      this.addInitializer(function(options) {
        this.addRegions({
          nav: "#region-nav",
          main: "#region-content",
          footer: "#region-footer"
        });
      });

      this.addInitializer(function(options) {
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

    }
  });

  return PopupApp;
});