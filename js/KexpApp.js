define([
  "jquery",
  "underscore",
  "backbone-extensions",
  "marionette-extensions",
  "htmlencoder",
  "detectzoom",
  "KexpAppController",
  "collections/AppConfigCollection",
  "services/NotificationService",
  "services/LastFmLikeSyncService",
  "services/AnalyticsService",
  "services/FeatureManagerService",
  "views/NavRegionView",
  "views/PlayerView",
  "mutation-summary" // Global, no need for arg
  ], function($, _, Backbone, Marionette, HtmlEncoder, DetectZoom,
    KexpAppController,
    AppConfigCollection,
    NotificationService,
    LastFmLikeSyncService,
    AnalyticsService,
    FeatureManagerService,
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

  // Add Regions
  kexpApp.addInitializer(function(options) {
    this.addRegions({
      nav: NavRegionView,
      main: "#region-content",
      player: "#region-player"
    });
  });

  // Add auto-resizer if launched as popout window
  kexpApp.addInitializer(function(options) {
    if (options.popout && window.WebKitMutationObserver) {
      this.popoutResizeObserver = new MutationSummary({
        callback: function(resp) {
          // Browser Page Zoom makes dynamic sizing of window a bitch....
          // Luckily this dude made a cool abstraction
          var zoom = DetectZoom.zoom();
          var height = Math.round($(document.documentElement).height() * zoom) + 46;
          if (window.outerHeight !== height) {
            console.log("Resizing window [%s x %s] to [%s x %s] with zoom: %s",
              window.outerWidth, window.outerHeight, window.outerWidth, height, zoom, resp);
            window.resizeTo(window.outerWidth, height);
          }
        },
        observeOwnChanges: true,
        queries: [{
          element: '*',
          elementAttributes: 'clientWidth clientHeight'
        }]
      });
    }
  });

  // Show Player & Popout Overlay
  kexpApp.addInitializer(function(options) {
    var $containerPopout, width, height, left, top, targetWin,
      playerView = new PlayerView(options);
    
    this.player.show(playerView);

    if (!options.popout && options.appUrl) {
      $containerPopout = $('<div class="container-footer-popout"><span><i class="icon-fullscreen"></i> Popout</span></div>');
      $containerPopout.click(function() {
        width = window.outerWidth + 20;
        height = window.outerHeight + 50;
        // TODO: Resolve why multi-monitor doesn't work for left offsets...
        left = (screen.width / 2) - (width / 2);
        top = (screen.height/ 2) - (height / 2);

        targetWin = window.open(options.appUrl + window.location.hash, "", "width="+width+", height="+height+", top="+top+", left="+left);
        $(targetWin).on("load", function() {
          $(targetWin.document.body).addClass("popout");
        });
      });
      $containerPopout.appendTo("#footer");
    }
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