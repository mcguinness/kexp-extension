require([
  "collections/AppConfigCollection",
  "gaq"
  ], function(AppConfigCollection, gaq) {
    
    var store = {
        appConfig: new AppConfigCollection()
    };
    store.appConfig.getDefaults();

    // Save any config changes
    store.appConfig.on("change", function(model) {
      console.debug("Configuration model {%s} value has changed, saving changes...", model.id, JSON.stringify(model));
      model.save();
    }, this);

    window.KexpStore = store;
    console.log("background page loaded.");
});