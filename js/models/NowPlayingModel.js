define([
  "jquery",
  "backbone-relational",
  "underscore",
  "moment",
  "models/LastFmModel",
  "models/LikedSongModel",
  "collections/LikedSongCollection",
  "collections/LastFmCollection"
  ], function($, Backbone, _, moment, LastFmModel, LikedSongModel, LikedSongCollection, LastFmCollection) {
  
  var NowPlayingModel = Backbone.RelationalModel.extend({
    //idAttribute: "PlayID",
    relations: [
      {
        type: Backbone.HasMany,
        collectionType: LastFmCollection,
        key: "relLastFmMeta",
        relatedModel: LastFmModel
      },
      {
        type: Backbone.HasOne,
        key: "relLiked",
        relatedModel: LikedSongModel
      }
    ],
    intialize: function() {

    },
    toJSON: function() {
      var json = Backbone.Model.prototype.toJSON.call(this);
      json.timePlayed = this.get("timePlayed").toISOString();
      json.timeLastUpdate = this.get("timeLastUpdate").toISOString();
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
            console.warn("NowPlayingModel response html value: " + value + " was decoded to : " + parsedModel[key]);
          }
        }
      });


      console.debug("NowPlayingModel Parse Result", parsedModel, resp);
      return parsedModel;
    },
    url: function() {
      return "http://www.kexp.org/s/s.aspx?x=3";
    },
    validate: function(attributes) {
      if (attributes.timeLastUpdate === undefined || attributes.timeLastUpdate === null) {
        return "timeLastUpdate attribute is missing or null";
      }
      if (attributes.id === undefined || attributes.id === null) {
        return "id attribute is missing or null";
      }
    },
    getLikedSong: function() {
      return this.get("relLiked");
    },
    setLikedSong: function(model) {
      this.set("relLiked", model);
    },
    getLastFmCollection: function() {
      return this.get("relLastFmMeta");
    },
    resolveLikedSong: function() {
      var self = this,
        songCollection = new LikedSongCollection(),
        resolveDeferred = $.Deferred(),
        likedSong;

      songCollection.fetchSong(this.get("songTitle"), this.get("artist"), this.get("album"), {
        success: function(collection, resp) {
          likedSong = collection.first();
          if (likedSong) {
            console.debug("Resolved liked song for now playing model", likedSong, self);
            self.set("relLiked", likedSong);
          }
          resolveDeferred.resolve(likedSong);
        },
        error: function(collection, error, options) {
          // Error "should" not happen
          console.warn("Error resolving liked song for now playing model", self, collection, error, options);
          resolveDeferred.reject(error, options);
        }
      });

      return resolveDeferred.promise();
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

      _.each(this.getLastFmCollection().models, function(lastfmModel) {
        if (lastfmModel.isArtist()) {
          song.artistMbid = lastfmModel.get("mbid") || "";
          song.artistLastFmUrl = lastfmModel.get("url") || "";
        } else if (lastfmModel.isAlbum()) {
          song.albumMbid = lastfmModel.get("mbid") || "";
          song.albumLastFmUrl = lastfmModel.get("url") || "";
        }
      });

      return new LikedSongModel(song);
    }
  });
  return NowPlayingModel;
});