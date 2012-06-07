define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "models/NowPlayingModel"
  ], function($, Backbone, _, NowPlayingModel) {

  var NowPlayingCollection = Backbone.Collection.extend({

    model: NowPlayingModel,
    initialize: function(options) {
      _.bindAll(this, "delimit");
      
      this.limit = (options !== undefined && options.limit) ? options.limit : 1;
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
          this.remove(removeModel);
          console.log("Removed overlimit [>=" + this.limit + "] model from NowPlayingCollection [" + (this.length + 1) + "]", removeModel);
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