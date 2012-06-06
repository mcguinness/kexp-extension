define([
  "jquery",
  "underscore",
  "backbone-kexp",
  "models/LikedSongModel",
  "collections/LikedSongCollection",
  "views/LikedSongPopoverView",
  "text!templates/likedsonglist.html",
  "text!templates/likedsonglist-empty.html",
  "moment", // no need for arg
  // Must be last as script is not a AMD module
  "bootstrap",
  "jquery.dataTables",
  "jquery.dataTables.sort"
  ], function($, _, Backbone, LikedSongModel, LikedSongCollection,
    LikedSongPopoverView, ViewTemplate, EmptyTemplate) {

  var LikedSongListView = Backbone.Marionette.ItemView.extend({

    tagName: "div",
    className: "container-likedsongs",
    template: ViewTemplate,
    emptyTemplate: EmptyTemplate,

    initialize: function(options) {
      if (this.collection === undefined) {
        this.collection = new LikedSongCollection();
      }
    },
    events: {
      "click #table-liked i.icon-remove:hover": "removeLike",
      "click #table-liked i.icon-info-sign:hover": "showInfoPopover"
    },
    getTemplateSelector: function() {
      return (this.collection.length > 0) ? this.template : this.emptyTemplate;
    },
    serializeData: function() {
      return (this.collection.length > 0) ? {
        model: this.collection.toJSON()
      } : {};
    },
    onRender: function() {
      //console.log("[OnRender LikedSongListView]");
      var $table = $("#table-liked", this.$el);
      if ($table.length > 0) {
        // Sort by like count, then by song
        this.dataTable = $table.dataTable({
          "bPaginate": false,
          "bLengthChange": false,
          "bFilter": false,
          "bSort": true,
          "bStateSave": false,
          "bInfo": false,
          "bAutoWidth": true,
          "bScrollInfinite": true,
          "bScrollCollapse": false,
          "sScrollY": "255px",
          "bDeferRender": true,
          "aoColumns": [
            null,
            {
              "sType": "num-html"
            },
              null,
              null,
              null,
            {
              "mDataProp": this.formatDateColumn(5)
            },
            null
          ],
          "aaSorting": [ [1,'desc'], [5,'desc'] ]
        });
      }
    },
    onShow: function() {
      // Listen for when rendered content is attached to window so we can auto-size the table
      //console.log("[OnShow LikedSongListView]");
      if (this.dataTable) {
        this.dataTable.fnAdjustColumnSizing();
      }
    },
    formatDateColumn: function(column) {
      var displayKey = "_" + column;
      return function(source, type, val) {
        if (type === 'set') {
          source[column] = val;
          source[displayKey] = moment(val).local().format("M/D/YY");
          return;
        } else if (type === 'display' || type === 'filter') {
          return source[displayKey];
        }
        // 'sort' and 'type' both just use the raw data
        return source[column];
      };
    },
    showInfoPopover: function(event) {
      
      var songId = $(event.currentTarget).parentsUntil("tbody", "[data-id]").attr("data-id"),
        self = this, closeDfr, model;

      if (_.isEmpty(songId)) {
        console.error("Unable to find the id in the data-id attribute for the clicked row. (Possible Template/Model Error)", event);
        self.render();
        return;
      }
      model = this.collection.get(songId);

      if (_.isUndefined(model)) {
        // Stale view, rerender
        console.error("Unable to find the song id {" + songId + "} in the database (Stale View)", event);
        self.render();
        return;
      }

      // Remove any open popovers...
      if (this.popoverView) {
        closeDfr = this.popoverView.close();
        delete this.popoverView;
      } else {
        closeDfr = $.Deferred().resolve();
      }

      $.when(closeDfr).then(
        function() {
          self.popoverView = new LikedSongPopoverView({
              el: "#navbar-top",
              model: model,
              vent: self.vent,
              appConfig: self.appConfig
            });
          self.popoverView.render();
          self.popoverView.toggle();
          self.vent.trigger("analytics:trackevent", "LikedSong", "ShowPopover", model.toDebugString());
        }
      );
    },
    removeLike: function(event) {
      var self = this;
      var songId = $(event.currentTarget).parentsUntil("tbody", "[data-id]").attr("data-id");

      if (_.isEmpty(songId)) {
        console.error("Unable to find the id in the data-id attribute for the clicked row. (Possible Template/Model Error)", event);
        self.render();
        return;
      }

      console.log("Retrieving liked song with id: {%s}", songId);
      var song = this.collection.get(songId);
      if (_.isUndefined(song)) {
        // Stale view, rerender
        console.error("Unable to find the song id " + songId + " in the database for remove like request. (Stale View)", event);
        self.render();
        return;
      }

      console.log("Removing liked song with id: {%s}", songId, song);
      // TODO: add error handling
      song.destroy({
        wait: true,
        success: function(model, resp) {
          console.log("Successfully deleted song with id: {%s}", songId, song);
          self.collection.remove(model);
          self.render();
          self.vent.trigger("analytics:trackevent", "LikedSong", "Remove", model.toDebugString());
        }
      });
    },
    beforeClose: function() {
      if (this.popoverView) {
        this.popoverView.close();
        delete this.popoverView;
      }
      if (this.dataTable) {
        this.dataTable.fnDestroy(true);
        delete this.dataTable;
        delete this.$el.DataTable;
      }
    }
  });

  return LikedSongListView;
});
