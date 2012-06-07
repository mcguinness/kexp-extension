define(["jquery", "underscore"], function($, _) {

  $.fn.loadImage = function(src, cssClass, attribs) {
    return this.each(function () {

      if (_.isEmpty(src)) {
        return this;
      }

      var img = new Image();
      var $el = $(this);
      var $img = $(img)
        .addClass(cssClass || "")
        .appendTo($el)
        .hide();

      if (attribs) {
        for (var key in attribs) {
          $img.attr(key, attribs[key]);
        }
      }

      $img.load(function() {
        $img.fadeIn();
      });
      $img.attr("src", src);
    });
  };

  $.fn.queueTransition = function(endTransition) {

    return this.each(function () {
      var thisStyle = (document.body || document.documentElement).style,
        isSupported = (thisStyle.transition !== undefined || thisStyle.WebkitTransition !== undefined ||
          thisStyle.MozTransition !== undefined || thisStyle.MsTransition !== undefined || thisStyle.OTransition !== undefined),
        endEvent, $el = $(this);

      if (isSupported) {
        endEvent = (function() {
          var transitionEnd = "TransitionEnd";
          if ($.browser.webkit) {
            transitionEnd = "webkitTransitionEnd";
          } else if ($.browser.mozilla) {
            transitionEnd = "transitionend";
          } else if ($.browser.opera) {
            transitionEnd = "oTransitionEnd";
          }
          return transitionEnd;
        }()) + ".queueTransition";

        $el.queue(function() {
          console.log('transition queued <%s id="%s" class="%s">', $el.prop("tagName").toLowerCase(),
            $el.prop("id"), $el.prop("className"), $el.queue());
          $el.one(endEvent, function() {
            $el.dequeue();
            console.log('transition dequeued <%s id="%s" class="%s">', $el.prop("tagName").toLowerCase(),
              $el.prop("id"), $el.prop("className"), $el.queue());
            if (_.isFunction(endTransition)) {
              endTransition();
            }
            $el.off(endEvent);
          });
        });
      }
    });
  };
});
