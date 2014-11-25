define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "models/LikedSongModel",
  "collections/LikedSongCollection",
  "views/LikedSongPopoverView",
  "text!templates/likedsonglist.html",
  "text!templates/likedsonglist-empty.html",
  "moment",
  "bootstrap", // no need for arg
  "datatables",
  "jquery.dataTables.sort" // no need for arg
  ], function($, _, Marionette, LikedSongModel, LikedSongCollection,
    LikedSongPopoverView, ViewTemplate, EmptyTemplate, moment) {

  var LikedSongListView = Marionette.ItemView.extend({

    tagName: "div",
    className: "container-likedsongs",
    template: ViewTemplate,
    emptyTemplate: EmptyTemplate,

    initialize: function(options) {
      options || (options = {});
      if (this.collection === undefined) {
        this.collection = new LikedSongCollection();
      }
      this.popoverEl = options.popoverEl || "#navbar-top";
    },
    events: {
      "click #table-liked .cell-remove-action i": "removeLike",
      "click #table-liked .cell-info-action i": "showInfoPopover",
      "dblclick #table-liked tbody tr": "showInfoPopover"
    },
    getTemplateSelector: function() {
      return (this.collection.length > 0) ? this.template : this.emptyTemplate;
    },
    serializeData: function() {
      return (this.collection.length > 0) ? {model: this.collection.toJSON()} : {};
    },
    onRender: function() {
      //console.log("[OnRender LikedSongListView]");
      var $table = $("#table-liked", this.el);
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
          "sScrollY": "274px",
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
      var $currentTarget = $(event.currentTarget),
          songId = $currentTarget.is("tr[data-id]") ?
            $currentTarget.attr("data-id") :
            $currentTarget.parentsUntil("tbody", "[data-id]").attr("data-id"),
          view = this,
          closeDfr,
          model;

      if (_.isEmpty(songId)) {
        console.error("Unable to find the id in the data-id attribute for the clicked row. (Possible Template/Model Error)", event);
        view.render();
        return;
      }
      model = this.collection.get(songId);

      if (_.isUndefined(model)) {
        // Stale view, rerender
        console.error("Unable to find the song id {" + songId + "} in the database (Stale View)", event);
        view.render();
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
          view.popoverView = new LikedSongPopoverView({
              el: view.popoverEl,
              model: model
            });
          view.popoverView.render();
          view.popoverView.toggle();
          view.vent.trigger("analytics:trackevent", "LikedSong", "ShowPopover", model.toDebugString());
        }
      );
    },
    removeLike: function(event) {
      var view = this;
      var $row = $(event.currentTarget).parentsUntil("tbody", "[data-id]");
      var songId = $row.attr("data-id");

      if (_.isEmpty(songId)) {
        console.error("Unable to find the id in the data-id attribute for the clicked row. (Possible Template/Model Error)", event);
        view.render();
        return;
      }

      console.log("Retrieving liked song with id: {%s}", songId);
      var song = this.collection.get(songId);
      if (_.isUndefined(song)) {
        // Stale view, rerender
        console.error("Unable to find the song id " + songId + " in the database for remove like request. (Stale View)", event);
        view.render();
        return;
      }

      console.log("Removing liked song with id: {%s} [%s]", songId, song.toDebugString());
      song.destroy({
        wait: true,
        success: function(model, resp) {
          console.log("Successfully deleted song with id: {%s} [%s]", songId, song.toDebugString());
          view.collection.remove(model);
          view.render();

          view.dataTable.fnDeleteRow($row);

          view.vent.trigger("analytics:trackevent", "LikedSong", "Remove", model.toDebugString());
        },
        error: function(model, error, options) {
          console.error("Unable to delete song with id: {%s} [%s] due to error {%s}", songId, song.toDebugString(), error);
          view.render();
          view.vent.trigger("analytics:trackevent", "LikedSong", "Error", JSON.Stringify(error || ""));
        }
      });
    },
    beforeClose: function() {
      if (this.popoverView) {
        this.popoverView.close();
        delete this.popoverView;
      }
      // Datatable jquery plugin seems to cache a bunch of stuff
      // This should force clear everything
      if (this.dataTable) {
        this.dataTable.fnDestroy(true);
        $("#table-liked", this.el).empty().remove();
        delete this.dataTable;
      }
    }
  });

  return LikedSongListView;
});
