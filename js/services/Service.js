define([
  "jquery",
  "underscore",
  "marionette-extensions",
  "collections/AppConfigCollection"
  ], function($, _, Backbone, AppConfigCollection) {

    var Service = function() {};
    // Copy the `extend` function used by Backbone's classes
    Service.extend = Backbone.Marionette.Application.extend;

    _.extend(Service.prototype, Backbone.Events, Backbone.Marionette.BindTo, {

      start: function(options) {
        this.options = options || {};
        this.appConfig = options.appConfig || new AppConfigCollection();
        this.vent = options.vent || new Backbone.Marionette.EventAggregator();
        if (this.onStart) { this.onStart(options); }
        this.trigger("start");
      },
      stop: function() {
        if (this.beforeStop) { this.beforeStop(); }
        this.unbindAll();

        if (this.onStop) { this.onStop(); }
        this.trigger("stop");
        this.unbind();
      },
      pipeToVent: function(target, events) {
        this.bindTo(target, events, function() {
          console.debug("Piping event to vent", arguments);
          this.vent.trigger.apply(this, arguments);
        }, this);
      }
    });

    return Service;
});