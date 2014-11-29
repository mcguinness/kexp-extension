define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "backbone-localstorage",
  "models/LastFmConfigModel",
  "models/SpotifyConfigModel",
  "models/AppFeaturesConfigModel"
  ], function($, _, Backbone, Store, LastFmConfigModel, SpotifyConfigModel, AppFeaturesConfigModel) {

  var STORAGE_KEY = 'app.kexp.config.item';

  var AppConfigCollection = Backbone.Collection.extend({

    localStorage: new Backbone.LocalStorage(STORAGE_KEY),
    
    initialize: function(models, options) {
     
      var legacyConfig = null,
          legacyLastFmModel = null;

      try {
        legacyConfig = window.localStorage.getItem('app.kexp.config');
        if (_.isString(legacyConfig)) {
          legacyConfig = JSON.parse(legacyConfig);
          legacyLastFmModel = new LastFmConfigModel(legacyConfig.lastfm);
          legacyLastFmModel.save();
          window.localStorage.removeItem('app.kexp.config');
        }
      } catch (e) {
        // Best-effort
      }
       
      this.add(legacyLastFmModel ? legacyLastFmModel : new LastFmConfigModel());
      this.add(new SpotifyConfigModel());
      this.add(new AppFeaturesConfigModel());

      _.each(this.models, function(model) {
        model.fetch();
      });
      
    },
    parse: function(resp, xhr) {
      var models = [];

      if (!_.isArray(resp)) {
        resp = [resp];
      }

      _.each(resp, function(item) {

        switch (item.id.toLowerCase()) {
          case "lastfm" :
            models.push(new LastFmConfigModel(item));
            break;
          case "spotify" :
            models.push(new SpotifyConfigModel(item));
            break;
          case "features" :
            models.push(new AppFeaturesConfigModel(item));
            break;
          default :
            console.error("Unknown config item: " + item.id, item);
            throw new Error("Unknown config item: " + item.id);
        }
      });
      return models;
    },
    getLastFm: function() {
      return this.get("lastfm");
    },
    getSpotify: function() {
      return this.get("spotify");
    },
    getFeatures: function() {
      return this.get("features");
    }
  });
  return AppConfigCollection;
});