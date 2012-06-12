define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "models/NowPlayingModel"
  ], function($, Backbone, _, NowPlayingModel) {

  var NowPlayingCollection = Backbone.Collection.extend({

    model: NowPlayingModel,
    initialize: function(models, options) {
      _.bindAll(this, "delimit");
      
      this.limit = (_.isObject(options) && options.limit) ? options.limit : 10;
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
          console.log("Removed overlimit [>=%s] model [%s] from NowPlayingCollection [%s]",
            this.limit, removeModel.toDebugString(), (this.length + 1));
        }
      }
    },
    fetch: function(options) {
      options || (options = {});
      options.delimit = true;
      return Backbone.Collection.prototype.fetch.call(this, options);
    }
  });
  return NowPlayingCollection;
});