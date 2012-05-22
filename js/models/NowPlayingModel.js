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
    idAttribute: "PlayID",
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
    parse: function(resp, xhr) {

      var parsedModel = _.clone(resp);
      var self = this;

      // Feed sometimes encodes some values...its hard to determine when
      _.each(resp, function(value, key, list) {
        if (!_.isEmpty(value) && _.isString(value)) {
          parsedModel[key] = self.htmlEncoder.htmlDecode(value);
          if (!_.isEqual(parsedModel[key], value)) {
            console.warn("NowPlayingModel response html value: " + value + " was decoded to : " + parsedModel[key]);
          }
        }
      });

      if (parsedModel.TimePlayed && !_.isEmpty(parsedModel.TimePlayed)) {
        parsedModel.TimePlayed = moment(parsedModel.TimePlayed + "-08:00", "h:mmAZ").local().format("h:mm A");
      }

      if (parsedModel.LastUpdate && !_.isEmpty(parsedModel.LastUpdate)) {
        // Can't figure out why time is 1 hour off, so hack -1 hour until I figure it out
        parsedModel.LastUpdate = moment(parsedModel.LastUpdate + "-08:00", "M/D/YYYY h:mm:ss AZ").local().subtract("hours", 1).format("M/D/YYYY h:mm:ss A");
      }

      console.debug("NowPlayingModel Parse Result", parsedModel, resp);
      return parsedModel;
    },
    url: function() {
      return "http://www.kexp.org/s/s.aspx?x=3";
    },
    validate: function(attributes) {
      if (attributes.LastUpdate === undefined || attributes.LastUpdate === null) {
        return "LastUpdate attribute is missing or null";
      }
      if (attributes.PlayID === undefined || attributes.PlayID === null) {
        return "PlayID attribute is missing or null";
      }
      if (attributes.AirBreak === undefined || attributes.AirBreak === null) {
        return "AirBreak attribute is missing or null";
      }
      if (attributes.Artist === undefined || attributes.Artist === null) {
        return "Artist attribute is missing or null";
      }
      if (attributes.SongTitle === undefined || attributes.SongTitle === null) {
        return "SongTitle attribute is missing or null";
      }
      if (attributes.Album === undefined || attributes.Album === null) {
        return "Album attribute is missing or null";
      }
      if (attributes.ReleaseYear === undefined || attributes.ReleaseYear === null) {
        return "ReleaseYear attribute is missing or null";
      }
      if (attributes.LabelName === undefined || attributes.LabelName === null) {
        return "LabelName attribute is missing or null";
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

      songCollection.fetchSong(this.get("SongTitle"), this.get("Artist"), this.get("Album"), {
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
      return "spotify:search:" + encodeURI('artist:"' + this.get("Artist") + '" album:"' + this.get("Album") + '"');
    },
    toDebugString: function() {
      return "NowPlaying {" + this.id + "} - Artist: {" + this.get("Artist") + "} Album: {" +
      this.get("Album") + "} Song: {" + this.get("SongTitle") + "}";
    },
    toSong: function() {

      var song = {
        artist: this.get("Artist"),
        songTitle: this.get("SongTitle"),
        album: this.get("Album"),
        albumYear: this.get("ReleaseYear"),
        albumLabel: this.get("LabelName")
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