define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "collections/AppConfigCollection"
  ], function($, _, Marionette, AppConfigCollection) {

    var Service = function() {};
    // Copy the `extend` function used by Backbone's classes
    Service.extend = Marionette.Application.extend;

    _.extend(Service.prototype, Backbone.Events, Marionette.BindTo, {

      start: function(options) {
        this.options = options || {};
        this.appConfig = options.appConfig || new AppConfigCollection();
        this.vent = options.vent || new Marionette.EventAggregator();
        if (this.onStart) { this.onStart(options); }
        this.trigger("start");
      },
      stop: function() {
        if (this.beforeStop) { this.beforeStop(); }
        this.unbindAll();

        if (this.onStop) { this.onStop(); }
        this.trigger("stop");
        this.unbind();
      }
    });

    return Service;
});