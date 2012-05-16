require.config({
  paths: {
    "jquery": "libs/jquery-1.7.2.min",
    "jquery-ui": "libs/jquery-ui-1.8.20.custom.min",
    "jquery-kexp": "plugins/jquery-kexp",
    "underscore": "libs/underscore",
    "backbone": "libs/backbone",
    "backbone-extensions": "plugins/backbone.extensions",
    "backbone-relational": "libs/Backbone-relational",
    "marionette": "libs/backbone.marionette",
    "marionette-extensions": "plugins/backbone.marionette.extensions",
    "indexeddb": "libs/backbone-indexeddb",
    "machina": "libs/machina",
    "text": "libs/text",
    "linkify": "util/ba-linkify",
    "htmlencoder": "util/htmlencoder",
    "moment": "libs/moment.min",
    "ga": "https://ssl.google-analytics.com/ga",
    "gaq": "util/google-analytics",
    // Non AMD
    "twitter": "https://platform.twitter.com/widgets",
    // Non AMD
    "jquery.dataTables": "libs/jquery.dataTables",
    "jquery.dataTables.sort": "plugins/jquery.dataTables.sort",
    // Non AMD
    "bootstrap": "libs/bootstrap/bootstrap"
  }
});

require(["jquery", "underscore", "backbone", "KexpApp", "gaq"], function($, _, Backbone, KexpApp) {

  // AudioElement is in background page so music plays when popups are not active
  var backgroundPage = chrome.extension.getBackgroundPage();
  var audioElement = backgroundPage.document.getElementById("background-audio");

  
  var backgroundTab = function(href, active, temp) {
    backgroundPage.chrome.tabs.create({url: href, active: active}, function(tab) {
      if (temp) {
        backgroundPage.setTimeout(function() {
          backgroundPage.chrome.tabs.remove(tab.id);
        }, 3000);
      }
    });
  };

  var chromeTab = function() {
    var $link = $(this),
      attrValue = $link.attr("data-chrometab"),
      active = attrValue ? (attrValue === "active") : true,
      temp = (attrValue === "temp"),
      href = $link.attr("href");

      _gaq.push(["_trackEvent", "Link", "navigate", href]);

    if (href) {
      backgroundPage.setTimeout(backgroundTab, 0, href, temp ? false : active, temp);
    }
  };

  $(document).ready(function() {

    // Find and convert links that should be opened in new chrome tabs
    $("body").on("click", "a[data-chrometab]", chromeTab);
    $("body").on("click", ".content-external a", chromeTab);

    window.KexpApp = KexpApp;
    $(window).on("unload", function() {
        window.KexpApp.close();
    });
    window.KexpApp.start({
      audioElement: audioElement
    });
  });
});