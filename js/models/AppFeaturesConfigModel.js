define(["jquery", "underscore", "backbone", "backbone-localstorage"],
  function($, _, Backbone, Store) {
  
  var AppFeaturesConfigModel = Backbone.Model.extend({

    initialize: function(options) {
      
      options = options || {};

      if (options.localStorage && _.isFunction(options.localStorage.sync)) {
        this.localStorage = options.localStorage;
        this.sync = options.localStorage.sync;
      } else {
        this.localStorage = new Store("app.kexp.config");
        this.sync = this.localStorage.sync;
      }
    },
    defaults: {
      id: "features",
      installVersion: window.chrome.app.getDetails().version,
      hasClickedLike: false
    }
  });
  return AppFeaturesConfigModel;
});