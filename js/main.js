require(["jquery", "underscore", "PopupApp", "gaq"], function($, _, PopupApp) {

  var options = {chromeExtension: (window.chrome && window.chrome.extension)},
      backgroundApp,
      port;

  if (options.chromeExtension) {
    backgroundApp = chrome.extension.getBackgroundPage().KexpBackgroundApp;
    options.liveStreamEl = backgroundApp.liveStreamEl,
    options.appConfig = backgroundApp.appConfig,
    options.nowPlayingCollection = backgroundApp.nowPlayingCollection;
    options.appUrl = chrome.extension.getURL("popup.html");
    port = chrome.extension.connect({name: "kexp.app.view"});
  } else {
    $("body").addClass("popout");
    options.appUrl = window.location.toString();
  }
  
  $(document).ready(function() {
    window.KexpApp = PopupApp;
    options.popout = $("body").hasClass("popout");
    window.KexpApp.start(options);
  });
});