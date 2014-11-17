define(["jquery", "backbone-kexp", "underscore"], function($, Backbone, _) {
  var SpotifyTrackModel = Backbone.Model.extend({

    defaults: {
      message: "Live Stream",
      volume: 10,
      paused: true,
      muted: false,
      disabled: false
    }
  });
  return SpotifyTrackModel;
});