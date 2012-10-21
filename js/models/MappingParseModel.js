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
      return findDstDate(dstMonth, searchStartDate + 7, sundayCount);
    }
    return dstMoment;
  };

  // This is bad, hardcoding US DST rules which are known to change over time with legislation.
  //  2 a.m. on the Second Sunday in March to
  //  2 a.m. on the First Sunday of November.
  var DST_START = findDstDate(2, 2);
  var DST_END = findDstDate(10, 1);

  var MappingParseModel = Backbone.Model.extend({
    constructor: function(attributes, options) {
      if (_.isObject(attributes) && _.isObject(options) && options.parseDateISOString &&
        _.isObject(this.mappings)) {

        for (var index in this.mappings) {
          
          var mapping = this.mappings[index];
          var targetVal = attributes[mapping.attribute];

          // Only Parse ISO String
          if (_.isString(targetVal)) {
            switch (mapping.type) {
              case "customPacificTimeDate" :
              case "localDate" :
              case "date" :
                attributes[mapping.attribute] = new Date(targetVal);
                break;
              default :
                break;
            }
          }
        }
      }
      Backbone.Model.apply(this, arguments);
    },
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
    parse: function(resp, xhr) {
      
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

        mapping.options || (mapping.options = {});

        // Is Wildcard Glob?
        if (mapping.attribute === "*") {
          globMapUndefined = true;
          continue;
        }

        targetAttrib = !_.isEmpty(mapping.target) ? mapping.target : mapping.attribute;
        targetVal = resp[targetAttrib];

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

  return MappingParseModel;
});

