define(["jquery", "underscore"], function($, _) {

  $.fn.loadImage = function(src, cssClass, attribs) {
    return this.each(function () {

      if (_.isEmpty(src)) {
        return this;
      }

      var img = new Image();
      var $el = $(this);
      var $img = $(img)
        .addClass(cssClass || "fade")
        .appendTo($el)
        .hide();

      if (attribs) {
        for (var key in attribs) {
          $img.attr(key, attribs[key]);
        }
      }

      $img.load(function() {
        $img.show().addClass("in");
      });
      $img.attr("src", src);
    });
  };

  $.fn.queueTransition = function(endTransition, timeout) {

    return this.each(function () {
      
      var $el          = $(this),
          transitionId = _.uniqueId("transition"),
          endEvent     = "transitionend.queueTransition",
          timeoutId    = setTimeout(function() {
            //console.log('%s aborted <%s id="%s" class="%s">', transitionId, $el.prop("tagName").toLowerCase(),
            //    $el.prop("id"), $el.prop("className"), $el.queue());
            $el.off(endEvent);
            if (_.isFunction(endTransition)) {
                endTransition();
            }
          }, timeout || 2000);

      $el.queue(function() {
        // console.log('%s queued <%s id="%s" class="%s">', transitionId, $el.prop("tagName").toLowerCase(),
        //   $el.prop("id"), $el.prop("className"), $el.queue());
        $el.one(endEvent, function() {
          clearTimeout(timeoutId);
          $el.off(endEvent);
          $el.dequeue();
          // console.log('%s dequeued <%s id="%s" class="%s">', transitionId, $el.prop("tagName").toLowerCase(),
          //   $el.prop("id"), $el.prop("className"), $el.queue());
          if (_.isFunction(endTransition)) {
            endTransition();
          }
        });
      });
    });
  };
});
