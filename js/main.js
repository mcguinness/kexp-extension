require(["jquery", "underscore", "PopupApp", "gaq"], function($, _, PopupApp) {

  var options = {chromeExtension: (window.chrome && window.chrome.extension)},
      backgroundApp,
      handleStart;

  if (options.chromeExtension) {
    backgroundApp = chrome.extension.getBackgroundPage().KexpBackgroundApp;
    //window.console = chrome.extension.getBackgroundPage().console;
    options.liveStreamEl = backgroundApp.liveStreamEl;
    options.appUrl = chrome.extension.getURL("popup.html");

    if(window.location.search.indexOf('popout=true') > 0) {
      $("body").addClass("popout");
    }
    
  } else {
    $("body").addClass("popout");
    options.appUrl = window.location.toString();
  }

  window.KexpApp = new PopupApp();
  
  window.addEventListener("unload", function(e) {

    window.removeEventListener(e.type, arguments.callee);

    console.log("closing popup");
    window.KexpApp.close();
    options = null;
    delete window.KexpApp;

    // Brute-force (aka hacky shit) memory leak cleanup
    window.requirejs.undef();
    window.require = null;
    window.requirejs = null;
    window.define = null;
    window._ = null;
    window.Backbone = null;
    window.$ = null;
    window.jQuery = null
    window.moment = null;
    window.machina = null;
    window._gat = null;
    window._gaq = null;
    window.gaGlobal = null;

  });

  $(document).ready(function() {
    options.popout = $("body").hasClass("popout");
    window.KexpApp.start(options);
  });
});