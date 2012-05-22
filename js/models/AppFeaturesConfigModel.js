define(["jquery", "underscore", "backbone", "backbone-localstorage"],
  function($, _, Backbone, Store) {
  
  var store = new Store("app.kexp.config");

  var AppFeaturesConfigModel = Backbone.Model.extend({
    localStorage: store,
    sync: store.sync,
    defaults: {
      id: "features",
      installVersion: window.chrome.app.getDetails().version,
      hasClickedLike: false
    }
  });
  return AppFeaturesConfigModel;
});