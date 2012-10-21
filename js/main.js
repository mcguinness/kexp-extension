require(["jquery", "underscore", "PopupApp", "gaq"], function($, _, PopupApp) {

  var options = {chromeExtension: (window.chrome && window.chrome.extension)},
      backgroundApp,
      handleStart;

  if (options.chromeExtension) {
    backgroundApp = chrome.extension.getBackgroundPage().KexpBackgroundApp;
    //window.console = chrome.extension.getBackgroundPage().console;
    options.liveStreamEl = backgroundApp.liveStreamEl;
    options.appUrl = chrome.extension.getURL("popup.html");
    
  } else {
    $("body").addClass("popout");
    options.appUrl = window.location.toString();
  }

  window.KexpApp = PopupApp;
  window.addEventListener("unload", function() {
    console.log("closing popup");
    delete window.KexpApp;
  });

  $(document).ready(function() {
    options.popout = $("body").hasClass("popout");
    window.KexpApp.start(options);
  });
});