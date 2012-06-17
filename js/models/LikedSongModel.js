define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "backbone-indexeddb",
  "databases/LikedSongDatabase"
  ], function($, Backbone, _, IndexedDBSync, LikedSongDatabase) {

  var LikedSongModel = Backbone.Model.extend({

    database: new LikedSongDatabase(),
    storeName: "songs",
    sync: IndexedDBSync,
    defaults: {
      artist: "",
      // http://musicbrainz.org/
      artistMbid: "",
      artistLastFmUrl: "",
      songTitle: "",
      // http://musicbrainz.org/
      trackMbid: "",
      trackLastFmUrl: "",
      trackDownloadUrl: "",
      album: "",
      albumLastFmUrl: "",
      // http://musicbrainz.org/
      albumMbid: "",
      albumYear: "",
      albumLabel: "",
      // reserved
      //labelMbid:"",
      likeCount: 0,
      lastFmShareStatus: 0,
      lastFmTrackScrobbleCount: 0,
      timeCreated: new Date(),
      timeModified: new Date(),
      timeLastLike: new Date(),
      timeLastFmLoveShare: null
    },
    mappings: [
      {attribute: "*"},
      {attribute: "timeCreated", type: "date"},
      {attribute: "timeModified", type: "date"},
      {attribute: "timeLastLike", type: "date"},
      {attribute: "timeLastFmLoveShare", type: "date"}
    ],
    initialize: function() {
      this.bind("change", this.updateModifedTime, this);
    },
    save: function(key, value, options) {
      if (this.isNew()) {
        this.set({timeCreated: new Date()}, {silent: true});
      }
      return Backbone.Model.prototype.save.call(this, key, value, options);
    },
    updateModifedTime: function() {
      //console.debug("Updating timeModified for LikedSongModel", this);
      this.set({timeModified: new Date()}, {silent: true});
    },
    like: function() {
      var likeCount = this.get("likeCount");
      this.set({
        likeCount: ++likeCount,
        timeLastLike: new Date()
      });
    },
    scrobble: function() {
      var scrobbleCount = this.get("lastFmTrackScrobbleCount");
      this.set({lastFmTrackScrobbleCount: ++scrobbleCount});
    },
    hasLastFmShareStatus: function(flag) {
      return (this.get("lastFmShareStatus") & flag) === flag;
    },
    setLastFmShareStatus: function(flag) {
      var values = {lastFmShareStatus: this.get("lastFmShareStatus") | flag};
      if (flag === LikedSongModel.LastFmShareStatus.TrackLove) {
          values.timeLastFmLoveShare = new Date();
      }
      this.set(values);
    },
    unsetLastFmShareStatus: function(flag) {
      this.set({lastFmShareStatus: this.get("lastFmShareStatus") & flag});
    },
    setLastFmAttributes: function(lastFmCollection, options) {
      if (lastFmCollection instanceof Backbone.Collection) {

        var attributes = {},
            songTitle = this.get("songTitle"),
            artist = this.get("artist"),
            album = this.get("album");

        _.each(lastFmCollection.models, function(lastfmModel) {
          var track;
          if (lastfmModel.isArtist()) {
            attributes.artistMbid = lastfmModel.get("mbid") || "";
            attributes.artistLastFmUrl = lastfmModel.get("url") || "";
          } else if (lastfmModel.isAlbum()) {
            attributes.albumMbid = lastfmModel.get("mbid") || "";
            attributes.albumLastFmUrl = lastfmModel.get("url") || "";
            track = lastfmModel.getTrack(songTitle, artist, album);
            if (track) {
              attributes.trackMbid = track.mbid || "";
              attributes.trackLastFmUrl = track.url || "";
              attributes.trackDownloadUrl = track.downloadurl || "";
            }
          }
        });
        this.set(attributes, options);
      }
    },
    toDebugString: function() {
      return "LikedSong - Artist: {" + this.get("artist") + "} Album: {" + this.get("album") +
      "} Song: {" + this.get("songTitle") + "} LikeCount: {" + this.get("likeCount") + "}";
    }
  });

  var LastFmShareStatus = {
    None: 0,
    TrackLove: 1
    //LibraryAlbum: 2,
    //LibraryArist: 4,
    //LibraryTrack: 8
  };
  Object.freeze(LastFmShareStatus);
  LikedSongModel.LastFmShareStatus = LastFmShareStatus;

  return LikedSongModel;
});