require(["jquery", "underscore", "PopupApp", "gaq"], function($, _, PopupApp) {

  var options = {chromeExtension: (window.chrome && window.chrome.extension)},
      backgroundApp,
      port;

  if (options.chromeExtension) {
    backgroundApp = chrome.extension.getBackgroundPage().KexpBackgroundApp;
    options.audioElement = backgroundApp.audioEl,
    options.appConfig = backgroundApp.appConfig,
    options.nowPlayingCollection = backgroundApp.nowPlayingCollection;
    options.popout = false;
    options.appUrl = chrome.extension.getURL("popup.html");
    port = chrome.extension.connect({name: "kexp.app.view"});
  } else {
    $("body").addClass("popout");
    options.popout = true;
    options.appUrl = window.location.toString();
  }
  
  $(document).ready(function() {
    window.KexpApp = PopupApp;
    window.KexpApp.start(options);
  });
});