define([
  "jquery",
  "underscore",
  "backbone",
  "backbone-localstorage",
  "models/LastFmConfigModel",
  "models/AppFeaturesConfigModel"
  ], function($, _, Backbone, Store, LastFmConfigModel, AppFeaturesConfigModel) {

  var store = new Store("app.kexp.config");
  
  var AppConfigCollection = Backbone.Collection.extend({
    localStorage: store,
    sync: store.sync,
    initialize: function(options) {
      this.fetch();
      // init defaults
      this.getLastFm();
      this.getFeatures();
    },
    parse: function(resp, xhr) {
      var item, models = [];

      if (!_.isArray(resp)) {
        resp = [resp];
      }

      _.each(resp, function(item) {
        if (item.id === "lastfm") {
          models.push(new LastFmConfigModel(item));
        }
        else if (item.id === "features") {
          models.push(new AppFeaturesConfigModel(item));
        }
        else {
          console.error("Unknown config item: " + item.id, item);
          throw new Error("Unknown config item: " + item.id);
        }
      });
      return models;
    },
    getLastFm: function() {
      return this.get("lastfm") || this.create(new LastFmConfigModel());
    },
    getFeatures: function() {
      return this.get("features") || this.create(new AppFeaturesConfigModel());
    }
  });
  return AppConfigCollection;
});