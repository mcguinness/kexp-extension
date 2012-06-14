define([
  "jquery",
  "backbone-kexp",
  "underscore"
  ], function($, Backbone, _) {

  var LastFmModel = Backbone.Model.extend({

    parseEntity: function(entity) {
      var result = {
        mbid: entity.mbid || "",
        url: entity.url || "",
        id: entity.id || entity.url || "",
        name: entity.name || ""
      };

      if (entity.image) {
        result.images = _.chain(_.isArray(entity.image) ? entity.image : [entity.image])
          .filter(function(image) {
            return (!_.isEmpty(image["#text"]) && !_.isEmpty(image["size"]));
          })
          .map(function(image) {
            return {
              url: image["#text"],
              size: image["size"]
            };
          })
          .value();
      }

      if (entity.tracks && entity.tracks.track) {
        result.tracks = _.chain(_.isArray(entity.tracks.track) ? entity.tracks.track : [entity.tracks.track])
          .map(function(track) {
            var mapped = _.pick(track, "artist", "mbid", "name", "url", "downloadurl");
            if (track["@attr"])  mapped.rank = track["@attr"].rank;
            return mapped;
          })
          .value();
      }

      if (entity.wiki && entity.wiki.summary) {
        result.summary = entity.wiki.summary;
        result.content = entity.wiki.content;
      } else if (entity.bio && entity.bio.summary) {
        result.summary = entity.bio.summary;
        result.content = entity.bio.content;
      }

      return result;
    },
    parse: function(resp, xhr) {
      if (_.isEmpty(resp)) {
        console.error("LastFmModel cannot parse an empty response.", xhr);
        throw new Error("Model cannot parse an empty response");
      }

      var parsedModel;

      if (resp.album) {
        parsedModel = this.parseEntity(resp.album);
        parsedModel.entity = "album";
      } else if (resp.artist) {
        parsedModel = this.parseEntity(resp.artist);
        parsedModel.entity = "artist";
      } else {
        console.error("LastFmModel cannot parse response to a known entity", resp);
        throw new Error("Model cannot parse response to a known entity");
      }
      //console.debug("LastFmModel Parse Result", parsedModel, resp);
      return parsedModel;
    },
    isAlbum: function() {
      return (this.get("entity") === "album");
    },
    isArtist: function() {
      return (this.get("entity") === "artist");
    },
    fetchAlbum: function(artist, album) {

      var fetchDfr = $.Deferred();
      var options = {
        conditions: {
          entity: "album",
          artist: artist,
          album: album
        }
      };
      if (_.isEmpty(artist)) {
        fetchDfr.reject(this, "Artist name is empty", options);
        return fetchDfr.promise();
      } else if (_.isEmpty(album)) {
        fetchDfr.reject(this, "Album name is empty", options);
        return fetchDfr.promise();
      } else {
        return this.fetch(options);
      }
    },
    fetchArtist: function(artist) {

      var fetchDfr = $.Deferred();
      var options = {
        conditions: {
          entity: "artist",
          artist: artist
        }
      };

      if (_.isEmpty(artist)) {
        fetchDfr.reject(this, "Artist name is empty", options);
        return fetchDfr.promise();
      } else {
        return this.fetch(options);
      }
    },
    getImageBySize: function(sizeSort) {

      var images = this.get("images"),
        image;

      if (!_.isArray(images)) {
        return void 0;
      }

      if (!_.isArray(sizeSort)) {
        sizeSort = ["large", "medium", "small"];
      } else {
        _.each(sizeSort, function(element, index, list) {
          list[index] = element.toLowerCase();
        });
      }

      image = _.chain(images)
        .filter(function(image) {
          return _.any(sizeSort, function(size) {
            return image.size === size;
          });
        })
        .sortBy(function(image) {
          return _.indexOf(sizeSort, image.size);
        })
        .first()
        .value();

      return image;
    },
    getTrack: function(trackName, artistName, albumName) {
      if (_.isEmpty(trackName) || _.isEmpty(artistName) || _.isEmpty(albumName)) { return void 0; }
      
      var tracks = this.get("tracks"),
        modelName = this.get("name") || "";

      if (tracks && this.isAlbum() && modelName.toLowerCase() === albumName.toLowerCase()) {
        return _.find(tracks, function(track) {
          return (track.name && track.name.toLowerCase() === trackName.toLowerCase() &&
            _.isObject(track.artist) && track.artist.name.toLowerCase() === artistName.toLowerCase());
        });
      }

      return void 0;
    }
  });
  return LastFmModel;
});