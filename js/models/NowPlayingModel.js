define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "moment",
  "models/LikedSongModel",
  "collections/LastFmCollection"
  ], function($, Backbone, _, moment, LikedSongModel, LastFmCollection) {
  
  var NowPlayingModel = Backbone.Model.extend({

    intialize: function(options) {

    },
    toJSON: function() {
      var json = Backbone.Model.prototype.toJSON.call(this);
      
      json.timePlayed = _.isDate(this.get("timePlayed")) ?
        this.get("timePlayed").toISOString() :
        "";
      json.timeLastUpdate = _.isDate(this.get("timeLastUpdate")) ?
        this.get("timeLastUpdate").toISOString() :
        "";
      
      return json;
    },
    parse: function(resp, xhr) {

      var parsedModel = {
          id: resp.PlayID,
          airBreak: resp.AirBreak || false,
          songTitle: resp.SongTitle,
          artist: resp.Artist,
          album: resp.Album || "",
          albumYear: resp.ReleaseYear || "",
          albumLabel: resp.LabelName || "",
          comments: resp.Comments || "",
          timePlayed: resp.TimePlayed,
          timeLastUpdate: resp.LastUpdate
        },
        key, value, self = this, nowUtc = moment.utc();


      if (parsedModel.timePlayed && !_.isEmpty(parsedModel.timePlayed)) {
        value = moment(parsedModel.timePlayed + "-08:00", "h:mmAZ").utc();
        value.month(nowUtc.month());
        value.date(nowUtc.date());
        value.year(nowUtc.year());
        // Can't figure out why time is 1 hour off, so hack -1 hour until I figure it out..DST???
        value.subtract("hours", 1);
        parsedModel.timePlayed = value.toDate();
      }

      if (parsedModel.timeLastUpdate && !_.isEmpty(parsedModel.timeLastUpdate)) {
        // Can't figure out why time is 1 hour off, so hack -1 hour until I figure it out..DST???
        parsedModel.timeLastUpdate = moment(parsedModel.timeLastUpdate + "-08:00", "M/D/YYYY h:mm:ss AZ").subtract("hours", 1).utc().toDate();
      }
      
      // Feed sometimes encodes some values...its hard to determine when
      _.each(["songTitle", "artist", "album", "albumLabel", "comments"], function(key) {
        value = parsedModel[key];
        if (!_.isEmpty(value) && _.isString(value)) {
          parsedModel[key] = self.htmlEncoder.htmlDecode(value);
          if (!_.isEqual(parsedModel[key], value)) {
            console.log("[NowPlayingModel HtmlDecode] response value: " + value + " was decoded to : " + parsedModel[key]);
          }
        }
      });

      //console.debug("NowPlayingModel Parse Result", parsedModel, resp);
      return parsedModel;
    },
    url: function() {
      return "http://www.kexp.org/s/s.aspx?x=3";
    },
    validate: function(attributes) {
      // KEXP feed sometimes returns nulls when there is an error, otherwise expect empty string values for "valid" data
      if (attributes.id === undefined || attributes.id === null) {
        return "id attribute is missing or null";
      }
      if (attributes.timeLastUpdate === undefined || attributes.timeLastUpdate === null) {
        return "timeLastUpdate attribute is missing or null";
      }
      if (attributes.songTitle === undefined || attributes.songTitle === null) {
        return "songTitle attribute is missing or null";
      }
      if (attributes.artist === undefined || attributes.artist === null) {
        return "artist attribute is missing or null";
      }
    },
    hasLikedSong: function() {
      return _.isObject(this.likedSong);
    },
    getLastFmLikedSongAttributes: function() {

      var lastfmModel, track, attributes = {}, self = this;

      _.each(this.lastFmMeta.models, function(lastfmModel) {
        if (lastfmModel.isArtist()) {
          attributes.artistMbid = lastfmModel.get("mbid") || "";
          attributes.artistLastFmUrl = lastfmModel.get("url") || "";
        }
        else if (lastfmModel.isAlbum()) {
          attributes.albumMbid = lastfmModel.get("mbid") || "";
          attributes.albumLastFmUrl = lastfmModel.get("url") || "";
          track = lastfmModel.getTrack(self.get("songTitle"), self.get("album"), self.get("artist"));
          if (track) {
            attributes.trackMbid = track.mbid || "";
            attributes.trackLastFmUrl = track.url || "";
            attributes.trackDownloadUrl = track.downloadurl || "";
          }
        }
      });

      return attributes;
    },
    toSpotifyUrl: function() {
      return "spotify:search:" + encodeURI('artist:"' + this.get("artist") + '" album:"' + this.get("album") + '"');
    },
    toDebugString: function() {
      return "NowPlaying {" + this.id + "} - Artist: {" + this.get("artist") + "} Album: {" +
      this.get("album") + "} Song: {" + this.get("songTitle") + "}";
    },
    toSong: function() {

      var song = {
        artist: this.get("artist"),
        songTitle: this.get("songTitle"),
        album: this.get("album"),
        albumYear: this.get("albumYear"),
        albumLabel: this.get("albumLabel")
      };
      
      _.extend(song, this.getLastFmLikedSongAttributes());
      return new LikedSongModel(song);
    }
  });

  Object.defineProperty(NowPlayingModel.prototype, "lastFmMeta", {
    get: function() {
      if (_.isUndefined(this._lastFmCollection)) {
        this._lastFmCollection = new LastFmCollection();
      }
      return this._lastFmCollection;
    },
    enumerable : true,
    configurable : false
  });

  Object.defineProperty(NowPlayingModel.prototype, "frozenAttributeKeys", {
    value: ["id", "album", "artist", "songTitle", "timePlayed"],
    writable: false,
    enumerable : true,
    configurable : false
  });

  Object.defineProperty(NowPlayingModel.prototype, "amendableAttributeKeys", {
    value: ["albumYear", "albumLabel", "comments"],
    writable: false,
    enumerable : true,
    configurable : false
  });


  return NowPlayingModel;
});