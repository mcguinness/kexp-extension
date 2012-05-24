define([
  "jquery",
  "backbone-relational",
  "underscore",
  "indexeddb",
  "databases/LikedSongDatabase"
  ], function($, Backbone, _, IndexedDBSync, LikedSongDatabase) {

  var LikedSongModel = Backbone.RelationalModel.extend({

    database: new LikedSongDatabase(),
    storeName: "songs",
    sync: IndexedDBSync,
    defaults: {
      artist: "",
      // http://musicbrainz.org/
      artistMbid: "",
      artistLastFmUrl: "",
      songTitle: "",
      // reserved
      //songMbid: "",
      album: "",
      albumLastFmUrl: "",
      // http://musicbrainz.org/
      albumMbid: "",
      albumYear: "",
      albumLabel: "",
      // reserved
      //labelMbid:"",
      lastFmShareStatus: 0,
      likeCount: 0,
      timeCreated: new Date(),
      timeModified: new Date(),
      timeLastLike: new Date(),
      timeLastFmLoveShare: null
    },
    initialize: function() {
      this.bind("change", this.updateModifedTime, this);
    },
    toJSON: function() {
      var json = Backbone.Model.prototype.toJSON.call(this);
      json.timeCreated = this.get("timeCreated").toISOString();
      json.timeModified = this.get("timeModified").toISOString();
      json.timeLastLike = this.get("timeLastLike").toISOString();
      json.timeLastFmLoveShare = _.isDate(this.get("timeLastFmLoveShare")) ?
        this.get("timeLastFmLoveShare").toISOString() :
        null;
      return json;
    },
    parse: function(resp, xhr) {
      var parsedModel = _.clone(resp);
      
      if (!_.isUndefined(parsedModel.timeCreated) && !_.isDate(parsedModel.timeCreated)) {
        parsedModel.timeCreated = new Date(Date.parse(parsedModel.timeCreated));
      }
      if (!_.isUndefined(parsedModel.timeModified) && !_.isDate(parsedModel.timeModified)) {
        parsedModel.timeModified = new Date(Date.parse(parsedModel.timeModified));
      }
      if (!_.isUndefined(parsedModel.timeLastLike) && !_.isDate(parsedModel.timeLastLike)) {
        parsedModel.timeLastLike = new Date(Date.parse(parsedModel.timeLastLike));
      }
      if (!_.isUndefined(parsedModel.timeLastFmLoveShare) && !_.isDate(parsedModel.timeLastFmLoveShare)) {
        parsedModel.timeLastFmLoveShare = new Date(Date.parse(parsedModel.timeLastFmLoveShare));
      }

      console.debug("LikedSongModel Parse Result", parsedModel, resp);
      return parsedModel;
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
    hasLastFmShareStatus: function(flag) {
      return (this.get("lastFmShareStatus") & flag) === flag;
    },
    setLastFmShareStatus: function(flag) {
      var values = {
        lastFmShareStatus: this.get("lastFmShareStatus") | flag
      };
      if (flag === LikedSongModel.LastFmShareStatus.TrackLove) {
          values.timeLastFmLoveShare = new Date();
      }
      this.set(values);
    },
    unsetLastFmShareStatus: function(flag) {
      this.set({
        lastFmShareStatus: this.get("lastFmShareStatus") & flag
      });
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