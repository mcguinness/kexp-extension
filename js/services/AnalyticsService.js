define([
  "jquery",
  "underscore",
  "services/Service",
  "gaq"
  ], function($, _, Service, _gaq) {

    var AnalyticsService = Service.extend({
      onStart: function(options) {
        this.bindTo(this.vent, "analytics:trackevent", this.handleTrackEvent, this);
      },
      handleTrackEvent: function(category, action, label, value, noninteraction) {
        // console.debug("Sending tacking event for category: {%s} action: {%s} label: {%s} value: {%s}",
        //   category, action, label, value);
        
        var eventParams = ["_trackEvent"];

        eventParams.push(_.isEmpty(category) ? "Application" : category);
        eventParams.push(_.isEmpty(action) ? "Unknown" : action);
        eventParams.push(_.isEmpty(label) ? null : label);
        eventParams.push(_.isEmpty(value) ? null : value);
        //eventParams.push(_.isEmpty(noninteraction) ? "" : noninteraction);

        _.defer(function() {
          window._gaq.push(eventParams);
        });
      }
    });

    return AnalyticsService;
});