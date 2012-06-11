require.config({
  paths: {
    "backbone": "libs/backbone-min",
    "backbone-kexp": "plugins/backbone-kexp",
    "backbone-localstorage": "libs/backbone-localstorage",
    "backbone-replete": "plugins/backbone-replete",
    "bootstrap": "plugins/bootstrap.min",
    "detectzoom": "util/detectzoom",
    "ga": "https://ssl.google-analytics.com/ga",
    "gaq": "util/google-analytics",
    "htmlencoder": "util/htmlencoder",
    "indexeddb": "libs/backbone-indexeddb",
    "jquery": "libs/jquery-1.7.2.min",
    "jquery-cycle": "plugins/jquery.cycle.all",
    "jquery-kexp": "plugins/jquery-kexp",
    "jquery-ui": "plugins/jquery-ui-1.8.20.custom.min",
    "jquery.dataTables": "plugins/jquery.dataTables.min",
    "jquery.dataTables.sort": "plugins/jquery.dataTables.sort",
    "linkify": "util/ba-linkify",
    "machina": "libs/machina.min",
    "marionette": "libs/backbone.marionette.min",
    "marionette-deferredclose": "plugins/backbone.marionette-deferredclose",
    "marionette-kexp": "plugins/backbone.marionette-kexp",
    "md5": "util/md5",
    "moment": "libs/moment.min",
    "mutation-summary" : "libs/mutation_summary",
    "regexpatterns": "util/regexpatterns",
    "text": "libs/text-min",
    "toastr": "util/toastr",
    "underscore": "libs/underscore-min"
  },
  shim: {
    "bootstrap": ["jquery"],
    "jquery-cycle": ["jquery"],
    "jquery-kexp": ["jquery", "underscore"],
    "jquery-ui": ["jquery"],
    "jquery.dataTables": ["jquery"],
    "jquery.dataTables.sort": ["jquery.dataTables"]
  }
});

require(["jquery", "underscore", "PopupApp", "gaq"], function($, _, PopupApp) {

  // AudioElement is in background page so music plays when popups are not active
  var backgroundPage = chrome.extension.getBackgroundPage();
  var audioElement = backgroundPage.document.getElementById("background-audio");
  var kexpStore = backgroundPage.KexpStore;

  $(document).ready(function() {

    window.KexpApp = PopupApp;

    $(window).on("unload", function() {
        _gaq.push(["_trackEvent", "Application", "Close"]);
    });
    
    window.KexpApp.start({
      audioElement: audioElement,
      popout: $("body").hasClass("popout"),
      appConfig: kexpStore.appConfig,
      appUrl: chrome.extension.getURL("popup.html")
    });
  });
});