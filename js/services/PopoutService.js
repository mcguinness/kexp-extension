define([
  "jquery",
  "underscore",
  "services/Service",
  "mutation-summary",
  "detectzoom"
  ], function($, _, Service, MutationSummary, DetectZoom) {

    
    var PopoutService = Service.extend({
      onStart: function(options) {
        _.bindAll(this, "addPopoutBodyClass", "domObserver");

        if (!options.popout && options.appUrl && window.WebKitMutationObserver) {
          this.popoutUrl = options.appUrl;
          this.popoutContainerId = "#footer";
          this.bindPopout();
        }

        if (options.popout && window.WebKitMutationObserver) {
          console.log("!Width: Outer:[%s] Inner:[%s] Document:[%s] DocElement: [%s] Client:[%s] Body:[%s]",
            window.outerWidth, window.innerWidth, window.document.width, $(window.document.documentElement).width(),
            window.document.documentElement.clientWidth, window.document.body.clientWidth);
          
          // Set initial window width to include browser chrome (window width should not change after this)
          window.resizeBy(window.outerWidth - window.document.width, 0);

          this.zoom = DetectZoom.zoom();

          this.popoutResizeObserver = new WebKitMutationObserver(this.domObserver);
          this.popoutResizeObserver.observe(document.querySelector("#region-content"), {
            attributes: false,
            subtree: true,
            childList: true,
            characterData: false
          });

          // Mutation-Summary library causes memory leaks in background page, disabling and using raw mutations

          // this.popoutResizeObserver = new MutationSummary({
          //  callback: this.domObserver,
          //  rootNode: window.document.body,
          //  observeOwnChanges: true,
          //  queries: [{
          //    element: '*'
          //  }]
          // });
        }
      },
      onStop: function() {
        if (this.popoutResizeObserver) {
          this.popoutResizeObserver.disconnect();
          delete this.popoutResizeObserver;
        }
      },
      addPopoutBodyClass: function() {
        var self = this;

        $(this.popoutWindow.document.body).addClass("popout");

        _.delay(function() {
          self.popoutWindow.removeEventListener("DOMContentLoaded", self.addPopoutBodyClass);
        }, 1000);

      },
      bindPopout: function() {
        var $containerPopout,
          width,
          height,
          left,
          top,
          targetWin,
          $targetWin,
          self = this;

        $containerPopout = $('<div class="container-footer-popout"><span><i class="icon-fullscreen"></i> Popout</span></div>');
        $containerPopout.click(function() {
          width = window.outerWidth;
          height = window.outerHeight;
          // TODO: Resolve why multi-monitor doesn't work for left offsets...
          left = Math.round((screen.width / 2) - (width / 2));
          top = Math.round((screen.height / 2) - (height / 2));

          self.popoutWindow = window.open(self.popoutUrl + window.location.hash, "", "width="+width+",height="+height+",top="+top+",left="+left);
          self.popoutWindow.addEventListener("DOMContentLoaded", self.addPopoutBodyClass);
          self.vent.trigger("analytics:trackevent", "Navigation", "Popout");
        });
        $containerPopout.appendTo(this.popoutContainerId);
      },
      domObserver: function(mutations) {

        // Browser Page Zoom makes dynamic sizing of window a bitch....
        // Luckily this dude made a cool abstraction
       
        var windowWidth = window.outerWidth,
          windowHeight = window.outerHeight,
          viewportWidth = window.innerWidth,
          viewportHeight = window.innerHeight,
          $docEl = $(document.documentElement),
          documentWidth = $docEl.width(),
          documentHeight = $docEl.height(),
          viewportHeightDelta = Math.round((viewportHeight - documentHeight) * this.zoom),
          width = (viewportWidth === document.width) ? windowWidth :
            document.width + Math.round(((viewportWidth - document.documentElement.clientWidth) * this.zoom)),
          height = Math.round(documentHeight * this.zoom),
          skipMutations,
          nodeList,
          node,
          element,
          foundSkipElement;
          
        console.log("Width: Outer:[%s] Inner:[%s] Document:[%s] DocumentElement: [%s] Client:[%s] Body:[%s]",
          windowWidth, viewportWidth, document.width, documentWidth, document.documentElement.clientWidth, document.body.clientWidth);
        console.log("Height: Outer:[%s] Inner:[%s] Document:[%s] DocumentElement: [%s] Client:[%s] Body:[%s]",
          windowHeight, viewportHeight, document.height, documentHeight, document.documentElement.clientHeight, document.body.clientHeight);


        // Hacky Optimization (could break if browser/assumptions change)
        // These elements are observed on addition and cause unnecessary resizing of window the messes up look and feel
        // Skip em... we will get another callback to handle required resize when song-footer is rendered.
        
        skipMutations = _.chain(mutations)
          .pluck("addedNodes")
          .filter(function(nodeList) {
            return _.find(nodeList, function(node) {
              return (node.className === "container-nowplaying-song") ||
                (node.className === "container-nowplaying-meta");
            });
          })
          .value();

        if (skipMutations.length > 0) {
          console.log("Skipping resizing for element mutations", skipMutations, mutations);
          viewportHeightDelta = 0;
        }


        // if (mutations.length > 0 && mutations[0].added.length > 0) {
        //   foundSkipElement = _.find(mutations[0].added, function(element) {
        //     switch (element.className) {
        //       case "container-player" :
        //         return true;
        //       case "song" :
        //         return true;
        //       case "container-nowplaying-meta" :
        //         return true;
        //       default :
        //         return false;
        //     }
        //   });
        //   if (foundSkipElement) {
        //     console.log("Skipping resizing for element", foundSkipElement, mutations);
        //     viewportHeightDelta = 0;
        //   }
        // }
        
        if (viewportHeightDelta > 0) {
          height += windowHeight - (viewportHeightDelta + height);
        }
        else if (viewportHeightDelta < 0) {
          height = (-viewportHeightDelta) + windowHeight;
        }
        else {
          height = windowHeight;
        }

        if (windowHeight !== height) {
          console.log("Resizing window [%s x %s] to [%s x %s] with zoom: %s",
            windowWidth, windowHeight, width, height, this.zoom, mutations);
          window.resizeTo(windowWidth, height);
        }
      }
    });

    return PopoutService;
});