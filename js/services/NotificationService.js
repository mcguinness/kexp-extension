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
          timeOut: 0//5000
        });

        var showNotification = function(type, message, title) {
          notification.options.positionClass = _.isEmpty(message) ? "notification-fixed-single" : "notification-fixed";
          notification[type](message, title);
        };

        this.bindTo(this.vent, "notification:success", function(message, title) {
          showNotification("success", message, '<i class="icon-ok-sign"></i> ' + title);
        }, this);
        this.bindTo(this.vent, "notification:info", function(message, title) {
          showNotification("info", message, '<i class="icon-info-sign"></i> ' + title);
        }, this);
        this.bindTo(this.vent, "notification:warning", function(message, title) {
          showNotification("warning", message, '<i class="icon-warning-sign"></i> ' + title);
        }, this);
        this.bindTo(this.vent, "notification:error", function(message, title) {
          showNotification("error", message, '<i class="icon-exclamation-sign"></i> ' + title);
        }, this);
      }
    });

    return NotificationService;
});