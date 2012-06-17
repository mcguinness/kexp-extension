define([
  "jquery",
  "underscore",
  "backbone-replete", // Backbone Plugin
  "htmlencoder",
  "moment"
	], function($, _, Backbone, HtmlEncoder) {


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
            case "customDate" :
              var valMoment = moment(String(targetVal), mapping.options.format || ""),
                  nowUtc,
                  valISOString;
              
              if (mapping.options.addDate) {
                nowUtc = moment.utc();
                valISOString = nowUtc.subtract("minutes", valMoment.zone()).format("YYYY-MM-DD") + valMoment.format("THH:mm:ssZ");
                valMoment = moment(valISOString, "YYYY-MM-DDTHH:mm:ss");
              }
              result[mapping.attribute] = mapping.options.toLocal ? valMoment.toDate() : valMoment.utc().toDate();
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
      console.debug("Model Parse Result", result, resp);

      return result;
    }
  });


  return Backbone;
});