define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "models/MappingParseModel",
  "moment"
  ], function($, Backbone, _, MappingParseModel, moment) {
  
  var ShowModel = MappingParseModel.extend({

    mappings: [
      {attribute: "id", target: "ArchiveID", type: "int"},
      {attribute: "title", target: "ShowTitleFriendly", type: "string"},
      {attribute: "subTitle", target: "Subtitle", type: "string"},
      {attribute: "dj", target: "ShowDJ", type: "string"},
      {attribute: "timeStart", target: "StartHour", type: "customPacificTimeDate",
        options: {format: "H", addDate: true}
      },
      {attribute: "timeEnd", target: "EndHour", type: "customPacificTimeDate",
        options: {format: "H", addDate: true}
      }
    ],
    parse: function(resp, xhr) {
      var result = MappingParseModel.prototype.parse.apply(this, arguments);
      // Feed is not consistent, sometimes show title is the Title field, othertimes ShowTitleFriendly
      result.title = (resp.ShowTitleFriendly === "Variety Mix" && resp.Title !== "Variety Mix") ?
        resp.Title : resp.ShowTitleFriendly;
      return result;
    },
    url: function() {
      return "http://www.kexp.org/s/s.aspx?x=5";
    },
    validate: function(attributes) {
      // KEXP feed sometimes returns nulls when there is an error, otherwise expect empty string values for "valid" data
      if (!_.isNumber(attributes.id) || attributes.id === 0) {
        return "id attribute is empty, missing, null, or 0";
      }
      if (_.isEmpty(attributes.title)) {
        return "title attribute is empty, missing or null";
      }
      if (_.isEmpty(attributes.dj)) {
        return "dj attribute is empty, missing or null";
      }
      if (!_.isDate(attributes.timeStart)) {
        return "timeStart attribute is empty, missing or null";
      }
      if (!_.isDate(attributes.timeEnd)) {
        return "timeEnd attribute is empty, missing or null";
      }
    },
    formatTimeRange: function(format) {
      return moment(this.get("timeStart")).format(format) + " - " +
        moment(this.get("timeEnd")).format(format);
    }
  });
  return ShowModel;
});