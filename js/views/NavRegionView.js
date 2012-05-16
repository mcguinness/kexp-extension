define([
  "jquery",
  "backbone",
  "underscore",
  "marionette",
  "gaq"
  ], function($, Backbone, _, Marionette, _gaq) {
  
  var NavRegionView = Backbone.Marionette.Region.extend({
    el: "#navbar-top",
    initialize: function(options) {
      // Bind before adding hashchange event handler (bug)
      _.bindAll(this, "updateNav");
      
      $("ul.nav li", this.el).hover(this.toggleActiveNav, this.toggleActiveNav);
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
      _gaq.push(["_trackEvent", "Nav", window.location.hash]);

      var $activeNav = $("ul.nav", this.el).children().filter(".active");
      $activeNav.toggleClass("active", false);
      $activeNav.find("i").toggleClass("icon-white", false);

      $activeNav = $("ul.nav", this.el).find("a[href=" + window.location.hash + "]").parent();
      $activeNav.toggleClass("active", true);
      $activeNav.find("i").toggleClass("icon-white", true);
    },
    beforeClose: function() {
      $(window).off("hashchange", this.updateNav);
    }
  });
  
  return NavRegionView;
});