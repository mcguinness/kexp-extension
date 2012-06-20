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