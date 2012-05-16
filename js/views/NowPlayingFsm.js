define(["machina", "jquery", "underscore", "models/LastFmModel"], function(machina, $, _, LastFmModel) {

  var NowPlayingFsm = function(nowPlayingModel) {

    // if (nowPlayingModel === undefined) {
    //     throw new Error("NowPlayingFsm requires a valid NowPlayingModel");
    // }
    var fsm = new machina.Fsm({

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
            var self = this;

            this.fireEvent("initialized");

            if (nowPlayingModel.get("relLiked")) {
              self.transition("likeResolved");

            } else {
              nowPlayingModel.resolveLikedSong()
                .fail(function(error, options) {
                  console.error("Failed to resolve liked song for model %s with error %s", nowPlayingModel.id, error, error, options);
                })
                .always(function() {
                  self.transition("likeResolved");
                });
            }
          }
        },
        "likeResolved": {
          _onEnter: function() {
            this.fireEvent("resolve:liked", nowPlayingModel.get("relLiked"));

            var self = this,
              artistName = nowPlayingModel.get("Artist"),
              albumName = nowPlayingModel.get("Album"),
              metaCollection = nowPlayingModel.get("relLastFmMeta"),
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
            this.fireEvent("resolve:lastfm", nowPlayingModel.get("relLastFmMeta"));
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