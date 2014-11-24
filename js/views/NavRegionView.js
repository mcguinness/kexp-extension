define([
  "jquery",
  "underscore",
  "marionette-kexp"
  ], function($, _, Marionette) {
  
  var NavRegionView = Marionette.Region.extend({
    el: "#navbar-top",
    initialize: function(options) {
      // Bind before adding hashchange event handler
      _.bindAll(this, "updateNav");
      
      // Initialize
      this.updateNav();
      // Listen for changes for future routes...
      $(window).on("hashchange", this.updateNav);
    },
    updateNav: function() {
      
      var $activeNav = $("ul.nav", this.el).children().filter(".active");
      
      if ($activeNav.length > 0) {
        $activeNav.toggleClass("active", false);
        this.vent.trigger("analytics:trackevent", "Navigation", "Route", window.location.hash);
      }

      // Find hash or default
      $activeNav = $("ul.nav", this.el).find("a[href=" + window.location.hash + "]").parent();
      if ($activeNav.length === 0) {
        $activeNav = $('ul.nav li[data-active=default]', this.el);
      }

      $activeNav.toggleClass("active", true);
    },
    beforeClose: function() {
      $(window).off("hashchange", this.updateNav);
    }
  });
  
  return NavRegionView;
});