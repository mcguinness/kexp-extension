define([
  "jquery",
  "underscore",
  "backbone",
  "md5",
  "moment" // Global, no need for arg
  ], function($, _, Backbone, MD5) {

  var LastFmApi = function(options) {
    options = options || {};

    this.apiUrl = "http://ws.audioscrobbler.com/2.0/";
    this.apiKey = options.apiKey || "10fc31f4ac0c2a4453cab6d75b526c67";
    this.apiKeyInvalid = false;
    this.apiKeySuspended = false;

    this.apiSecret = options.apiSecret || "b2dbe4ef99d4cbfd3de034950a0daa4b",
    this.sessionKey = options.sessionKey || "";
    this.sessionKeyInvalid = false; // reauth
  };

  _.extend(LastFmApi.prototype, Backbone.Events, {
    deferredApiCall: function(dataParams, options) {

      var self = this;

      dataParams = _.extend(dataParams, {
        api_key: self.apiKey,
        format: "json"
      });
      
      if (options.authRequired) {
        if (_.isEmpty(self.sessionKey || self.sessionKeyInvalid)) {
          self.trigger("lastfm:api:error:sessionkey:invalid", "Session key is invalid", self.sessionKey, options);
          return $.Deferred().reject(self.sessionKey, "InvalidSessionKey", options);
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
            if (resp.error === 9) {
              self.sessionKeyInvalid = true;
              self.trigger("lastfm:api:error:sessionkey:invalid", "Session key is invalid", self.sessionKey, options);
            }
            else if (resp.error === 10) {
              self.apiKeyInvalid = true;
              self.trigger("lastfm:api:error:apikey:invalid", "API key is invalid", self.apiKey, options);
            }
            else if (resp.error === 26) {
              self.apiKeySuspended = true;
              self.trigger("lastfm:api:error:apikey:suspended", "API key is suspended", self.apiKey, options);
            } else {
              self.trigger("lastfm:api:error", resp, resp.error, options);
            }
            apiDfr.reject(resp, resp.error, options);
          } else {
            apiDfr.resolve(resp, status, xhr);
          }
          return apiDfr.promise();
        }, function(xhr, textStatus, errorThrown) {
          var apiDfr = $.Deferred();
          console.log("LastFm API Ajax Error: %s", textStatus, xhr, errorThrown);
          self.trigger("lastfm:api:error:ajax", textStatus, xhr, errorThrown);
          return apiDfr.reject(
            {
              error: xhr.status,
              message: xhr.statusText
            },
            errorThrown,
            options
          ).promise();

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
      console.log("LastFM API Signature Hash Input: %s", apiHashInput);
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
    }
  });

  return LastFmApi;
});