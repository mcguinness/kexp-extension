define(["jquery", "underscore", "backbone-kexp"], function($, _, Backbone) {

  var LastFmSync = function(options) {
    var appConfig = (options && options.appConfig) ? options.appConfig : window.KexpApp.appConfig;
    _.extend(this, appConfig.getLastFm().getApi());
    // Backbone Fetch overwrites context, so we need to rebind here
    this.sync = _.bind(this.sync, this);
  };

  _.extend(LastFmSync.prototype, {

    getInfo: function(model, options) {
      switch (model.get("entity").toLowerCase()) {
        case "album":
          this.callbackApiCall({
            method: "album.getInfo",
            mbid: model.id
          }, options);
          break;
        case "artist":
          this.callbackApiCall({
            method: "artist.getInfo",
            mbid: model.id
          }, options);
          break;
        case "track":
          this.callbackApiCall({
            method: "track.getInfo",
            mbid: model.id
          }, options);
          break;
        default:
          options.error("Model entity type [" + model.get("entity") + "] is not supported", "invalidoption");
          break;
      }
    },
    query: function(options) {

      if (options.conditions === undefined) {
        options.error("Conditions must be specified in options for a collection query.", "invalidoption");
        return;
      }

      if (_.isEmpty(options.conditions.entity)) {
        options.error("Conditions must specify an entity [entity: {name}].", "invalidoption");
        return;
      }

      switch (options.conditions.entity.toLowerCase()) {
      case "album":
        if (_.isEmpty(options.conditions.artist)) {
          options.error("Album query requires an artist condition [artist: {name}]", "invalidoption");
          break;
        }
        if (_.isEmpty(options.conditions.album)) {
          options.error("Album query requires an album condition [album: {name}]", "invalidoption");
          break;
        }

        this.callbackApiCall({
          method: "album.getInfo",
          artist: options.conditions.artist,
          album: options.conditions.album,
          autocorrect: 1
        }, options);
        break;
      case "artist":
        if (_.isEmpty(options.conditions.artist)) {
          options.error("Album query requires an artist condition [artist: {name}]", "invalidoption");
          break;
        }
        this.callbackApiCall({
          method: "artist.getInfo",
          artist: options.conditions.artist,
          autocorrect: 1
        }, options);
        break;
      default:
        options.error("Query condition entity [entity: " + options.conditions.entity + "] is not supported", "invalidoption");
        break;
      }
    },
    sync: function(method, model, options) {

      options = options ? _.clone(options) : {};

      options.success = _.wrap(options.success, function(callerSuccess, resp, status, xhr) {
        console.debug("LastFM API Sync Result Status: " + status, resp, xhr);
        if (callerSuccess) {
          callerSuccess(resp, status, xhr);
        }
      });

      options.error = _.wrap(options.error, function(callerError, resp, status, contextOptions) {
        console.debug("LastFM API Sync Result Status: " + status, resp, contextOptions);
        if (callerError) {
          callerError(resp, status, contextOptions);
        }
      });

      switch (method) {
        case "read":
          if (model && model instanceof Backbone.Model && model.id && model.get("entity")) {
            this.getInfo(model, options);
          } else {
            this.query(options); // It's a collection
          }
          break;
        default:
          options.error("Sync method" + method + "is not supported by LastFM sync provider.", "notsupported");
          break;
      }
    }
  });

  

  return LastFmSync;
});