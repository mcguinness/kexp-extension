define([
  "jquery",
  "underscore",
  "backbone-replete", // Backbone Plugin
  "htmlencoder",
  "moment"
	], function($, _, Backbone, HtmlEncoder) {


  var findDstDate = function(dstMonth, sundayCount, searchStartDate) {
    searchStartDate || (searchStartDate = (sundayCount * 7));
    var dstMoment = moment().utc().month(dstMonth).date(searchStartDate).day(0).hours(10);
    if (dstMoment.month() !== dstMonth) {
      return findDstDate(year, dstMonth, searchStartDate + 7, sundayCount);
    }
    return dstMoment;
  };

  // This is bad, hardcoding US DST rules which are known to change over time with legislation.
  //  2 a.m. on the Second Sunday in March to
  //  2 a.m. on the First Sunday of November.
  var DST_START = findDstDate(2, 2);
  var DST_END = findDstDate(10, 1);

  _.extend(Backbone.Model.prototype, {

    toJSON: function() {
      var json = _.clone(this.attributes);
      _.each(_.keys(this.attributes), function(key) {
        var val = this.get(key);
        if (_.isDate(val)) {
          json[key] = val.toISOString();
        }
      }, this);

      return json;
    },
    parse : function(resp, xhr) {
      
      // Exit early if no mappings are defined
      if (!_.isObject(this.mappings)) {
        return resp;
      }

      var result = {},
          globMapUndefined = false,
          mappedAttributes = [];
        
      for (var index in this.mappings) {
        
        var mapping = this.mappings[index],
            targetAttrib,
            targetVal;

        if (mapping.attribute === "*") {
          globMapUndefined = true;
          continue;
        }
            
        targetAttrib = !_.isEmpty(mapping.target) ? mapping.target : mapping.attribute,
        targetVal = resp[targetAttrib];

        mapping.options || (mapping.options = {});
        mappedAttributes.push(targetAttrib);
        
        if (_.isNull(targetVal) || _.isUndefined(targetVal) ||
          (mapping.type !== "string" && _.isString(targetVal) && _.isEmpty(targetVal))) {
          // Only strings can have empty values
          result[mapping.attribute] = null;
        } else {
          switch (mapping.type) {
            case "string":
              result[mapping.attribute] = _.isString(targetVal) ? targetVal : String(targetVal);
              if (!_.isEmpty(result[mapping.attribute]) && mapping.options.htmlDecode) {
                result[mapping.attribute] = HtmlEncoder.htmlDecode(result[mapping.attribute]);
              }
              break;
            case "boolean":
              result[mapping.attribute] = _.isBoolean(targetVal) ? targetVal : Boolean(targetVal);
              break;
            case "customPacificTimeDate" :
              var valMoment = moment(String(targetVal), mapping.options.format || ""),
                  nowUtc,
                  timeZoneOffset;
              
              // Must convert to UTC manually with DST than convert back to local using local getTimezoneOffset
              if (mapping.options.addDate) {
                nowUtc = moment.utc();
                timeZoneOffset = (nowUtc.diff(DST_START) >= 0 && nowUtc.diff(DST_END) <= 0) ? 420 : 480;
                valMoment.add("minutes", timeZoneOffset);
                valMoment = moment.utc(nowUtc.format("YYYY-MM-DD") + valMoment.format("THH:mm:ss"));
              } else {
                timeZoneOffset = (valMoment.diff(DST_START) >= 0 && valMoment.diff(DST_END) <= 0) ? 420 : 480;
                valMoment.add("minutes", timeZoneOffset);
                valMoment = moment.utc(valMoment.format("YYYY-MM-DDTHH:mm:ss"));
              }
              result[mapping.attribute] = mapping.options.toLocal ? valMoment.local().toDate() : valMoment.toDate();
              break;
            case "localDate": // Server returns UTC, convert to user's local timezone
              var date = Date.parse(targetVal);
              date = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
              result[attrMapping.name] = date;
              break;
            case "date":
              result[mapping.attribute] = _.isDate(targetVal) ? targetVal : new Date(Date.parse(targetVal));
              break;
            case "int":
              result[mapping.attribute] = _.isNumber(targetVal) ? targetVal : parseInt(String(targetVal).trim(), 10);
              break;
            case "float":
              result[mapping.attribute] = _.isFinite(targetVal) ? targetVal : parseFloat(String(targetVal).trim());
              break;
            default:
              result[mapping.attribute] = targetVal;
          }
        }
      }

      // Add all unmapped attributes
      if (globMapUndefined) {
        _.each(_.difference(_.keys(resp), mappedAttributes), function(key) {
          result[key] = resp[key];
        });
      }
      //console.debug("Model Parse Result", result, resp);

      return result;
    }
  });

  _.extend(Backbone.View.prototype, {
    makeAlert: function(alert, heading, message) {

      var alertParams, elParts = [];

      switch (alert ? alert.toLowerCase() : "") {
        case "error" :
          alertParams = { alertClass: "alert-error", iconClass: "icon-exclamation-sign"};
          break;
        case "success" :
          alertParams = { alertClass: "alert-success", iconClass: "icon-ok-sign"};
          break;
        case "info" :
          alertParams = { alertClass: "alert-info", iconClass: "icon-info-sign"};
          break;
        default :
          alertParams = { alertClass: "", iconClass: "icon-warning-sign"};
          break;
      }

      elParts.push('<div class="alert ' + alertParams.alertClass + '">');
      elParts.push('<button class="close" data-dismiss="alert">×</button>');
      
      if (!_.isEmpty(heading)) {
        elParts.push('<h4 class="alert-heading"><i class="' + alertParams.iconClass +
          ' icon-white"></i> ' + heading + '</h4>');
      } else {
        elParts.push('<i class="' + alertParams.iconClass + 'icon-white"></i> ');
      }
      if (!_.isEmpty(message)) {
        elParts.push(message);
      }
      elParts.push('</div>');
      return elParts.join("");
    }
  });


  return Backbone;
});