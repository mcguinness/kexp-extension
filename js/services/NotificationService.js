define([
  "jquery",
  "underscore",
  "services/Service",
  "toastr"
  ], function($, _, Service, toastr) {

    var NotificationService = Service.extend({
       onStart: function(options) {
        this.notification = toastr;
        _.extend(this.notification.options, {
          containerId: options.notificationContainerId,
          timeOut: 5000
        });

        this.bindTo(this.vent, "notification:success", function(message, title) {
          this.notification.success(message, '<i class="icon-ok-sign"></i> ' + title);
        }, this);
        this.bindTo(this.vent, "notification:info", function(message, title) {
          this.notification.info(message, '<i class="icon-info-sign"></i> ' + title);
        }, this);
        this.bindTo(this.vent, "notification:warning", function(message, title) {
          this.notification.warning(message, '<i class="icon-warning-sign"></i> ' + title);
        }, this);
        this.bindTo(this.vent, "notification:error", function(message, title) {
          this.notification.error(message, '<i class="icon-exclamation-sign"></i> ' + title);
        }, this);

      }
    });

    return NotificationService;
});