define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "backbone-localstorage",
  "backbone-oauth"
  ], function($, _, Backbone, Store, OAuth2Sync) {

  var SpotifyAppOptions = {
    authzUrl: 'https://accounts.spotify.com/authorize',
    accessUrl: 'https://accounts.spotify.com/api/token',
    redirectUrl: window.chrome.identity.getRedirectURL() + "spotify",
    refreshUrl: 'https://accounts.spotify.com/api/token',
    clientId: "6b0551371741402ba8cb726425fc943d",
    clientSecret: "abb785c0e50f4c77b0f4ec4842f10e10",
    scopes: ['playlist-modify-private']
  };

  var SpotifyConfigModel = Backbone.Model.extend({

      defaults: {
        id: "spotify",
        apiUrl: 'https://api.spotify.com/v1',
        accessToken: null,
        tokenType: null,
        expiresIn: null,
        refreshToken: null,
        tokenRequestTime: null,
        playListName: 'liked on kexp',
        playListId: null,
        userId: null,
        userDisplayName: null,
        likeShareEnabled: true
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

        var storage = {
          storage: {
            load: _.bind(this.getAuthorization, this),
            save: _.bind(this.enableAuthorization, this),
            clear: _.bind(this.disableAuthorization, this)
          }
        };

        this.spotifySync = new OAuth2Sync(_.extend(SpotifyAppOptions, storage));
      },
      hasAuthorization: function() {
        return !_.isEmpty(this.get("refreshToken"));
      },
      hasSharingEnabled: function() {
        return this.hasAuthorization() && this.isLikeShareEnabled();
      },
      requestAuthorization: function() {
        var self = this;
        return this.spotifySync.authorize().pipe(function(response) {
          console.log(response);
          return self.spotifySync.access(response.code)
            .done(function() {
                self.updateSpotifyUser()
                  .done(function() {
                    self.upsertPlaylist();
                  })
            });
        });
      },
      getAuthorizationHeader: function() {
        return this.spotifySync.getAuthorizationHeader();
      },
      getAuthorization: function() {
        return {
          access_token: this.get('accessToken'),
          refresh_token: this.get('refreshToken'),
          token_type: this.get('tokenType'),
          expires_in: this.get('expiresIn'),
          time: this.get('tokenRequestTime')
        }
      },
      enableAuthorization: function(tokenResp) {
        this.set({
          accessToken: tokenResp.access_token,
          tokenType: tokenResp.token_type,
          expiresIn: tokenResp.expires_in,
          refreshToken: tokenResp.refresh_token,
          tokenRequestTime: tokenResp.time
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
      isLikeShareEnabled: function() {
        return (this.get("likeShareEnabled") && 
          this.hasAuthorization() && 
          this.get("userId") && 
          this.get("playListId"));
      },
      updateSpotifyUser: function() {
        var self = this;
        return $.ajax({
          url: self.get('apiUrl') + '/me',
          type: 'GET',
          dataType: 'json',
          headers: self.spotifySync.getAuthorizationHeader(),
          success: function(response) {
            self.set({ 
              userId: response.id,
              userDisplayName: response.display_name
            });
          }
        });
      },
      upsertPlaylist: function() {
        var self = this;
        
        return $.ajax({
          url: self.get('apiUrl') + '/search?q="' + self.get('playListName') + '"&type=playlist',
          type: 'GET',
          dataType: 'json',
          headers: self.spotifySync.getAuthorizationHeader(),
          success: function(response) {
            if (response.playlists && response.playlists.items && response.playlists.length > 0) {
              self.set({ 
                playListId: response.playlists[0].id 
              });
            }
          }
        }).pipe(function(response) {
          if (_.isEmpty(self.get('playListId'))) {
            return $.ajax({
              url: self.get('apiUrl') + '/users/' + self.get('userId') + '/playlists',
              type: 'POST',
              dataType: 'json',
              data: JSON.stringify({
                name: self.get('playListName'),
                public: false
              }),
              headers: self.spotifySync.getAuthorizationHeader(),
              success: function(response) {
                self.set({ 
                  playListId: response.id 
                });
              }
            });
          } else {
            return $.Deferred().resolve();
          }
        });
      },
      getSync: function() {
        return _.bind(this.spotifySync.sync, this.spotifySync);
      }
  });

  return SpotifyConfigModel;

});