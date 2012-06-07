require.config({
  paths: {
    "jquery": "libs/jquery-1.7.2.min",
    "jquery-ui": "plugins/jquery-ui-1.8.20.custom.min",
    "jquery-kexp": "plugins/jquery-kexp",
    "jquery.dataTables": "plugins/jquery.dataTables.min",
    "jquery.dataTables.sort": "plugins/jquery.dataTables.sort",
    "underscore": "libs/underscore-min",
    "backbone": "libs/backbone-min",
    "backbone-delimit": "plugins/backbone-delimit",
    "backbone-relational": "plugins/backbone-relational",
    "backbone-localstorage": "libs/backbone-localstorage",
    "backbone-kexp": "plugins/backbone-kexp",
    "marionette": "libs/backbone.marionette.min",
    "marionette-deferredclose": "plugins/backbone.marionette-deferredclose",
    "indexeddb": "libs/backbone-indexeddb",
    "machina": "libs/machina.min",
    "text": "libs/text-min",
    "linkify": "util/ba-linkify",
    "htmlencoder": "util/htmlencoder",
    "detectzoom": "util/detectzoom",
    "moment": "libs/moment.min",
    "ga": "https://ssl.google-analytics.com/ga",
    "gaq": "util/google-analytics",
    "lastfm-api": "services/LastFmApi",
    "md5": "util/md5",
    "toastr": "util/toastr",
    "regexpatterns": "util/regexpatterns",
    "bootstrap": "plugins/bootstrap.min",
    "mutation-summary" : "libs/mutation_summary"
  },
  shim: {
    "jquery-ui": ["jquery"],
    "jquery-kexp": ["jquery", "underscore"],
    "jquery.dataTables": ["jquery"],
    "jquery.dataTables.sort": ["jquery.dataTables"],
    "backbone-relational": ["backbone", "underscore", "backbone-delimit"],
    "bootstrap": ["jquery"]
  }
});

require(["jquery", "underscore", "KexpApp", "gaq"], function($, _, KexpApp) {

  // AudioElement is in background page so music plays when popups are not active
  var backgroundPage = chrome.extension.getBackgroundPage();
  var audioElement = backgroundPage.document.getElementById("background-audio");

  // Data attributes are used for anchor tags to seperate chrome hosting environment from app
  var backgroundTab = function(href, active, temp) {
    backgroundPage.chrome.tabs.create({url: href, active: active}, function(tab) {
      if (temp) {
        backgroundPage.setTimeout(function() {
          backgroundPage.chrome.tabs.remove(tab.id);
        }, 3000);
      }
    });
  };

  var chromeTab = function(event) {
    var $link = $(this),
      attrValue = $link.attr("data-chrometab"),
      active = attrValue ? (attrValue === "active") : true,
      temp = (attrValue === "temp"),
      href = $link.attr("href"),
      chromeMatches = href.match(/(chrome-extension):\/\/([\w\.?=%&=\-@\/$,]+)/);

      if (chromeMatches && chromeMatches.length == 3) {
        href = chrome.extension.getURL(chromeMatches[2]);
      }

      _gaq.push(["_trackEvent", "Navigation", "Link", href]);

    if (href) {
      backgroundPage.setTimeout(backgroundTab, 0, href, temp ? false : active, temp);
      return false;
    }
  };


  $(document).ready(function() {

    // Find and convert links that should be opened in new chrome tabs
    $("body").on("click", "a[data-chrometab]", chromeTab);
    $("body").on("click", ".content-external a", chromeTab);

    window.KexpApp = KexpApp;

    // Since event handlers can register with background page, we must close the app on unload
    $(window).on("unload", function() {
        _gaq.push(["_trackEvent", "Application", "Close"]);
        window.KexpApp.close();
        delete window.KexpApp;
    });
    
    window.KexpApp.start({
      audioElement: audioElement,
      popout: $("body").hasClass("popout"),
      appUrl: chrome.extension.getURL("popup.html")
    });
  });
});