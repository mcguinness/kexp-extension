define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "backbone-localstorage"
  ], function($, _, Backbone, Store) {

  var LastFmConfigModel = Backbone.Model.extend({

      defaults: {
        id: "lastfm",
        apiKey: "10fc31f4ac0c2a4453cab6d75b526c67",
        apiSecret: "b2dbe4ef99d4cbfd3de034950a0daa4b",
        sessionKey: "",
        userName: "",
        authUrl: "http://www.last.fm/api/auth/",
        likeShareEnabled: true,
        likeScrobbleEnabled: true
      },
      initialize: function(attributes, options) {
      
        options || (options = {});

        if (options.localStorage && _.isFunction(options.localStorage.sync)) {
          this.localStorage = options.localStorage;
          this.sync = options.localStorage.sync;
        } else {
          this.localStorage = new Store("app.kexp.config");
          this.sync = this.localStorage.sync;
        }
      },
      hasAuthorization: function() {
        return !_.isEmpty(this.get("sessionKey"));
      },
      hasSharingEnabled: function() {
        return this.hasAuthorization() && (this.isLikeShareEnabled() || this.isLikeScrobbleEnabled());
      },
      disableAuthorization: function() {
        console.debug("[LastFM API Authorization Disabled]");
        this.set({
          sessionKey: "",
          userName: ""
        });
      },
      enableAuthorization: function(sessionKey, userName) {
        this.set({
          sessionKey: sessionKey,
          userName: userName
        });
      },
      isLikeShareEnabled: function() {
        return (this.get("likeShareEnabled") && this.hasAuthorization());
      },
      isLikeScrobbleEnabled: function() {
        return (this.get("likeScrobbleEnabled") && this.hasAuthorization());
      }
  });

  return LastFmConfigModel;

});