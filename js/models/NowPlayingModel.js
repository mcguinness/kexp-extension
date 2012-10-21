define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "moment",
  "models/MappingParseModel",
  "models/LikedSongModel"
  ], function($, Backbone, _, moment, MappingParseModel, LikedSongModel) {
  
  var NowPlayingModel = MappingParseModel.extend({
    mappings: [
      {attribute: "id", target: "PlayID", type: "string"},
      {attribute: "airBreak", target: "AirBreak", type: "boolean"},
      {attribute: "songTitle", target: "SongTitle", type: "string", options: {htmlDecode: true}},
      {attribute: "artist", target: "Artist", type: "string", options: {htmlDecode: true}},
      {attribute: "album", target: "Album", type: "string", options: {htmlDecode: true}},
      {attribute: "albumYear", target: "ReleaseYear", type: "string"},
      {attribute: "albumLabel", target: "LabelName", type: "string", options: {htmlDecode: true}},
      {attribute: "comments", target: "Comments", type: "string", options: {htmlDecode: true}},
      {attribute: "timePlayed", target: "TimePlayed", type: "customPacificTimeDate",
        options: {format: "h:mmA", addDate: true}
      },
      {attribute: "timeLastUpdate", target: "LastUpdate", type: "customPacificTimeDate",
        options: {format: "M/D/YYYY h:mm:ss A"}
      }
    ],
    url: function() {
      return "http://www.kexp.org/s/s.aspx?x=3";
    },
    validate: function(attributes) {
      // KEXP feed sometimes returns nulls when there is an error, otherwise expect empty string values for "valid" data
      if (attributes.id === undefined || attributes.id === null) {
        return "id attribute is missing or null";
      }
      // if (attributes.timeLastUpdate === undefined || attributes.timeLastUpdate === null) {
      //   return "timeLastUpdate attribute is missing or null";
      // }
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
      return new LikedSongModel(song);
    }
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