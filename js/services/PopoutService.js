define([
  "jquery",
  "underscore",
  "services/Service",
  "detectzoom"
  ], function($, _, Service, detectZoom) {
    
    var PopoutService = Service.extend({
      onStart: function(options) {
        if (!options.popout && options.appUrl) {
          this.popoutUrl = options.appUrl;
          this.popoutContainerId = "#footer";
          this.bindPopout();
        }

        if (options.popout) {
          // console.log("!Width: Outer:[%s] Inner:[%s] Document:[%s] DocElement: [%s] Client:[%s] Body:[%s]",
          //   window.outerWidth, window.innerWidth, window.document.width, $(window.document.documentElement).width(),
          //   window.document.documentElement.clientWidth, window.document.body.clientWidth);
          
          this.defaultWindowTitle = options.defaultWindowTitle || window.document.title;
          this.bindTo(this.vent, "nowplaying:cycle", this.updateWindowTitle, this);
        }
      },
      onStop: function() {
        $('#btn-popout').remove();
      },
      bindPopout: function() {
        var $containerPopout,
          width,
          height,
          left,
          top,
          self = this;

        $containerPopout = $('<div id="btn-popout" class="container-footer-popout"><i class="fa fa-arrows-alt"></i> Popout</span></div>');
        $containerPopout.click(function() {
          width = window.outerWidth + (window.navigator.platform === "Win32" ? 5 : 0);
          height = window.outerHeight + (window.navigator.platform === "Win32" ? 37 : 5);
          // TODO: Resolve why multi-monitor doesn't work for left offsets...
          left = Math.round((screen.width / 2) - (width / 2));
          top = Math.round((screen.height / 2) - (height / 2));

          self.popoutWindow = window.open(self.popoutUrl + '?popout=true' + window.location.hash, '', 'width='+width+',height='+height+',top='+top+',left='+left);
          self.vent.trigger('analytics:trackevent', 'Navigation', 'Popout');
        });
        $containerPopout.appendTo(this.popoutContainerId);
      },
      updateWindowTitle: function(nowPlayingModel) {
        var title;
        if (_.isObject(nowPlayingModel)) {
          title = "KEXP Now Playing: ";
          var songTitle = nowPlayingModel.get("songTitle");
          if (!_.isEmpty(songTitle)) {
            songTitle = "“" + songTitle + "”";
          }
          var artist = nowPlayingModel.get("artist");

          if (!_.isEmpty(songTitle) && !_.isEmpty(artist)) {
            title += artist + " - " + songTitle;
          } else {
            title += _.isEmpty(artist) ? songTitle : artist;
          }
        } else {
          title = this.defaultWindowTitle;
        }

        window.document.title = title;
      },
      toString: function() {
        return "PopoutService";
      }
    });

    return PopoutService;
});