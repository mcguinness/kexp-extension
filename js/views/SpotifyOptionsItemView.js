define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "backbone-modelbinder",
  "collections/AppConfigCollection",
  "text!templates/options-spotify.html",
  "bootstrap" // no need for arg
  ], function($, _, Marionette, ModelBinder, AppConfigCollection, ViewTemplate) {
  
  var SpotifyOptionsItemView = Marionette.ItemView.extend({
    
    template: ViewTemplate,
    serviceBoxEl: "#ctrls-spotify-service",

    initialize: function(options) {
      this._modelBinder = new Backbone.ModelBinder();
    },
    events: {
      "click #btn-spotify-service": "handleAuthorizationToggle",
      "click #chkbx-spotify-share-like": "handleLikeShareCheck",
    },
    onRender: function() {
      var convertAuthzButtonClass = function(direction, value) {
            return _.isEmpty(value) ? "" : "active";
          },
          convertAuthzButtonHtml = function(direction, value) {
            return _.isEmpty(value) ?
              '<i class="fa fa-user"> Disabled</i>' :
              '<i class="fa fa-user"> Enabled</i>';
          },
          convertCheckboxDisable = function(direction, value) {
            return _.isEmpty(value);
          },
          bindings = { // Order is important, checkbox selectors will also match sessionKey selector (Fixed in next release)
            likeShareEnabled: {selector: "#chkbx-spotify-share-like"},
            refreshToken: [
              {selector: "#btn-spotify-service", elAttribute: "class", converter: convertAuthzButtonClass},
              {selector: "#btn-spotify-service", elAttribute: "html", converter: convertAuthzButtonHtml},
              {selector: "#ctrls-spotify-features input[type=checkbox]", elAttribute: "disabled", converter: convertCheckboxDisable}
            ]
          };

      this._modelBinder.bind(this.model, this.$el, bindings);
      $("#btn-spotify-service").button();
    },
    serializeData: function() {
      return { model: this.model.toJSON()};
    },
    requestAuthorization: function() {
      var self = this,
          $ctrlBox = $(this.serviceBoxEl);
          $btn = $("#btn-spotify-service");

      $btn.attr('disabled', 'disabled');

      this.model.requestAuthorization().done(function() {
        $ctrlBox.append(self.makeAlert("success", "Success!", "Spotify app authorization is complete!"));
        self.vent.trigger("analytics:trackevent", "Feature", "SpotifyAuthorization", "Enabled");
      }).fail(function(error) {
        $ctrlBox.append(self.makeAlert("error", "Authorization Failed!",
          "Unable to authorize the extension due to error <em>" + error + "</em>"));
        self.vent.trigger("analytics:trackevent", "Feature", "SpotifyAuthorization", "Error", error);
      }).always(function() {
        $btn.removeAttr("disabled");
      });
    },
    removeAuthorization: function() {
      this.model.disableAuthorization();
      this.vent.trigger("analytics:trackevent", "Feature", "SpotifyAuthorization", "Disabled");
    },
    handleAuthorizationToggle: function(event) {
      $(this.serviceBoxEl).find("div.alert").remove();
      $(event.currentTarget).hasClass("active") ? this.removeAuthorization() : this.requestAuthorization();
    },
    handleLikeShareCheck: function(event) {
      var checked = $(event.currentTarget).is(":checked");
      this.vent.trigger("analytics:trackevent", "Feature", "SpotifyLikeShare", checked ? "Enabled" : "Disabled");
    }
  });

  return SpotifyOptionsItemView;
});