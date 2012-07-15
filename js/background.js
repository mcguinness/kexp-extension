require([
  "jquery",
  "KexpApp",
  "NowPlayingPollFsm",
  "collections/NowPlayingCollection",
  "services/AnalyticsService",
  "services/LastFmScrobbleService",
  "gaq"
  ], function($, KexpApp, NowPlayingPollFsm, NowPlayingCollection, LastFmScrobbleService, AnalyticsService, gaq) {
    
  $(document).ready(function() {

    var backgroundApp;
    window.KexpBackgroundApp = backgroundApp = new KexpApp();

    backgroundApp.addInitializer(function(options) {
      var self = this;
      this.liveStreamEl = options.liveStreamEl = document.getElementById("background-audio");
      this.nowPlayingCollection = options.nowPlayingCollection = new NowPlayingCollection();
      this.pollFsm = new NowPlayingPollFsm(backgroundApp.liveStreamEl, backgroundApp.nowPlayingCollection);

      window.chrome.extension.onConnect.addListener(function(port) {
        if (port.name == "kexp.app.view") {
          self.pollFsm.attachView();
          port.onDisconnect.addListener(function() {
            self.pollFsm.detachView();
          });
        }
      });
    });

    backgroundApp.addInitializer(function(options) {
      this.addService(new LastFmScrobbleService(), options);
      this.addService(new AnalyticsService(), options);
    });

    backgroundApp.start({});
    console.log("background page loaded.");
  });
});