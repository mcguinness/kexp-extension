define(["jquery", "underscore", "backbone-kexp", "backbone-localstorage"],
  function($, _, Backbone, Store) {
  
  // TODO: Not used yet, figure out what to do in non-chrome extension host
  // Currently its there incase we need migrations in the future
  var INSTALL_VERSION = "1.7";
  var chromeAppDetails;
  if (window.chrome && window.chrome.app && _.isFunction(window.chrome.app.getDetails)) {
    chromeAppDetails = window.chrome.app.getDetails();
    if (_.isObject(chromeAppDetails) && !_.isEmpty(chromeAppDetails.version)) {
      INSTALL_VERSION = chromeAppDetails.version;
    }
  }

  var AppFeaturesConfigModel = Backbone.Model.extend({

    initialize: function(attributes, options) {
      
      options || (options = {});
      // TODO: Move to common module
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
      installVersion: INSTALL_VERSION,
      hasClickedLike: false
    }
  });
  return AppFeaturesConfigModel;
});