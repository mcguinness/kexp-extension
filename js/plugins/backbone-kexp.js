define([
  "jquery",
  "underscore",
  "backbone-replete" // Backbone Plugin
	], function($, _, Backbone) {
    
  _.extend(Backbone.View.prototype, {
    makeAlert: function(alert, heading, message) {

      var alertParams, elParts = [];

      switch (alert ? alert.toLowerCase() : "") {
        case "error" :
          alertParams = { alertClass: "alert-error", iconClass: "fa fa-exclamation-circle"};
          break;
        case "success" :
          alertParams = { alertClass: "alert-success", iconClass: "fa fa-check-circle"};
          break;
        case "info" :
          alertParams = { alertClass: "alert-info", iconClass: "fa fa-info-circle"};
          break;
        default :
          alertParams = { alertClass: "", iconClass: "fa fa-warning-circle"};
          break;
      }

      elParts.push('<div class="alert ' + alertParams.alertClass + '">');
      elParts.push('<button class="close" data-dismiss="alert">×</button>');
      
      if (!_.isEmpty(heading)) {
        elParts.push('<h4 class="alert-heading"><i class="' + alertParams.iconClass +
          '""></i> ' + heading + '</h4>');
      } else {
        elParts.push('<i class="' + alertParams.iconClass + '"></i> ');
      }
      if (!_.isEmpty(message)) {
        elParts.push(message);
      }
      elParts.push('</div>');
      return elParts.join("");
    }
  });

  return Backbone;
});