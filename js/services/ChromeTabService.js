define([
  "jquery",
  "underscore",
  "services/Service"
  ], function($, _, Service) {

    var ChromeTabService = Service.extend({
     
      onStart: function(options) {
        _.bindAll(this, "handleLinkClick");
        
        this.backgroundPage = chrome.extension.getBackgroundPage();

        $("body").on("click.chrometab", "a[data-chrometab]", this.handleLinkClick);
        $("body").on("click.chrometab-external", ".content-external a", this.handleLinkClick);
      },
      onStop: function() {
        $("body").off("click.chrometab", "a[data-chrometab]", this.handleLinkClick);
        $("body").off("click.chrometab-external", ".content-external a", this.handleLinkClick);
      },
      createTab: function(href, active, temp) {
        chrome.tabs.create({url: href, active: active}, function(tab) {
          if (temp) {
            setTimeout(function() {
              chrome.tabs.remove(tab.id);
            }, 3000);
          }
        });
      },
      handleLinkClick: function(event) {
        var $link = $(event.currentTarget),
          attrValue = $link.attr("data-chrometab"),
          active = attrValue ? (attrValue === "active") : true,
          temp = (attrValue === "temp"),
          href = $link.attr("href"),
          chromeMatches = href.match(/(chrome-extension):\/\/([\w\.?=%&=\-@\/$,]+)/);

        if (chromeMatches && chromeMatches.length == 3) {
          href = chrome.extension.getURL(chromeMatches[2]);
        }

        this.vent.trigger("analytics:trackevent", "Navigation", "Link", "href");

        if (href) {
          console.debug("Creating tab for [%s]", href);
          // Open tab in background page window by setting a timer
          this.backgroundPage.setTimeout(this.createTab, 0, href, temp ? false : active, temp);
          return false;
        }
      },
      toString: function() {
        return "ChromeTabService";
      }
    });

    return ChromeTabService;
});