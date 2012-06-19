define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "backbone-modelbinder",
  "services/LastFmApi",
  "collections/AppConfigCollection",
  "text!templates/options-lastfm.html",
  "bootstrap" // no need for arg
  ], function($, _, Marionette, ModelBinder, LastFmApi, AppConfigCollection, ViewTemplate) {
  
  var LastFmOptionsItemView = Marionette.ItemView.extend({
    
    template: ViewTemplate,
    modalEl: "#modal-lastfm-authorize",
    serviceBoxEl: "#ctrls-lastfm-service",

    initialize: function(options) {
      this._lastFmApi = new LastFmApi();
      this._modelBinder = new Backbone.ModelBinder();
    },
    events: {
      "click #btn-lastfm-service": "handleAuthorizationToggle",
      "click #chkbx-lastfm-share-like": "handleLikeShareCheck",
      "click #chkbx-lastfm-scrobble-like": "handleLikeScrobbleCheck",
      "click #modal-lastfm-authorize button.accept": "acceptAuthorization"
    },
    onRender: function() {
      var convertAuthzButtonClass = function(direction, value) {
            return _.isEmpty(value) ? "" : "active";
          },
          convertAuthzButtonHtml = function(direction, value) {
            return _.isEmpty(value) ?
              '<i class="icon-user icon-white"></i> Disabled' :
              '<i class="icon-user"></i> Enabled';
          },
          convertCheckboxDisable = function(direction, value) {
            return _.isEmpty(value);
          },
          bindings = { // Order is important, checkbox selectors will also match sessionKey selector
            likeShareEnabled: {selector: "#chkbx-lastfm-share-like"},
            likeScrobbleEnabled: {selector: "#chkbx-lastfm-scrobble-like"},
            sessionKey: [
              {selector: "#btn-lastfm-service", elAttribute: "class", converter: convertAuthzButtonClass},
              {selector: "#btn-lastfm-service", elAttribute: "html", converter: convertAuthzButtonHtml},
              {selector: "#ctrls-lastfm-features input[type=checkbox]", elAttribute: "disabled", converter: convertCheckboxDisable}
            ]
          };

      this._modelBinder.bind(this.model, this.$el, bindings);
      $("#btn-lastfm-service").button();
    },
    serializeData: function() {
      return { model: this.model.toJSON()};
    },
    requestAuthorization: function(token) {
      var authzUrl = this.model.get("authUrl");
      authzUrl += "?api_key=" + this.model.get("apiKey");
      authzUrl += "&token=" + token;

      window.open(authzUrl);
      
      // chrome.tabs.create({
      //   url: authzUrl,
      //   active: true
      // });

      // Requires Tab Permissions
      // var currentTabId, authzTabId, self = this;

      // chrome.tabs.getCurrent(function(currentTab) {
      //   currentTabId = currentTab.id;

      //   chrome.tabs.create({
      //     url: authUrl,
      //     active: true
      //   },
      //   function(authzTab) {
      //     authzTabId = authzTab.id;
      //     chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
      //       console.log("removing tab: %s", tabId);
      //       if (tabId == authzTabId) {
      //         console.log("activating options tab");
      //         chrome.tabs.update(currentTabId, {active:true});
      //       }
      //     });
      //   });

      // });
    },
    acceptAuthorization: function() {
      var $authzModal = $(this.modalEl),
        token = $authzModal.data("token"),
        $ctrlBox = $(this.serviceBoxEl),
        self = this;

      $authzModal.modal("hide");

      this._lastFmApi.getAuthSession(token)
        .then(
          function(resp) {
            console.log("[LastFm GetAuthSession Success]", resp);
            $ctrlBox.append(self.makeAlert("success", "Success!", "Last.fm app authorization is complete!"));
            self.addSession(resp.session);
          },
          function(resp, error) {
            console.log("[LastFm GetAuthSession Fail] {Error: %s}", resp.message, resp);
            if (error === 14) { // Token not authorized
              $ctrlBox.append(self.makeAlert("error", "Authorization Failed!", "Did you give permission to this extension?"));
            } else {
              $ctrlBox.append(self.makeAlert("error", "Authorization Failed!",
                "Unable to authorize the extension due to Last.fm error <em>" + resp.message + "</em>"));
            }
            self.vent.trigger("analytics:trackevent", "Feature", "LastFmAuthorization", "Error", error);
          });
    },
    addSession: function(session) {
      this.model.enableAuthorization(session.key, session.name);
      this.vent.trigger("analytics:trackevent", "Feature", "LastFmAuthorization", "Enabled");
    },
    removeSession: function() {
      this.model.disableAuthorization();
      this.vent.trigger("analytics:trackevent", "Feature", "LastFmAuthorization", "Disabled");
    },
    showAuthzModal: function() {
      var self = this,
          $authzModal = $(this.modalEl).modal(),
          authTokenDfr,
          clickEventName = "click.delegateEvents" + this.cid, // Same name as Backbone.View.delegateEvents see undelegateEvents()
          cancelled = false;

      var handleAuthorizationRedirect = function() {
            var token = $authzModal.data("token");
            cancelled = true;
            self.requestAuthorization(token);
          },
          handleDelayAuthorizationRedirect = function() {
            if (cancelled) { return; }
            if ($authzModal.data("modal") && $authzModal.data("modal").isShown) {
              handleAuthorizationRedirect();
            }
          },
          handleModalShown = function() {
            _.delay(handleDelayAuthorizationRedirect, 12000);
          },
          handleModalHide = function() {
            $authzModal.off(clickEventName);
            cancelled = true;
          },
          handleIssuedToken = function(resp) {
            $authzModal.data("token", resp.token);
            $authzModal.modal("show");
          };

      $authzModal.on(clickEventName, "#link-redirect-authorize", handleAuthorizationRedirect);
      $authzModal.one("shown.kexp", handleModalShown);
      $authzModal.one("hide.kexp", handleModalHide);
      authTokenDfr = this._lastFmApi.getAuthToken().done(handleIssuedToken);
    },
    handleAuthorizationToggle: function(event) {
      $(this.serviceBoxEl).find("div.alert").remove();
      $(event.currentTarget).hasClass("active") ? this.removeSession() : this.showAuthzModal();
    },
    handleLikeShareCheck: function(event) {
      var checked = $(event.currentTarget).is(":checked");
      this.vent.trigger("analytics:trackevent", "Feature", "LastFmLikeShare", checked ? "Enabled" : "Disabled");
    },
    handleLikeScrobbleCheck: function(event) {
      var checked = $(event.currentTarget).is(":checked");
      this.vent.trigger("analytics:trackevent", "Feature", "LastFmLikeScrobble", checked ? "Enabled" : "Disabled");
    }
  });

  return LastFmOptionsItemView;
});