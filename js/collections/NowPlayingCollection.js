define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "models/NowPlayingModel"
  ], function($, Backbone, _, NowPlayingModel) {

  var NowPlayingCollection = Backbone.Collection.extend({

    model: NowPlayingModel,
    initialize: function(options) {
      this.limit = (options !== undefined && options.limit) ? options.limit : 10;
    },
    url: function() {
      return "http://www.kexp.org/s/s.aspx?x=3";
    },
    delimit: function(models, options) {
      if (models === undefined) {
        return;
      }
      var overLimitCount = (this.length + models.length) - this.limit;
      var removeModel, lastFmModels, lastFmModel;
      if (overLimitCount > 0) {
        while (overLimitCount--) {
          removeModel = this.at(0);

          // Backbone-relational has a global store!!!
          // It keeps a cache of models and only removes on destroy events (memory leaks).
          // This is hack to cleanup for removed (delimit) models since we are not destroying
          // Consider replacing backbone-relational or finding better design approach

          // We need a copy since we are iterating and removing
          lastFmModels = _.toArray(removeModel.getLastFmCollection());

          this.remove(removeModel);
          console.log("Removed overlimit [>=" + this.limit + "] model from NowPlayingCollection [" + (this.length + 1) + "]", removeModel);

          console.log("LastFM Collection for Remove", lastFmModels);
          _.each(lastFmModels, function(lastFmModel) {
            console.log("Unregistering Relational Store LastFm Model", lastFmModel);
            Backbone.Relational.store.unregister(lastFmModel);
            lastFmModel.unbind();
          });
          console.log("Unregistering Relational Store NowPlaying Model", removeModel);
          Backbone.Relational.store.unregister(removeModel);
          removeModel.unbind();
        }
      }
    },
    fetch: function(options) {
      if (options === undefined) {
        options = {};
      }
      options.delimit = true;
      return Backbone.Collection.prototype.fetch.call(this, options);
    }
  });
  return NowPlayingCollection;
});