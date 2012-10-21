define([
  "jquery",
  "underscore",
  "models/NowPlayingModel",
  "services/Service"
  ], function($, _, NowPlayingModel, Service) {

    var ChromeOptionsViewService = Service.extend({

      onStart: function(options) {
        var self = this;
        this._port = window.chrome.extension.connect({name: "kexp.options.view"});

        this.bindTo(options.appConfig, "change", function(model) {
          self._port.postMessage({
            type: "event",
            name: "change",
            target: "AppConfigCollection",
            data: model.toJSON()
          });
        }, this);
      },
      onStop: function() {
        this._port.disconnect();
      },
      toString: function() {
        return "ChromeOptionsViewService";
      }
    });

    return ChromeOptionsViewService;
});