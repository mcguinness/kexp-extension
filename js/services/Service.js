define([
  "jquery",
  "underscore",
  "backbone-kexp",
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
        var self = this;
        this.bindTo(target, events, function() {
          console.debug("Piping event to vent", arguments);
          var args = Array.prototype.slice.call(arguments);
          self.vent.trigger.apply(self.vent, args);
        }, this);
      }
    });

    return Service;
});