define([
  "jquery",
  "underscore",
  "marionette-extensions",
  "linkify",
  "text!templates/nowplaying-song.html",
  "moment"
  ], function($, _, Backbone, linkify, ViewTemplate) {

  var NowPlayingSongView = Backbone.Marionette.ItemView.extend({
    template: ViewTemplate,
    className: "container-nowplaying-song",
    serializeData: function() {
      var json = this.model.toJSON();

      if (_.isDate(this.model.get("timePlayed"))) {
        json.timePlayed = moment.utc(this.model.get("timePlayed")).local().format("h:mm A");
      }

      if (_.isDate(this.model.get("timeLastUpdate"))) {
        // Can't figure out why time is 1 hour off, so hack -1 hour until I figure it out
        json.timeLastUpdate = moment.utc(this.model.get("timeLastUpdate")).local().format("M/D/YYYY h:mm:ss A");
      }

      if (!_.isEmpty(json.comments)) {
        json.comments = linkify(json.comments, {
          callback: function(text, href) {
            console.debug("Linkify: [" + text + "] -> href: " + (href || ""));
            return href ? '<a href="' + encodeURI(href) + '" data-chrometab="active">' + text + '</a>' : text;
          }
        });
      }
      return {
        model: json
      };
    },
    onRender: function() {
      this.$el.hide();
    },
    onShow: function() {
      this.$el.show("slide", {
        direction: "left"
      }, 500);
    }
  });
  return NowPlayingSongView;
});