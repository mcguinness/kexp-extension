define([
  "jquery",
  "underscore",
  "services/Service",
  "toastr"
  ], function($, _, Service, toastr) {

    var NotificationService = Service.extend({
       
       onStart: function(options) {
        var notification = toastr;
        _.extend(notification.options, {
          containerId: "region-notifications",
          timeOut: 6000,
          toastClass: 'toast kexp-box-striped'
        });

        var showNotification = function(type, message, title) {
          notification.options.positionClass = _.isEmpty(message) ? "notification-fixed-single" : "notification-fixed";
          notification[type](message, title);
        };

        this.bindTo(this.vent, "notification:success", function(message, title) {
          showNotification("success", message, '<i class="fa fa-check-circle"></i> ' + title );
        }, this);
        this.bindTo(this.vent, "notification:info", function(message, title) {
          showNotification("info", message, '<i class="fa fa-info-circle"></i> ' + title );
        }, this);
        this.bindTo(this.vent, "notification:warning", function(message, title) {
          showNotification("warning", message, '<i class="fa fa-warning"></i> ' + title );
        }, this);
        this.bindTo(this.vent, "notification:error", function(message, title) {
          showNotification("error", message, '<i class="fa fa-warning"></i> ' + title );
        }, this);
      },
      toString: function() {
        return "NotificationService";
      }
    });

    return NotificationService;
});