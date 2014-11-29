define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "text!templates/nav.html",
  ], function($, _, Marionette, ViewTemplate) {
  
  var NavView = Marionette.ItemView.extend({
    el: '#navbar-top',
    tagName: "div",
    className: "navbar-inner",
    template: ViewTemplate,
    initialize: function(options) {
      // Bind before adding hashchange event handler
      _.bindAll(this, 'updateNav');
      
      // Listen for changes for future routes...
      $(window).on('hashchange', this.updateNav);
    },
    onRender: function() {
      this.updateNav();
    },
    updateNav: function() {
      
      var $activeNav = $('ul.nav', this.el).children().filter('.active');
      
      if ($activeNav.length > 0) {
        $activeNav.toggleClass('active', false);
        this.vent.trigger('analytics:trackevent', 'Navigation', 'Route', window.location.hash);
      }

      // Find hash or default
      $activeNav = $('ul.nav', this.el).find('a[href="' + window.location.hash + '"]').parent();
      if ($activeNav.length === 0) {
        $activeNav = $('ul.nav li[data-active=default]', this.el);
      }

      $activeNav.toggleClass('active', true);
    },
    beforeClose: function() {
      $(window).off('hashchange', this.updateNav);
    }
  });
  
  return NavView;
});