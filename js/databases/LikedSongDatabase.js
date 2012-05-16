define([], function() {

  var LikedSongDatabase = function() {

    var database = {
      id: "song-database",
      description: "The database for favorite songs",
      migrations: [
        {
          version: 1,
          migrate: function(transaction, next) {
            var store = transaction.db.createObjectStore("songs");
            store.createIndex("artistIndex", "artist", {
              unique: false
            });
            store.createIndex("artistMbidIndex", "artistMbid", {
              unique: false
            });
            store.createIndex("artistLastFmUrlIndex", "artistLastFmUrl", {
              unique: false
            });
            store.createIndex("songTitleIndex", "songTitle", {
              unique: false
            });
            store.createIndex("albumIndex", "album", {
              unique: false
            });
            store.createIndex("albumMbidIndex", "albumMbid", {
              unique: false
            });
            store.createIndex("albumLastFmUrlIndex", "albumLastFmUrl", {
              unique: false
            });
            store.createIndex("albumLabelIndex", "albumLabel", {
              unique: false
            });
            store.createIndex("likeCountIndex", "likeCount", {
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