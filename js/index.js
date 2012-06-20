require(["jquery"], function($) {
  $(document).ready(function() {
    $("#logo").click(function() {
      var width = 580;
      var height = 400;
      var left = Math.round((screen.width / 2) - (width / 2));
      var top = Math.round((screen.height / 2) - (height / 2));

      window.open("./popup.html", "", "width="+width+",height="+height+",top="+top+",left="+left);
    });
  });
});