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
          dj: resp.ShowDJ,
          timeStart: resp.StartTime,
          timeEnd: resp.EndTime
        };

      if (!_.isEmpty(parsedModel.timeStart)) {
        timeStart = moment(parsedModel.timeStart).toDate();
      }
      if (!_.isEmpty(parsedModel.timeEnd)) {
        timeEnd = moment(parsedModel.timeEnd).toDate();
      }
        
      console.debug("ShowModel Parse Result", parsedModel, resp);
      return parsedModel;
    },
    url: function() {
      return "http://www.kexp.org/s/s.aspx?x=5";
    }
  });
  return ShowModel;
});