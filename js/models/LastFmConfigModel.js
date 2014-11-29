define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "backbone-localstorage"
  ], function($, _, Backbone, Store) {

  var LastFmConfigModel = Backbone.Model.extend({

      localStorage: new Backbone.LocalStorage("app.kexp.config.item"),

      defaults: {
        id: "lastfm",
        apiKey: "10fc31f4ac0c2a4453cab6d75b526c67",
        apiSecret: "b2dbe4ef99d4cbfd3de034950a0daa4b",
        sessionKey: "",
        userName: "",
        authUrl: "http://www.last.fm/api/auth/",
        likeShareEnabled: true,
        likeScrobbleEnabled: true,
        playScrobleEnabled: false
      },
      hasAuthorization: function() {
        return !_.isEmpty(this.get("sessionKey"));
      },
      hasSharingEnabled: function() {
        return this.hasAuthorization() &&
        (this.isLikeShareEnabled() || this.isLikeScrobbleEnabled() || this.isPlayScrobbleEnabled());
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
      },
      isPlayScrobbleEnabled: function() {
        return (this.get("playScrobbleEnabled") && this.hasAuthorization());
      },
      getApiConfig: function() {
        var self = this;
        return _.pick(self.toJSON(), "apiKey", "apiSecret", "sessionKey");
      }
  });

  return LastFmConfigModel;

});