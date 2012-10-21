define([
  "jquery",
  "underscore",
  "models/NowPlayingModel",
  "services/Service"
  ], function($, _, NowPlayingModel, Service) {

    var ChromePopupViewService = Service.extend({

      onStart: function(options) {
        this.collections = {
          appConfig: options.appConfig,
          nowPlaying: options.nowPlayingCollection
        };

        _.bindAll(this, "handleMessage");

        this._port = window.chrome.extension.connect({name: "kexp.popup.view"});
        this._port.onMessage.addListener(this.handleMessage);
        this._port.postMessage({
          type: "fetch",
          target: "NowPlayingCollection"
        });
      },
      onStop: function() {
        this._port.disconnect();
      },
      handleMessage : function(message) {
        var collection;

        if (message.type === "event") {
          switch (message.target) {
            case "NowPlayingCollection" :
              collection = this.collections.nowPlaying;
              this.handleCollectionEvent(message.name, collection, message.data);
              break;
            case "AppConfigCollection" :
              if (message.name === "change") {
                this.collections.appConfig.upsert(message.data);
              }
              break;
            default:
              break;
          }
        } else if (message.type === "fetch") {
          switch (message.target) {
            case "NowPlayingCollection" :
              collection = this.collections.nowPlaying;
              collection.upsert(collection.parse(message.data), {
                parseDateISOString: true
              });
              break;
            default:
              break;
          }
        }
      },
      handleCollectionEvent: function(eventName, collection, eventData) {
        var parseOptions = {
          parseDateISOString: true
        };

        switch (eventName) {
          case "add" :
            collection.add(eventData, parseOptions);
            break;
          case "remove" :
            collection.remove(eventData);
            break;
          case "reset" :
            collection.reset();
            break;
          case "change" :
            collection.upsert(eventData, parseOptions);
            break;
          case "error" :
            collection.trigger("error", collection, eventData);
            break;
          default:
            break;
        }
      },
      toString: function() {
        return "ChromePopupViewService";
      }
    });

    return ChromePopupViewService;
});