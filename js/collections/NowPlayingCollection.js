define([
  "jquery",
  "backbone",
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
      var removedModel;
      if (overLimitCount > 0) {
        while (overLimitCount--) {
          removedModel = this.shift();
          console.log("Removed overlimit [>=" + this.limit + "] model from NowPlayingCollection [" + this.length + "]", removedModel);
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