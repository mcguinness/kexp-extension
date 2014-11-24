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
    localStorage: new Backbone.LocalStorage("app.kexp.config.item"),

    defaults: {
      id: "features",
      installVersion: INSTALL_VERSION,
      hasClickedLike: false
    }
  });
  return AppFeaturesConfigModel;
});