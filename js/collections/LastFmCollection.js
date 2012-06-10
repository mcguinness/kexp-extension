define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "models/LastFmModel"
  ], function($, Backbone, _, LastFmModel) {
  var LastFmCollection = Backbone.Collection.extend({
    model: LastFmModel,
    url: function() {
      // Replaced by Sync Module but Backbone fetch with throw if empty
      return "http://ws.audioscrobbler.com/2.0/";
    },
    getImageBySort: function(sortList) {

      sortList = sortList || [
        {
        entity: "album",
        imageSort: ["large", "medium", "small"]
      },
        {
        entity: "artist",
        imageSort: ["extralarge", "large", "medium", "small"]
      }
      ];

      _.each(sortList, function(sortEntry) {
        sortEntry.entity = sortEntry.entity.toLowerCase();
      });

      return _.chain(this.models)
        .filter(function(model) {
          return _.any(sortList, function(sortEntry) {
            return model.get("entity") === sortEntry.entity;
          });
        })
        .sortBy(function(model) {
          for (var index = 0; index < sortList.length; index++) {
            if (model.get("entity") === sortList[index].entity) {
              return index;
            }
          }
          return imageSort.length + 1;
        })
        .map(function(model) {
          var sortEntry = _.find(sortList, function(sortEntry) {
            return model.get("entity") === sortEntry.entity;
          });
          return {
            model: model,
            image: model.getImageBySize(sortEntry.imageSort)
          };
        })
        .find(function(tuple) {
          return (tuple.image !== undefined);
        })
        .value();
    },
    getOrFetchAlbum: function(artist, album) {

      var self = this,
        fetchDfr = $.Deferred();
      var albumModel = _.find(this.models, function(model) {
        return model.isAlbum();
      });

      if (albumModel) {
        fetchDfr.resolve(albumModel);
      } else {
        albumModel = new LastFmModel();
        albumModel.fetchAlbum(artist, album)
          .done(function(model, resp) {
            self.add(model);
            fetchDfr.resolve(model, resp);
          })
          .fail(function(model, error, options) {
            console.info("fetch album error [%s] for [%s] by artist [%s]", error, album, artist);
            fetchDfr.reject(model, error, options);
          });
      }
      return fetchDfr.promise();
    },
    getOrFetchArtist: function(artist) {

      var self = this,
        fetchDfr = $.Deferred();
      var artistModel = _.find(this.models, function(model) {
        return model.isArtist();
      });

      if (artistModel) {
        fetchDfr.resolve(artistModel);
      } else {
        artistModel = new LastFmModel();
        artistModel.fetchArtist(artist)
          .done(function(model, resp) {
            self.add(model);
            fetchDfr.resolve(model, resp);
          })
          .fail(function(model, error, options) {
            console.info("fetch artist error [%s] for artist [%s]", error, artist);
            fetchDfr.reject(model, error, options);
          });
      }
      return fetchDfr.promise();
    }
  });
  return LastFmCollection;
});