define([], function() {

  var LikedSongDatabase = function() {

    var database = {
      id: "song-database",
      description: "The database for favorite songs",
      migrations: [
        {
          version: 1,
          migrate: function(transaction, next) {

            var store;
            if (!transaction.db.objectStoreNames.contains("songs")) {
              store = transaction.db.createObjectStore("songs");
            } else {
              store = transaction.objectStore("songs");
            }

            var tryCreateIndex = function(name, keyPath, options) {
              try {
                store.createIndex(name, keyPath, options);
              } catch (e) {
                if (e.name !== "ConstraintError") {
                  throw e;
                }
              }
            };

            tryCreateIndex("artistIndex", "artist", {
              unique: false
            });

            tryCreateIndex("artistMbidIndex", "artistMbid", {
              unique: false
            });
            tryCreateIndex("artistLastFmUrlIndex", "artistLastFmUrl", {
              unique: false
            });
            tryCreateIndex("songTitleIndex", "songTitle", {
              unique: false
            });
            tryCreateIndex("albumIndex", "album", {
              unique: false
            });
            tryCreateIndex("albumMbidIndex", "albumMbid", {
              unique: false
            });
            tryCreateIndex("albumLastFmUrlIndex", "albumLastFmUrl", {
              unique: false
            });
            tryCreateIndex("albumLabelIndex", "albumLabel", {
              unique: false
            });
            tryCreateIndex("likeCountIndex", "likeCount", {
              unique: false
            });

            next();
          }
        }
      ]
    };
    return database;
  };
  return LikedSongDatabase;
});