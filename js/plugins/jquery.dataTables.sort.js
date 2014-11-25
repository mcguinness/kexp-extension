define(["jquery", "datatables"], function($) {
  if ($.fn.dataTableExt.oSort['num-html-asc'] === undefined) {
    $.fn.dataTableExt.oSort['num-html-asc'] = function(a, b) {
      var x = a.replace(/<.*?>/g, "");
      var y = b.replace(/<.*?>/g, "");
      x = parseFloat(x);
      y = parseFloat(y);
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    };
  }

  if ($.fn.dataTableExt.oSort['num-html-desc'] === undefined) {
    $.fn.dataTableExt.oSort['num-html-desc'] = function(a, b) {
      var x = a.replace(/<.*?>/g, "");
      var y = b.replace(/<.*?>/g, "");
      x = parseFloat(x);
      y = parseFloat(y);
      return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    };
  }
});
