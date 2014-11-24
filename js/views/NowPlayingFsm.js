define([
  "machina",
  "jquery",
  "underscore",
  "collections/LikedSongCollection",
  "collections/LastFmCollection",
  "models/LastFmModel"
  ], function(Machina, $, _, LikedSongCollection, LastFmCollection, LastFmModel) {

  var NowPlayingFsm = function(nowPlayingModel) {

    var nowPlayingFsm = new Machina.Fsm({

      initialState: "uninitialized",
      events: ["initialized", "resolve:liked", "resolve:lastfm", "reconciled", "error"],
      states: {
        "uninitialized": {
          _onEnter: function() {
            console.debug("[Now Playing: uninitialized]");
          },
          "initialize": function() {
            if (!_.isObject(nowPlayingModel)) {
              this.transition("error");
            } else {
              this.transition("initialized");
            }

          }
        },
        "initialized": {
          _onEnter: function() {
            console.debug("[Now Playing: initialized]");
            
            var fsm = this,
              songTitle = nowPlayingModel.get("songTitle"),
              artistName = nowPlayingModel.get("artist"),
              albumName = nowPlayingModel.get("album"),
              songCollection = new LikedSongCollection();

            this.fireEvent("initialized", nowPlayingModel);

            //nowPlayingModel.set("airBreak", true);

            if (nowPlayingModel.get("airBreak") || nowPlayingModel.hasLikedSong()) {
              fsm.transition("likeResolved");

            } else {
              songCollection.fetchSong(songTitle, artistName, albumName, {
                success: function(collection, resp) {
                  var likedSong = collection.first();
                  if (likedSong) {
                    console.debug("Resolved %s for %s", likedSong.toDebugString(), nowPlayingModel.toDebugString());
                    nowPlayingModel.likedSong = likedSong;
                  }
                  fsm.transition("likeResolved");
                },
                error: function(collection, error, options) {
                  // No Cursor Error if Artist & Album are empty
                  console.log("Error {%s} resolving liked song for %s", error, nowPlayingModel.toDebugString(), collection, error, options);
                  fsm.transition("likeResolved");
                }
              });
            }
          }
        },
        "likeResolved": {
          _onEnter: function() {
            console.debug("[Now Playing: likeResolved]");
            this.fireEvent("resolve:liked", nowPlayingModel);

            if (_.isUndefined(nowPlayingModel.lastFmMeta)) {
              nowPlayingModel.lastFmMeta = new LastFmCollection();
            }

            if (nowPlayingModel.get("airBreak")) {

              nowPlayingModel.lastFmMeta.add(
              {
                  "mbid": "",
                  "url": "http://www.kexp.org/",
                  "id": "",
                  "name": "KEXP",
                   "images": [
                      {
                          "url": "./img/kexp40years.jpg",
                          "size": "large"
                      }
                  ],
                  "entity": "artist"
              });

              return this.transition("lastfmResolved");
            }
            
            var fsm = this,
              artistName = nowPlayingModel.get("artist"),
              albumName = nowPlayingModel.get("album"),
              metaCollection = nowPlayingModel.lastFmMeta,
              albumPromise = metaCollection.getOrFetchAlbum(artistName, albumName),
              artistPromise = metaCollection.getOrFetchArtist(artistName);

            albumPromise.pipe(
              function(model, resp) {
                return artistPromise;
              },
              function(model, error, options) {
                var cancelDfr;
                if (error && error.error === 6 && error.message === "Artist not found") {
                  cancelDfr = $.Deferred().reject(model, error);
                  return cancelDfr.promise();
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
            console.debug("[Now Playing: lastfmResolved]");
            this.fireEvent("resolve:lastfm", nowPlayingModel);
            this.transition("reconciled");
          }
        },
        "reconciled": {
          _onEnter: function() {
            console.debug("[Now Playing: reconciled]");
            this.fireEvent("reconciled", nowPlayingModel);
          }
        },
        "error": {
          _onEnter: function() {
            console.debug("[Now Playing: error]");
            this.fireEvent("error", nowPlayingModel);
          }
        }
      }
    });
    return nowPlayingFsm;
  };
  return NowPlayingFsm;
});