define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "services/LastFmApi",
  "collections/AppConfigCollection",
  "text!templates/options-lastfm.html",
  "bootstrap" // no need for arg
  ], function($, _, Marionette, LastFmApi, AppConfigCollection, ViewTemplate) {
  
  var LastFmOptionsItemView = Marionette.ItemView.extend({
    
    template: ViewTemplate,
    modalEl: "#modal-lastfm-authorize",
    serviceBoxEl: "#ctrls-lastfm-service",
    featureBoxEl: "#ctrls-lastfm-features",

    initialize: function(options) {
      this.lastFmApi = new LastFmApi();

      _.bindAll(this, "handleRedirectAuthorization");
    },
    events: {
      "click #btn-lastfm-service": "handleAuthorizationToggle",
      "click #chkbx-lastfm-share-like": "handleLikeShareCheck",
      "click #chkbx-lastfm-scrobble-like": "handleLikeScrobbleCheck",
      "click #modal-lastfm-authorize button.accept": "acceptAuthorization",
      "click #link-redirect-authorize": "handleRedirectAuthorization"
    },
    onRender: function() {
      $("#btn-lastfm-service").button();
    },
    serializeData: function() {
      return { model: this.model.toJSON()};
    },
    handleRedirectAuthorization: function() {
      this.requestAuthorization($(this.modalEl).data("token"));
    },
    requestAuthorization: function(token) {
      var authzUrl = this.model.get("authUrl");
      authzUrl += "?api_key=" + this.model.get("apiKey");
      authzUrl += "&token=" + token;

      chrome.tabs.create({
        url: authzUrl,
        active: true
      });

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

      this.lastFmApi.getAuthSession(token)
        .then(
          function(resp) {
            console.log("[LastFm GetAuthSession Success]", resp);
            $ctrlBox.append(
              '<div class="alert alert-success">' +
              '<button class="close" data-dismiss="alert">×</button>' +
              '<i class="icon-ok-sign icon-white"></i> <strong>Success!</strong> Last.fm app authorization is complete!</div>'
              );
            self.addSession(resp.session);
          },
          function(resp, error) {
            console.log("[LastFm GetAuthSession Fail] {Error: %s}", resp.message, resp);
            if (error === 14) { // Token not authorized
              $ctrlBox.append(
                '<div class="alert alert-error">' +
                '<button class="close" data-dismiss="alert">×</button>' +
                '<i class="icon-exclamation-sign icon-white"></i> <strong>Authorization Failed!</strong> Did you give permission to this extension?</div>'
                );
            } else {
              $ctrlBox.append(
                '<div class="alert alert-error">' +
                '<button class="close" data-dismiss="alert">×</button>' +
                '<i class="icon-exclamation-sign icon-white"></i> <strong>Authorization Failed!</strong> Unable to authorize the extension due to Last.fm error <em>"' +
                resp.message + '"</em></div>'
                );
            }
            self.vent.trigger("analytics:trackevent", "Feature", "LastFmAuthorization", "Error", error);
          });
    },
    addSession: function(session) {
      this.model.enableAuthorization(session.key, session.name);

      $("#btn-lastfm-service").html('<i class="icon-user"></i> Enabled');
      $("#btn-lastfm-service").button('toggle');
      $(this.featureBoxEl).find("input[type=checkbox]").removeAttr("disabled");

      this.vent.trigger("analytics:trackevent", "Feature", "LastFmAuthorization", "Enabled");
    },
    removeSession: function() {

      this.model.disableAuthorization();

      $("#btn-lastfm-service").html('<i class="icon-user icon-white"></i> Disabled');
      $("#btn-lastfm-service").button('toggle');
      $(this.featureBoxEl).find("input[type=checkbox]").attr("disabled", true);

      this.vent.trigger("analytics:trackevent", "Feature", "LastFmAuthorization", "Disabled");
    },
    showAuthzModal: function() {
      var self = this;
      var $authzModal = $(this.modalEl).modal();
      var authTokenDfr;
      var cancelled = false;

      $authzModal.one("shown.kexp", function() {
        $authzModal.off("shown.kexp");
        _.delay(function() {
            if (cancelled) { return; }
            $.when(authTokenDfr)
              .done(function(resp) {
                if ($authzModal.data("modal") && $authzModal.data("modal").isShown) {
                  self.requestAuthorization(resp.token);
                }
              });
        }, 12000);
      });
      $authzModal.one("hide.kexp", function(event) {
        $authzModal.off("hide.kexp");
        console.log("Modal hide", event);
        cancelled = true;
      });

      authTokenDfr = this.lastFmApi.getAuthToken()
        .done(function(resp) {
          $authzModal.data("token", resp.token);
          $authzModal.modal("show");
        });
    },
    handleAuthorizationToggle: function(event) {
      $(this.serviceBoxEl).find("div.alert").remove();
      var $button = $(event.currentTarget);
      $button.hasClass("active") ? this.removeSession() : this.showAuthzModal();
    },
    handleLikeShareCheck: function(event) {
      var checked = $(event.currentTarget).is(":checked");
      this.model.set({
        likeShareEnabled: checked
      });
      this.vent.trigger("analytics:trackevent", "Feature", "LastFmLikeShare", checked ? "Enabled" : "Disabled");
    },
    handleLikeScrobbleCheck: function(event) {
      var checked = $(event.currentTarget).is(":checked");
      this.model.set({
        likeScrobbleEnabled: checked
      });
      this.vent.trigger("analytics:trackevent", "Feature", "LastFmLikeScrobble", checked ? "Enabled" : "Disabled");
    }
  });

  return LastFmOptionsItemView;
});