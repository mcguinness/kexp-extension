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
         

          var zoom = DetectZoom.zoom(),
            windowHeight = window.outerHeight,
            viewportHeight = window.innerHeight,
            documentHeight = $(document.documentElement).height(),
            viewportHeightDelta = Math.round((viewportHeight - documentHeight) * zoom),
            height = Math.round(documentHeight * zoom);
            

          console.log("Height: Outer:[%s] Inner:[%s] Document:[%s] DocumentElement: [%s] Client:[%s] Body:[%s]",
            windowHeight, viewportHeight, document.height, documentHeight, document.documentElement.clientHeight, document.body.clientHeight);


          if (this.prevViewportHeight && this.prevDocumentHeight) {
            if (this.prevViewportHeight === viewportHeight && this.prevDocumentHeight === height) {
              console.log("Skipping resizing, no delta");
              this.prevViewportHeight = viewportHeight;
              this.prevDocumentHeight = height;
              return;
            }
          }
          this.prevViewportHeight = viewportHeight;
          this.prevDocumentHeight = height;

          
          if (viewportHeightDelta > 0) {
            height += windowHeight - (viewportHeightDelta + height);
          }
          else if (viewportHeightDelta < 0) {
            height = (-viewportHeightDelta) + windowHeight;
          }
          else {
            height = windowHeight;
          }

          if (windowHeight !== height) {
            console.log("Resizing window [%s x %s] to [%s x %s] with zoom: %s",
              window.outerWidth, windowHeight, window.outerWidth, height, zoom, resp);
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
        width = window.outerWidth;
        height = window.outerHeight;
        // TODO: Resolve why multi-monitor doesn't work for left offsets...
        left = (screen.width / 2) - (width / 2);
        top = (screen.height/ 2) - (height / 2);

        targetWin = window.open(options.appUrl + window.location.hash, "", "width="+width+", height="+height+", top="+top+", left="+left);
        
        $(targetWin).on("load", function() {
          $(targetWin.document.body).addClass("popout");
          // Detect Window Chrome Width and Resize Width
          targetWin.resizeBy(targetWin.outerWidth - targetWin.document.width, 0);
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