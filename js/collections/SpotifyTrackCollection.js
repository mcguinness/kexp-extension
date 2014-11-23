define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "models/SpotifyTrackModel"
  ], function($, Backbone, _, SpotifyTrackModel) {

  var SpotifyTrackCollection = Backbone.Collection.extend({

    model: SpotifyTrackModel,
    url: function() {
      return "https://api.spotify.com/v1/search";
    },
    parse: function(resp, xhr) {
      return resp.tracks.items;
    },
  });
  return SpotifyTrackCollection;
});