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
        if (port.name === "kexp.popup.view") {
          self.pollFsm.attachView();

          var nowPlayingEventHandle = self.bindTo(self.nowPlayingCollection, "all", function(eventName, model) {
            port.postMessage({
              type: "event",
              name: eventName,
              target: "NowPlayingCollection",
              data: model.toJSON()
            });
          }, this);

          var appConfigEventHandle = self.bindTo(self.appConfig, "all", function(eventName, model) {
            port.postMessage({
              type: "event",
              name: eventName,
              target: "AppConfigCollection",
              data: model.toJSON()
            });
          }, this);

          port.onMessage.addListener(function(message) {
            if (message.type === "fetch" && message.target === "NowPlayingCollection") {
              port.postMessage({
                type: "fetch",
                target: "NowPlayingCollection",
                data: self.nowPlayingCollection.toJSON()
              });
            }
          });
          
          port.onDisconnect.addListener(function() {
            self.unbindFrom(nowPlayingEventHandle);
            self.unbindFrom(appConfigEventHandle);
            nowPlayingEventHandle = null;
            appConfigEventHandle = null;
            self.pollFsm.detachView();
            port = null;
          });
        } else if (port.name === "kexp.options.view") {

          port.onMessage.addListener(function(message) {
            if (message.type === "event" && message.name === "change" && message.target === "AppConfigCollection") {
              self.appConfig.upsert(message.data);
            }
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