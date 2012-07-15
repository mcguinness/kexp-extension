require([
  "jquery",
  "KexpApp",
  "NowPlayingPollFsm",
  "collections/NowPlayingCollection",
  "services/LastFmScrobbleService",
  "gaq"
  ], function($, KexpApp, NowPlayingPollFsm, NowPlayingCollection, LastFmScrobbleService, gaq) {
    
    $(document).ready(function() {

      var backgroundApp;
      window.KexpBackgroundApp = backgroundApp = new KexpApp();

      backgroundApp.addInitializer(function(options) {
        var self = this;
        this.audioEl = options.audioEl = document.getElementById("background-audio");
        this.nowPlayingCollection = options.nowPlayingCollection = new NowPlayingCollection();
        this.pollFsm = new NowPlayingPollFsm(backgroundApp.audioEl, backgroundApp.nowPlayingCollection);

        window.chrome.extension.onConnect.addListener(function(port) {
          if (port.name == "kexp.app.view") {
            self.pollFsm.attachView();
            port.onDisconnect.addListener(function() {
              self.pollFsm.detachView();
              _gaq.push(["_trackEvent", "Application", "Close"]);
            });
          }
        });
      });

      backgroundApp.addInitializer(function(options) {
        this.addService(new LastFmScrobbleService(), options);
      });

      backgroundApp.start({});
      console.log("background page loaded.");
    });
});