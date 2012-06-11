define(["jquery", "backbone-kexp", "underscore", "moment"], function($, Backbone, _) {
  var ShowModel = Backbone.Model.extend({

     toJSON: function() {
      var json = Backbone.Model.prototype.toJSON.call(this);
      
      json.timeStart = _.isDate(this.get("timeStart")) ?
        this.get("timeStart").toISOString() :
        "";
      json.timeEnd = _.isDate(this.get("timeEnd")) ?
        this.get("timeEnd").toISOString() :
        "";
      
      return json;
    },
    parse: function(resp, xhr) {

      var parsedModel = {
          id: resp.ArchiveID,
          title: resp.ShowTitleFriendly,
          subTitle: resp.Subtitle,
          dj: resp.ShowDJ
        };
      var utcHourNow = moment().utc().minutes(0).seconds(0).milliseconds(0),
        currentUtcHour = utcHourNow.hours(),
        showStartUtcHour,
        showEndUtcHour;

      var convertShowHourToDate = function(showHour) {
        var showMoment = moment(utcHourNow).hours(showHour);
        if (showHour >= (24 - 8) && currentUtcHour < 8) {
          showMoment.subtract("days", 1);
        }
        // TODO: Fix issue with time and manually subtracting by 1 (Same as NowPlayingModel)
        return showMoment.local().subtract('hours', 1).toDate();
      };

      if (_.isNumber(resp.StartHour)) {
        parsedModel.timeStart = convertShowHourToDate(resp.StartHour + 8);
      }
      if (_.isNumber(resp.EndHour)) {
        parsedModel.timeEnd = convertShowHourToDate(resp.EndHour + 8);
      }
        
      console.debug("ShowModel Parse Result", parsedModel, resp);
      return parsedModel;
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