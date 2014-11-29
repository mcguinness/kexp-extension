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
      model: nowPlayingModel,
      initialState: "uninitialized",
      events: ["initialized", "resolve:liked", "resolve:lastfm", "reconciled", "error"],
      states: {
        "uninitialized": {
          _onEnter: function() {
            console.debug("[Now Playing: uninitialized]");
          },
          "initialize": function() {
            if (!_.isObject(this.model)) {
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
                songTitle = this.model.get("songTitle"),
                artistName = this.model.get("artist"),
                albumName = this.model.get("album"),
                songCollection = new LikedSongCollection();

            this.fireEvent("initialized", this.model);

            if (this.model.get("airBreak") || this.model.hasLikedSong()) {
              fsm.transition("likeResolved");

            } else {
              songCollection.fetchSong(songTitle, artistName, albumName, {
                success: function(collection, resp) {
                  var likedSong = collection.first();
                  if (likedSong) {
                    console.debug("Resolved %s for %s", likedSong.toDebugString(), fsm.model.toDebugString());
                    fsm.model.likedSong = likedSong;
                  }
                  fsm.transition("likeResolved");
                },
                error: function(collection, error, options) {
                  // No Cursor Error if Artist & Album are empty
                  console.log("Error {%s} resolving liked song for %s", error, fsm.toDebugString(), collection, error, options);
                  fsm.transition("likeResolved");
                }
              });
            }
          }
        },
        "likeResolved": {
          _onEnter: function() {
            console.debug("[Now Playing: likeResolved]");
            this.fireEvent("resolve:liked", this.model);

            if (_.isUndefined(this.model.lastFmMeta)) {
              this.model.lastFmMeta = new LastFmCollection();
            }

            if (this.model.get("airBreak")) {

              this.model.lastFmMeta.add(
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
              artistName = this.model.get("artist"),
              albumName = this.model.get("album"),
              metaCollection = this.model.lastFmMeta,
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
            this.fireEvent("resolve:lastfm", this.model);
            this.transition("reconciled");
          }
        },
        "reconciled": {
          _onEnter: function() {
            console.debug("[Now Playing: reconciled]");
            this.fireEvent("reconciled", this.model);
          }
        },
        "error": {
          _onEnter: function() {
            console.debug("[Now Playing: error]");
            this.fireEvent("error", this.model);
          }
        }
      }
    });
    return nowPlayingFsm;
  };
  return NowPlayingFsm;
});