require.config({
  paths: {
    "backbone": "libs/backbone-min",
    "backbone-kexp": "plugins/backbone-kexp",
    "backbone-indexeddb": "libs/backbone-indexeddb",
    "backbone-localstorage": "libs/backbone-localstorage",
    "backbone-replete": "plugins/backbone-replete",
    "gaq": "util/google-analytics",
    "htmlencoder": "util/htmlencoder",
    "jquery": "libs/jquery-1.7.2.min",
    "moment": "libs/moment.min",
    "underscore": "libs/underscore-min"
  }

});

require([
  "collections/AppConfigCollection",
  "gaq"
  ], function(AppConfigCollection, gaq) {
    
    var store = {
        appConfig: new AppConfigCollection()
    };

    // Save any config changes
    store.appConfig.on("change", function(model) {
      console.debug("Configuration model {%s} value has changed, saving changes...", model.id, JSON.stringify(model));
      model.save();
    }, this);

    window.KexpStore = store;
    console.log("background page loaded.");
});