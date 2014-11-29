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
    scopes: ['playlist-read-private', 'playlist-modify-private']
  };

  var SpotifyConfigModel = Backbone.Model.extend({

      localStorage: new Backbone.LocalStorage("app.kexp.config.item"),
      
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
        console.debug("[Spotify API Authorization Request]");
        var self = this;
        return this.spotifySync.authenticate()
          .pipe(function() {
            self.updateSpotifyUser()
              .pipe(function() {
                self.upsertPlaylist();
              })
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
        console.debug("[Spotify API Authorization Enabled] => %s", JSON.stringify(tokenResp));
        
        var tokenState = {
          accessToken: tokenResp.access_token,
          tokenType: tokenResp.token_type,
          expiresIn: tokenResp.expires_in,
          refreshToken: tokenResp.refresh_token,
          tokenRequestTime: tokenResp.time
        };

        this.set(_.pick(tokenState, function(value, key, object) {
          return value !== null && value !== undefined;
        }));
      },
      disableAuthorization: function() {
        console.debug("[Spotify API Authorization Disabled]");
        this.set({
          accessToken: null,
          tokenType: null,
          expiresIn: null,
          refreshToken: null,
          playListId: null,
          userId: null,
          userDisplayName: null
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
        var self = this,
            upsertDfr = $.Deferred();
        
        console.log("finding spotify playlist: " + self.get('playListName'));
        $.ajax({
          url: self.get('apiUrl') + '/users/' + self.get('userId') + '/playlists?limit=50',
          type: 'GET',
          dataType: 'json',
          headers: self.spotifySync.getAuthorizationHeader()
        })
        .pipe(
          function(response) {
            if (response.items && response.items.length > 0) {
              for (var i=0; i<response.items.length; i++) {
                if (response.items[i].name.toLowerCase() === self.get('playListName')) {
                  console.log("found matching spotify playlist: %s", JSON.stringify(response.items[i]))
                  return $.Deferred().resolve(response.items[i]);
                }
              }
            } 

            if (response && response.next) {
              return $.ajax({
                url: response.next,
                type: 'GET',
                dataType: 'json',
                headers: self.spotifySync.getAuthorizationHeader()
              }).pipe(arguments.callee);
            } else {
              console.log("unable to find spotify playlist: " + self.get('playListName'));
              $.Deferred().resolve();
            }
          }
        )
        .pipe(
          function(playlist) {
            if (playlist && playlist.id) {
              self.set({ 
                playListId: playlist.id 
              });
              upsertDfr.resolve()
            } else {
              console.log("creating new spotify playlist: " + self.get('playListName'));
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
                  upsertDfr.resolve();
                },
                error: function (xhr, status, errorThrown) {
                  upsertDfr.reject(xhr.responseText);
                }
              });
            }
          }
        );

        return upsertDfr.promise();
      },
      getSync: function() {
        return _.bind(this.spotifySync.sync, this.spotifySync);
      }
  });

  return SpotifyConfigModel;

});