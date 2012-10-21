define([
  "jquery",
  "underscore",
  "services/Service"
  ], function($, _, Service) {

    var PopoverCleanupService = Service.extend({
      popoverEl: "#navbar-top",
      onStart: function(options) {
        _.bindAll(this, "handleRouteChange");
        $(window).on("hashchange", this.handleRouteChange);
      },
      onStop: function() {
        $(window).off("hashchange", this.handleRouteChange);
      },
      handleRouteChange: function() {
        // Nasty Hack: Since we have very limited screen size w/popups, we use the nav bar to bind a popup on bottom.
        // Cleanup any open popups on navigate;
        var data = $(this.popoverEl).data();
        if (data && data.popover) {
          data.popover.hide();
          delete data.popover;
        }
      },
      toString: function() {
        return "PopoverCleanupService";
      }
    });

    return PopoverCleanupService;
});