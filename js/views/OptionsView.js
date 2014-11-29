define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "collections/AppConfigCollection",
  "views/LastFmOptionsItemView",
  "views/SpotifyOptionsItemView",
  "text!templates/options.html"
  ], function($, _, Marionette, AppConfigCollection,
    LastFmOptionsItemView, SpotifyOptionsItemView, ViewTemplate) {

  var OptionsView = Marionette.CompositeView.extend({
    tagName: "div",
    className: "view-options kexp-box kexp-box-striped",
    template: ViewTemplate,
    initialize: function(options) {

    },
    getItemView: function() {
      return {};
    },
    buildItemView: function(item, ItemView){
      var view;

      switch (item.id.toLowerCase()) {
        case "lastfm" :
          view = new LastFmOptionsItemView({
            vent: this.vent,
            appConfig: this.appConfig,
            model: item,
            collection: this.collection
          });
          break;
        case "spotify" :
          view = new SpotifyOptionsItemView({
            vent: this.vent,
            appConfig: this.appConfig,
            model: item,
            collection: this.collection
          });
          break;
        default :
          throw new Error("Unable to determine view for item " + item.id)
      }

      return view;
    },
    addItemView: function(item, ItemView) {
      // Features currently doesn't have a view, so skip
      if (item.id === "features") return;
      Marionette.CollectionView.prototype.addItemView.call(this, item, ItemView);
    },
    appendHtml: function(collectionView, itemView) {
      collectionView.$("#container-options fieldset").append(itemView.el);
    }
  });
  return OptionsView;
});