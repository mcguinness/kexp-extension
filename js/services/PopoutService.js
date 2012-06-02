define([
  "jquery",
  "underscore",
  "services/Service",
  "detectzoom",
  "mutation-summary"
  ], function($, _, Service, DetectZoom) {

    var PopoutService = Service.extend({
      onStart: function(options) {
        _.bindAll(this, "domObserver");

        if (!options.popout && options.appUrl && window.WebKitMutationObserver) {
          this.popoutUrl = options.appUrl;
          this.popoutContainerId = "#footer";
          this.bindPopout();
        }

        if (options.popout && window.WebKitMutationObserver) {
                  console.log("^Width: Outer:[%s] Inner:[%s] Document:[%s] DocElement: [%s] Client:[%s] Body:[%s] Offset:[%s]",
            window.outerWidth, window.innerWidth, window.document.width, $(window.document.documentElement).width(), window.document.documentElement.clientWidth, window.document.body.clientWidth, window.document.body.offsetWidth);
         window.resizeBy(window.outerWidth - window.document.width, 0);


          window.resizeBy((window.innerWidth - document.documentElement.clientWidth), 0);

          this.popoutResizeObserver = new MutationSummary({
           callback: this.domObserver,
           observeOwnChanges: true,
           queries: [{
             element: '*',
             elementAttributes: 'clientWidth clientHeight'
           }]
          });
        }
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
          width = window.outerWidth + 1;
          height = window.outerHeight;
          // TODO: Resolve why multi-monitor doesn't work for left offsets...
          left = (screen.width / 2) - (width / 2);
          top = (screen.height / 2) - (height / 2);

          targetWin = window.open(self.popoutUrl + window.location.hash, "", "width="+width+",height="+height+",top="+top+",left="+left);
          targetWin.addEventListener("DOMContentLoaded", function() {
            $(targetWin.document.body).addClass("popout");
          });
          self.vent.trigger("analytics:trackevent", "Navigation", "Popout");
        });
        $containerPopout.appendTo(this.popoutContainerId);
      },
      domObserver: function(summary) {

        // Browser Page Zoom makes dynamic sizing of window a bitch....
        // Luckily this dude made a cool abstraction
       
        var zoom = DetectZoom.zoom(),
          windowWidth = window.outerWidth,
          windowHeight = window.outerHeight,
          viewportHeight = window.innerHeight,
          documentHeight = $(document.documentElement).height(),
          viewportHeightDelta = Math.round((viewportHeight - documentHeight) * zoom),
          width = (window.innerWidth === document.width) ? window.outerWidth :
            document.width  + (window.innerWidth - document.documentElement.clientWidth),
          height = Math.round(documentHeight * zoom),
          element,
          foundSkipElement;
          

        console.log("Width: Outer:[%s] Inner:[%s] Document:[%s] DocElement: [%s] Client:[%s] Body:[%s] Offset:[%s]",
            window.outerWidth, window.innerWidth, window.document.width, $(window.document.documentElement).width(), window.document.documentElement.clientWidth, window.document.body.clientWidth, window.document.body.offsetWidth);

        console.log("Height: Outer:[%s] Inner:[%s] Document:[%s] DocumentElement: [%s] Client:[%s] Body:[%s]",
          windowHeight, viewportHeight, document.height, documentHeight, document.documentElement.clientHeight, document.body.clientHeight);

        // Hacky Optimization (could break if browser/assumptions change)
        // These elements are observed on addition and cause unnecessary resizing of window the messes up look and feel
        // Skip em... we will get another callback to handle required resize when song-footer is rendered.
        
        if (summary.length > 0 && summary[0].added.length > 0) {
          foundSkipElement = _.find(summary[0].added, function(element) {
            switch (element.className) {
              case "container-player" :
                return true;
              case "song" :
                return true;
              case "container-nowplaying-meta" :
                return true;
              default :
                return false;
            }
          });
          if (foundSkipElement) {
            console.log("Skipping resizing for element", foundSkipElement, summary);
            viewportHeightDelta = 0;
          }
        }


        // if (this.prevViewportHeight && this.prevDocumentHeight) {
        //   if (this.prevViewportHeight === viewportHeight && this.prevDocumentHeight === height) {
        //     console.log("Skipping resizing, no delta", summary);
        //     viewportHeightDelta = 0;
        //   }
        // }
        // this.prevViewportHeight = viewportHeight;
        // this.prevDocumentHeight = height;

        
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
            windowWidth, windowHeight, width, height, zoom, summary);
          window.resizeTo(width, height);
        }
      }
    });

    return PopoutService;
});