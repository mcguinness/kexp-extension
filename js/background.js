require.config({
  paths: {
    "gaq": "util/google-analytics"
  }
});

require(["gaq"], function(gaq) {
    console.log("background page loaded.");
});