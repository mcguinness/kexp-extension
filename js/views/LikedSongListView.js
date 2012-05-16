define([
  "jquery",
  "backbone",
  "underscore",
  "marionette",
  "models/LikedSongModel",
  "collections/LikedSongCollection",
  "text!templates/likedsonglist.html",
  "text!templates/likedsonglist-empty.html",
  "text!templates/likedsong-popover.html",
  "text!templates/likedsong-popover-info.html",
  "moment", // no need for arg
  // Must be last as script is not a AMD module
  "bootstrap",
  "jquery.dataTables",
  "jquery.dataTables.sort"
  ], function($, Backbone, _, Marionette, LikedSongModel, LikedSongCollection,
    ViewTemplate, EmptyTemplate, PopoverTemplate, PopoverContentTemplate) {

  var LikedSongListView = Backbone.Marionette.ItemView.extend({

    tagName: "div",
    template: ViewTemplate,
    emptyTemplate: EmptyTemplate,
    popoverTemplate: PopoverTemplate,
    popoverContentTemplate: PopoverContentTemplate,

    initialize: function(options) {
      if (this.collection === undefined) {
        this.collection = new LikedSongCollection();
      }
    },
    events: {
      "click #table-liked i.icon-remove:hover": "removeLike"
      //"click #table-liked i.icon-info-sign:hover": "showInfoPopover"
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
          "sScrollY": "225px",
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
          }
          ]
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
      var self = this;
      var songId = $(event.currentTarget).parentsUntil("tbody", "[data-id]").attr("data-id");
      var song = this.collection.get(songId);
      var songJson = song.toJSON();
      var popover;

      $.when(Backbone.Marionette.Renderer.render(self.popoverContentTemplate, {
        model: songJson
      })).then(function(html) {
        $(event.currentTarget).popover({
          content: html,
          title: song.get("songTitle"),
          placement: "right",
          trigger: "manual"
        }).popover("show");

        popover = $(event.currentTarget).data("popover");
        popover.$tip.mouseout(function() {
          popover.hide();
        });
      });
    },
    removeLike: function(event) {
      var self = this;
      var songId = $(event.currentTarget).parentsUntil("tbody", "[data-id]").attr("data-id");

      if (songId === undefined) {
        // Should only happen on bug in render template or model added to collection that is not persisted
        console.error("Unable to find the id in the data-id attribute for the clicked row. (Possible Template/Model Error)", event);
        self.render();
        return;
      }

      console.log("Retrieving liked song with id: {%s}", songId);
      var song = this.collection.get(songId);
      if (song === undefined) {
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
        }
      });
    }
  });

  return LikedSongListView;
});
