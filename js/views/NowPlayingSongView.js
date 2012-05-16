define([
    "jquery",
    "backbone",
    "underscore",
    "marionette",
    "linkify",
    "text!templates/nowplaying-song.html"
    ], function($, Backbone, _, Marionette, linkify, ViewTemplate) {
    
    var NowPlayingSongView = Backbone.Marionette.ItemView.extend({
        template: ViewTemplate,
        className: "song",
        serializeData: function() {
            var json = this.model.toJSON();

            if (!_.isEmpty(json.Comments)) {
                json.Comments = linkify(json.Comments, {
                    callback: function(text, href) {
                        console.debug("Linkify: [" + text + "] -> href: " + (href || ""));
                        return href ? '<a href="' + encodeURI(href) + '" data-chrometab="active">' + text + '</a>' : text;
                    }
                });
            }
            return json;
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