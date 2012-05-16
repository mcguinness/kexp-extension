define(["jquery", "backbone", "underscore"], function($, Backbone, _) {
  var PlayerModel = Backbone.Model.extend({

    defaults: {
      message: "Live Stream",
      volume: 10,
      paused: true,
      muted: false,
      disabled: false
    }
  });
  return PlayerModel;
});