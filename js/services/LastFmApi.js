define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "md5",
  "moment" // Global, no need for arg
  ], function($, _, Backbone, MD5) {

  function InvalidOptionError(message) {
      this.name = "MissingOptionError";
      this.message = message;
  }
  InvalidOptionError.prototype = new Error();
  InvalidOptionError.prototype.constructor = InvalidOptionError;


  function NotSupportedError(message) {
      this.name = "NotSupportedError";
      this.message = message;
  }
  NotSupportedError.prototype = new Error();
  NotSupportedError.prototype.constructor = NotSupportedError;


  var LastFmApi = function(options) {
    this.setConfig(options);

    // Backbone Fetch overwrites context, so we need to rebind here
    this.sync = _.bind(this.sync, this);
  };

  _.extend(LastFmApi.prototype, Backbone.Events, {
    setConfig: function(options) {
      options || (options = {});
      this.apiUrl = "http://ws.audioscrobbler.com/2.0/";
      this.apiKey = options.apiKey || "10fc31f4ac0c2a4453cab6d75b526c67";
      this.apiKeyInvalid = false;
      this.apiKeySuspended = false;

      this.apiSecret = options.apiSecret || "b2dbe4ef99d4cbfd3de034950a0daa4b",
      this.sessionKey = options.sessionKey || "";
      this.sessionKeyInvalid = false; // reauth
    },
    deferredApiCall: function(dataParams, options) {

      options || (options = {});
      dataParams = _.extend(dataParams, {
        api_key: this.apiKey,
        format: "json"
      });

      var self = this;

      if (options.authRequired) {
        if (_.isEmpty(self.sessionKey) || self.sessionKeyInvalid) {
          self.trigger("lastfm:api:error:sessionkey:invalid", self.sessionKey, dataParams);
          return $.Deferred().reject({}, "apierror", {"error":9, "message":"Invalid session key - Please re-authenticate"});
        }
        dataParams.sk = self.sessionKey;
      }
      if (options.signatureRequired) {
        dataParams.api_sig = self.getApiSignature(dataParams);
      }

      options = _.extend(options, {
        type: options.type || "GET",
        url: self.apiUrl,
        timeout: 4000,
        data: dataParams
      });

      return $.ajax(options)
        .pipe(function(resp, status, xhr) {
          var apiDfr = $.Deferred();
          if (!_.isEmpty(resp) && resp.error) {
            console.log("LastFm API Error: %s", JSON.stringify(resp));
            if (resp.error === 9) {
              self.sessionKeyInvalid = true;
              self.trigger("lastfm:api:error:sessionkey:invalid", self.sessionKey, options);
            }
            else if (resp.error === 10) {
              self.apiKeyInvalid = true;
              self.trigger("lastfm:api:error:apikey:invalid", self.apiKey, options);
            }
            else if (resp.error === 26) {
              self.apiKeySuspended = true;
              self.trigger("lastfm:api:error:apikey:suspended", self.apiKey, options);
            } else {
              self.trigger("lastfm:api:error", resp, options);
            }
            apiDfr.reject(xhr, "apierror", resp);
          } else {
            apiDfr.resolve(resp, status, xhr);
          }
          return apiDfr.promise();
        }, function(xhr, status, errorThrown) {
          var apiDfr = $.Deferred();
          console.log("LastFm API Ajax Error: %s - %s", status, errorThrown, options);
          self.trigger("lastfm:api:error:ajax", status, errorThrown, options);
          return apiDfr.reject(xhr, status, errorThrown).promise();
        });
    },
    callbackApiCall: function(dataParams, options) {

      // Strip any Success or Error callbacks from options
      var callbackFreeOptions = _.clone(options);
      var callerSuccess, callerError, apiDfr;
      
      if (callbackFreeOptions.success) {
        callerSuccess = callbackFreeOptions.success;
        delete callbackFreeOptions.success;
      }
      if (callbackFreeOptions.error) {
        callerError = callbackFreeOptions.error;
        delete callbackFreeOptions.error;
      }

      apiDfr = this.deferredApiCall(dataParams, callbackFreeOptions);
      if (callerSuccess) apiDfr.done(callerSuccess);
      if (callerError) apiDfr.fail(callerError);
        
    },
    getApiSignature: function(params) {
      var key, keys = [],
        index, apiHashInput = "";

      for (key in params) {
        if (key === "format" || key === "callback") continue;
        keys.push(key);
      }
      keys.sort();

      for (index in keys) {
        key = keys[index];
        apiHashInput += (key + params[key]);
      }
      apiHashInput += this.apiSecret;
      //console.log("LastFM API Signature Hash Input: %s", apiHashInput);
      return MD5.hex_md5(apiHashInput);
    },
    getAuthToken: function() {

      var dataParams = {
        method: "auth.getToken"
      };
      var options = {
        type: "GET",
        signatureRequired: true
      };

      // TODO intercept token error codes
      return this.deferredApiCall(dataParams, options);
    },
    getAuthSession: function(token) {
      if (_.isEmpty(token)) {
        throw new Error("Token is required.");
      }
      var dataParams = {
        method: "auth.getSession",
        token: token
      };
      var options = {
        type: "GET",
        signatureRequired: true
      };

      // TODO intercept session error codes
      return this.deferredApiCall(dataParams, options);
    },
    loveTrack: function(track, artist) {
      if (_.isEmpty(track)) {
        throw new Error("Track name is required.");
      }
      if (_.isEmpty(artist)) {
        throw new Error("Artist name is required.");
      }
      var dataParams = {
        method: "track.love",
        track: track,
        artist: artist
      };
      var options = {
        type: "POST",
        authRequired: true,
        signatureRequired: true
      };

      return this.deferredApiCall(dataParams, options);
    },
    scrobbleTrack: function(track, artist, album, chosenByUser, timestampUtc) {
      if (_.isEmpty(track)) {
        throw new Error("Track name is required.");
      }
      if (_.isEmpty(artist)) {
        throw new Error("Artist name is required.");
      }
      if (_.isEmpty(album)) {
        throw new Error("Album name is required.");
      }
      var dataParams = {
        method: "track.scrobble",
        track: track,
        artist: artist,
        album: album,
        chosenByUser: (chosenByUser ? 1 : 0),
        timestamp: (!_.isEmpty(timestampUtc) ? moment.utc(timestampUtc).unix() : moment.utc().unix())
      };

      var options = {
        type: "POST",
        authRequired: true,
        signatureRequired: true
      };

      return this.deferredApiCall(dataParams, options);
    },
    getEntityInfo: function(entity, mbid, options) {
   
      if (_.isEmpty(entity)) {
        throw new Error("Entity type is required.");
      }

      if (_.isEmpty(mbid)) {
        throw new Error("Entity mbid is required.");
      }

      switch (entity.toLowerCase()) {
        case "album":
          this.callbackApiCall({
            method: "album.getInfo",
            mbid: mbid
          }, options);
          break;
        case "artist":
          this.callbackApiCall({
            method: "artist.getInfo",
            mbid: mbid
          }, options);
          break;
        case "track":
          this.callbackApiCall({
            method: "track.getInfo",
            mbid: mbid
          }, options);
          break;
        default:
          throw new NotSupportedError("Last.fm entity type [" + entity + "] is not supported");
      }
    },
    query: function(options) {

      if (!_.isObject(options) || !_.isObject(options.conditions)) {
        throw new InvalidOptionError("Conditions must be specified in options for a collection query.");
      }

      if (_.isEmpty(options.conditions.entity)) {
        throw new InvalidOptionError("Conditions must specify an entity [entity: {name}].");
      }

      switch (options.conditions.entity.toLowerCase()) {
        case "album":
          if (_.isEmpty(options.conditions.artist)) {
            throw new InvalidOptionError("Album query requires an artist condition [artist: {name}]");
          }
          if (_.isEmpty(options.conditions.album)) {
            throw new InvalidOptionError("Album query requires an album condition [album: {name}]");
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
            throw new InvalidOptionError("Album query requires an artist condition [artist: {name}]");
          }
          this.callbackApiCall({
            method: "artist.getInfo",
            artist: options.conditions.artist,
            autocorrect: 1
          }, options);
          break;
        default:
          throw new NotSupportedError("Query condition entity [entity: " + options.conditions.entity + "] is not supported");
      }
    },
    sync: function(method, model, options) {
      options || (options = {});

      try {
        switch (method) {
          case "read":
            if (model && model instanceof Backbone.Model && model.id && model.get("entity")) {
              this.getInfo(model.get("entity"), model.id, options);
            } else {
              this.query(options); // It's a collection
            }
            break;
          default:
            throw new NotSupportedError("Sync method" + method + "is not supported by LastFM sync provider.");
        }
      } catch (e) {
        if (_.isFunction(options.error)) {
          options.error(null, e.name.toLowerCase(), e.message);
        }
        else {
          throw e;
        }
      }
    }
  });

  return LastFmApi;
});