define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "backbone-localstorage"
  ], function($, _, Backbone, Store) {

  var SpotifyConfigModel = Backbone.Model.extend({

      defaults: {
        id: "spotify",
        clientId: "6b0551371741402ba8cb726425fc943d",
        clientSecret: "abb785c0e50f4c77b0f4ec4842f10e10",
        accessToken: null,
        tokenType: null,
        expiresIn: null,
        refreshToken: null,
        scopes: ["playlist-modify-private"],
        authorizeUrl: "https://accounts.spotify.com/authorize",
        tokenUrl: "https://accounts.spotify.com/api/token",
        redirectUrl: null,
        playListName: "liked on kexp",
        likeShareEnabled: true,
      },
      initialize: function(attributes, options) {
      
        options || (options = {});
        // TODO: Move to common module
        if (options.localStorage && _.isFunction(options.localStorage.sync)) {
          this.localStorage = options.localStorage;
          this.sync = options.localStorage.sync;
        } else {
          this.localStorage = new Store("app.kexp.config");
          this.sync = this.localStorage.sync;
        }
      },
      hasAuthorization: function() {
        return !_.isEmpty(this.get("refreshToken"));
      },
      hasSharingEnabled: function() {
        return this.hasAuthorization() && this.isLikeShareEnabled();
      },
      enableAuthorization: function(tokenResp) {
        this.set({
          accessToken: tokenResp.access_token,
          tokenType: tokenResp.token_type,
          expiresIn: tokenResp.expires_in,
          refreshToken: tokenResp.refresh_token
        });
      },
      disableAuthorization: function() {
        console.debug("[Spotify API Authorization Disabled]");
        this.set({
          accessToken: "",
          tokenType: "",
          expiresIn: "",
          refreshToken: ""
        });
      },
      getRedirectUrl: function() {
        var redirectUrl = this.get("redirectUrl");
        return _.isEmpty(this.get(redirectUrl)) ? window.chrome.identity.getRedirectURL() + "spotify" : redirectUrl;
      },
      getAuthorizationUrl: function() {
        return this.get("authorizeUrl") + 
          '?response_type=code' + 
          '&client_id=' + this.get("clientId") + 
          '&scope=' + encodeURIComponent(this.get("scopes").join(',')) + 
          '&redirect_uri=' + encodeURIComponent(this.getRedirectUrl());
      },
      requestAuthorization: function() {
        var self = this,
            authzDfr = $.Deferred();

        window.chrome.identity.launchWebAuthFlow({
          url: this.getAuthorizationUrl(),
          interactive: true
        }, function(responseUrl) {
          console.log("Spotify OAuth Code Response:" + responseUrl);

          if (_.isEmpty(responseUrl)) {
            authzDfr.reject(this, "OAuth code grant was not issued");
          } else {
            var parser = document.createElement('a');
            parser.href = responseUrl;
          
            var params = {}, queries, temp, i, l;
            queries = parser.search.indexOf("?") === 0 ? parser.search.substring(1) : parser.search;
            queries = queries.split("&");
            for (i = 0, l = queries.length; i < l; i++ ) {
              temp = queries[i].split('=');
              params[temp[0]] = temp[1];
            }

            self.acceptAuthorization(params["code"], authzDfr);
          }
        });

        return authzDfr.promise();
      },      
      acceptAuthorization: function(code, authzDfr) {
        var self = this;

        $.ajax({
          type: "POST",
          url: this.get("tokenUrl"),
          data: {
            client_id: this.get("clientId"),
            client_secret: this.get("clientSecret"),
            grant_type: "authorization_code",
            code: code,
            redirect_uri: this.getRedirectUrl()
          }
        }).success(function(resp, status, xhr) {
          console.log("[Spotify OAuth Token Success]", resp);
          self.enableAuthorization(resp);
          authzDfr.resolve();
        }).fail(function(xhr, status, errorThrown) {
          if (xhr.status === 400) {
            status = JSON.parse(xhr.responseText).error;
          }
          console.log("[Spotify OAuth Token Fail] {Error: %s}", status);
          authzDfr.reject(this, status);
        });

        return authzDfr;
      },
      isLikeShareEnabled: function() {
        return (this.get("likeShareEnabled") && this.hasAuthorization());
      }
  });

  return SpotifyConfigModel;

});