define([
  "jquery",
  "underscore",
  "services/Service",
  "detectzoom"
  ], function($, _, Service, DetectZoom) {

    
    var PopoutService = Service.extend({
      onStart: function(options) {
        _.bindAll(this, "addPopoutBodyClass", "domObserver");

        if (!options.popout && options.appUrl && window.WebKitMutationObserver) {
          this.popoutUrl = options.appUrl;
          this.popoutContainerId = "#footer";
          this.bindPopout();
        }

        if (options.popout && window.WebKitMutationObserver) {
          // console.log("!Width: Outer:[%s] Inner:[%s] Document:[%s] DocElement: [%s] Client:[%s] Body:[%s]",
          //   window.outerWidth, window.innerWidth, window.document.width, $(window.document.documentElement).width(),
          //   window.document.documentElement.clientWidth, window.document.body.clientWidth);
          
          this.zoom = DetectZoom.zoom();

          // Set initial window width to include browser chrome (window width should not change after this)
          window.resizeBy((window.outerWidth - window.document.width) * this.zoom, 0);

          this.popoutResizeObserver = new WebKitMutationObserver(this.domObserver);
          this.popoutResizeObserver.observe(document.querySelector("#region-content"), {
            attributes: false,
            subtree: true,
            childList: true,
            characterData: false
          });
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
          
        // console.log("Width: Outer:[%s] Inner:[%s] Document:[%s] DocumentElement: [%s] Client:[%s] Body:[%s]",
        //   windowWidth, viewportWidth, document.width, documentWidth, document.documentElement.clientWidth, document.body.clientWidth);
        // console.log("Height: Outer:[%s] Inner:[%s] Document:[%s] DocumentElement: [%s] Client:[%s] Body:[%s]",
        //   windowHeight, viewportHeight, document.height, documentHeight, document.documentElement.clientHeight, document.body.clientHeight);


        // Hacky Optimization (could break if browser/assumptions change)
        // These elements are observed on addition and cause unnecessary resizing of window the messes up look and feel

        // jQuery UI Slide Effect should create the following pattern
        // Animation Start:
        //  Add: 2 x div.container-nowplaying-song + 1 x div.ui-effects-wrapper
        //  Remove: 1 x div.container-nowplaying-song
        // Animation End:
        //  Add: 1 x div.container-nowplaying-song
        //  Remove: 1 x div.container-nowplaying-song + 1 x div.ui-effects-wrapper

        var metaAddMutation = false;
        slideAddMutations = _.chain(mutations)
          .pluck("addedNodes")
          .filter(function(nodeList) {
            return _.find(nodeList, function(node) {
              //console.log('Mutation add element: <%s id="%s" class="%s">', node.tagName, node.id, node.className);
              if (node.tagName === "DIV") {
                switch (node.className) {
                  case "ui-effects-wrapper" :
                    return true;
                  case "container-nowplaying-song" :
                    return true;
                  case "container-nowplaying-meta" :
                    metaAddMutation = true;
                    return false;
                  default :
                    return false;
                }
              }
            });
          })
          .value();

        slideRemoveMutations = _.chain(mutations)
          .pluck("addedNodes")
          .filter(function(nodeList) {
            return _.find(nodeList, function(node) {
              //console.log('Mutation remove element: <%s id="%s" class="%s">', node.tagName, node.id, node.className);
              return (node.tagName === "DIV" && node.className === "container-nowplaying-song");
            });
          })
          .value();

        if ((slideAddMutations.length >= 3 && slideRemoveMutations.length > 0) || metaAddMutation) {
          //console.log("Skipping resizing for animation element mutations");
          viewportHeightDelta = 0;
        }
        
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
            windowWidth, windowHeight, width, height, this.zoom);
          window.resizeTo(windowWidth, height);
        }
      }
    });

    return PopoutService;
});