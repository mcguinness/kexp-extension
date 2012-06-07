define([
  "machina",
  "jquery",
  "underscore",
  "collections/LikedSongCollection",
  "models/LastFmModel"
  ], function(Machina, $, _, LikedSongCollection, LastFmModel) {

  var NowPlayingFsm = function(nowPlayingModel) {

    // if (nowPlayingModel === undefined) {
    //     throw new Error("NowPlayingFsm requires a valid NowPlayingModel");
    // }
    var fsm = new Machina.Fsm({

      initialState: "uninitialized",
      events: ["initialized", "resolve:liked", "resolve:lastfm", "loaded", "error"],
      states: {
        "uninitialized": {
          _onEnter: function() {

          },
          "initialize": function() {
            if (nowPlayingModel === undefined) {
              this.transition("error");
            } else {
              this.transition("initialized");
            }

          }
        },
        "initialized": {
          _onEnter: function() {
            var self = this,
              songTitle = nowPlayingModel.get("songTitle"),
              artistName = nowPlayingModel.get("artist"),
              albumName = nowPlayingModel.get("album"),
              songCollection = new LikedSongCollection(),
              likedSong;

            this.fireEvent("initialized");

            if (nowPlayingModel.hasLikedSong()) {
              self.transition("likeResolved");

            } else {
              songCollection.fetchSong(songTitle, artistName, albumName, {
                success: function(collection, resp) {
                  likedSong = collection.first();
                  if (likedSong) {
                    console.debug("Resolved %s for %s", likedSong.toDebugString(), self.toDebugString(), likedSong, self);
                    self.likedSong = likedSong;
                  }
                  self.transition("likeResolved");
                },
                error: function(collection, error, options) {
                  // Error "should" not happen
                  console.warn("Error {%s} resolving liked song for %s", error, self.toDebugString(), collection, error, options);
                  self.transition("likeResolved");
                }
              });
            }
          }
        },
        "likeResolved": {
          _onEnter: function() {
            this.fireEvent("resolve:liked", nowPlayingModel.likedSong);

            var self = this,
              artistName = nowPlayingModel.get("artist"),
              albumName = nowPlayingModel.get("album"),
              metaCollection = nowPlayingModel.lastFmMeta,
              albumPromise = metaCollection.getOrFetchAlbum(artistName, albumName),
              artistPromise = metaCollection.getOrFetchArtist(artistName),
              cancel;

            albumPromise.pipe(
              function(model, resp) {
                return artistPromise;
              },
              function(model, error, options) {
                if (error && error.error === 6 && error.message === "Artist not found") {
                  cancel = $.Deferred().reject(model, error);
                  return cancel.promise();
                }
                return artistPromise;
              })
              .always(function() {
                self.transition("lastfmResolved");
              });
          }
        },
        "lastfmResolved": {
          _onEnter: function() {
            this.fireEvent("resolve:lastfm", nowPlayingModel.lastFmMeta);
            this.transition("loaded");
          }
        },
        "loaded": {
          _onEnter: function() {
            this.fireEvent("loaded");
          }
        },
        "error": {
          _onEnter: function() {
            this.fireEvent("error");
          }
        }
      }
    });
    return fsm;
  };
  return NowPlayingFsm;
});