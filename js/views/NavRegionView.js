define([
  "jquery",
  "backbone",
  "underscore",
  "marionette"
  ], function($, Backbone, _, Marionette) {
  
  var NavRegionView = Backbone.Marionette.Region.extend({
    el: "#navbar-top",
    initialize: function(options) {
      // Bind before adding hashchange event handler
      _.bindAll(this, "updateNav");
      
      $("ul.nav li", this.el).hover(this.toggleActiveNav, this.toggleActiveNav);
      
      // Initialize
      this.updateNav();
      // Listen for changes for future routes...
      $(window).on("hashchange", this.updateNav);
    },
    toggleActiveNav: function() {
      // keep target element "this" context for this handler (no bind)
      var $navHover = $(this);
      if (!$navHover.hasClass("active")) {
        $navHover.find("i").toggleClass("icon-white");
      }
    },
    updateNav: function() {
      
      var $activeNav = $("ul.nav", this.el).children().filter(".active");
      
      if ($activeNav.length > 0) {
        $activeNav.toggleClass("active", false);
        $activeNav.find("i").toggleClass("icon-white", false);
        // TODO: Pass vent as init option
        window.KexpApp.vent.trigger("analytics:trackevent", "Navigation", "Route", window.location.hash);
      }

      // Find hash or default
      $activeNav = $("ul.nav", this.el).find("a[href=" + window.location.hash + "]").parent();
      if ($activeNav.length === 0) {
        $activeNav = $('ul.nav li[data-active=default]', this.el);
      }

      $activeNav.toggleClass("active", true);
      $activeNav.find("i").toggleClass("icon-white", true);
    },
    beforeClose: function() {
      $(window).off("hashchange", this.updateNav);
    }
  });
  
  return NavRegionView;
});