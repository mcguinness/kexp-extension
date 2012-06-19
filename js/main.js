require.config({
  paths: {
    "backbone": "libs/backbone-min",
    "backbone-kexp": "plugins/backbone-kexp",
    "backbone-indexeddb": "libs/backbone-indexeddb",
    "backbone-localstorage": "libs/backbone-localstorage",
    "backbone-modelbinder": "plugins/Backbone.ModelBinder.min",
    "backbone-replete": "plugins/backbone-replete",
    "bootstrap": "plugins/bootstrap.min",
    "detectzoom": "util/detectzoom",
    "ga": "https://ssl.google-analytics.com/ga",
    "gaq": "util/google-analytics",
    "htmlencoder": "util/htmlencoder",
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

  var chromeExtension = (window.chrome && window.chrome.extension),
      backgroundPage,
      audioElement,
      kexpStore,
      appUrl;
  
  if (chromeExtension) {
    // AudioElement is in background page so music plays when popups are not active
    backgroundPage = chrome.extension.getBackgroundPage();
    audioElement = backgroundPage.document.getElementById("background-audio");
    kexpStore = backgroundPage.KexpStore;
    appUrl = chrome.extension.getURL("popup.html");
  } else {
    $("body").addClass("popout");
    kexpStore = {};
    appUrl = window.location.toString();
  }
  
  $(document).ready(function() {

    window.KexpApp = PopupApp;

    $(window).on("unload", function() {
        _gaq.push(["_trackEvent", "Application", "Close"]);
    });
    
    window.KexpApp.start({
      chromeExtension: chromeExtension,
      audioElement: audioElement,
      popout: $("body").hasClass("popout"),
      appConfig: kexpStore.appConfig,
      appUrl: appUrl
    });
  });
});