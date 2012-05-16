define([
  "jquery",
  "backbone",
  "underscore",
  "text!templates/about.html",
  "marionette",
  "twitter"
  ], function($, Backbone, _, template) {
  
  var AboutView = Backbone.View.extend({
    tagName: "div",
    initialize: function(options) {

      this.template = _.template(template);
      _.bindAll(this, "render");
    },
    render: function() {
      $(this.el).html(this.template());
      return this;
    }
  });
  return AboutView;
});