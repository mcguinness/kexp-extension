define([
  "jquery",
  "backbone",
  "underscore",
  "gaq"
  ], function($, Backbone, _) {

  var LastFmApi = function(apiKey) {
    this.apiKey = apiKey || "10fc31f4ac0c2a4453cab6d75b526c67";
  };

  _.extend(LastFmApi.prototype, {
    apiUrl: "http://ws.audioscrobbler.com/2.0/",
    apiCall: function(queryParams, options) {

      var dataParams = {
        api_key: this.apiKey,
        format: "json"
      };
      _.extend(dataParams, queryParams);

      options.success = _.wrap(options.success, function(callerSuccess, resp, status, xhr) {
        if (!_.isEmpty(resp) && resp["error"]) {
          if (resp.error !== 6) {
            _gaq.push(["_trackEvent", "LastFmApi", "error", resp.message, resp.error]);
          }

          if (options.error) {
            options.error(resp, "apierror");
            return;
          }
        }

        if (callerSuccess) {
          callerSuccess(resp, status, xhr);
        }
      });

      $.ajax(_.extend(options, {
        type: "GET",
        url: this.apiUrl,
        //dataType: "jsonp",
        timeout: 4000,
        data: dataParams
      }));
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

        this.apiCall({
          method: "album.getInfo",
          artist: options.conditions.artist,
          album: options.conditions.album,
          autocorrect: 1
        }, options);
        break;
      case "artist":
        if (_.isEmpty(options.conditions.artist)) {
          options.error("Album query requires an artist condition [artist: name]", "invalidoption");
          break;
        }
        this.apiCall({
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
          if (model && model.id) {
            throw new Error("Model fetch by id not supported yet");
          } else {
            api.query(options); // It's a collection
          }
          break;
        default:
          options.error("Sync method" + method + "is not supported by LastFM sync provider.", "notsupported");
          break;
      }
    }
  });

  var api = new LastFmApi();
  return api.sync;
});