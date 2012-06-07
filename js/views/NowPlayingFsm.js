define([
  "machina",
  "jquery",
  "underscore",
  "collections/LikedSongCollection",
  "models/LastFmModel"
  ], function(Machina, $, _, LikedSongCollection, LastFmModel) {

  var NowPlayingFsm = function(nowPlayingModel) {

    var nowPlayingFsm = new Machina.Fsm({

      initialState: "uninitialized",
      events: ["initialized", "resolve:liked", "resolve:lastfm", "reconciled", "error"],
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
            var fsm = this,
              songTitle = nowPlayingModel.get("songTitle"),
              artistName = nowPlayingModel.get("artist"),
              albumName = nowPlayingModel.get("album"),
              songCollection = new LikedSongCollection(),
              likedSong;

            this.fireEvent("initialized");

            if (nowPlayingModel.hasLikedSong()) {
              fsm.transition("likeResolved");

            } else {
              songCollection.fetchSong(songTitle, artistName, albumName, {
                success: function(collection, resp) {
                  likedSong = collection.first();
                  if (likedSong) {
                    console.debug("Resolved %s for %s", likedSong.toDebugString(), nowPlayingModel.toDebugString());
                    nowPlayingModel.likedSong = likedSong;
                  }
                  fsm.transition("likeResolved");
                },
                error: function(collection, error, options) {
                  // Error "should" not happen
                  console.warn("Error {%s} resolving liked song for %s", error, nowPlayingModel.toDebugString(), collection, error, options);
                  fsm.transition("likeResolved");
                }
              });
            }
          }
        },
        "likeResolved": {
          _onEnter: function() {
            this.fireEvent("resolve:liked", nowPlayingModel.likedSong);

            var fsm = this,
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
                fsm.transition("lastfmResolved");
              });
          }
        },
        "lastfmResolved": {
          _onEnter: function() {
            this.fireEvent("resolve:lastfm", nowPlayingModel.lastFmMeta);
            this.transition("reconciled");
          }
        },
        "reconciled": {
          _onEnter: function() {
            this.fireEvent("reconciled");
          }
        },
        "error": {
          _onEnter: function() {
            this.fireEvent("error");
          }
        }
      }
    });
    return nowPlayingFsm;
  };
  return NowPlayingFsm;
});