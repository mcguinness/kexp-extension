define([
  "underscore",
  "backbone"
  ], function(_, Backbone) {

  Backbone.Collection.prototype.add = function(models, options) {
    var i, index, length, model, cid, id, cids = {}, ids = {}, dups = [];
    options || (options = {});
    models = _.isArray(models) ? models.slice() : [models];

    // Begin by turning bare objects into model references, and preventing
    // invalid models or duplicate models from being added.
    for (i = 0, length = models.length; i < length; i++) {
      if (!(model = models[i] = this._prepareModel(models[i], options))) {
        throw new Error("Can't add an invalid model to a collection");
      }
      cid = model.cid;
      id = model.id;
      if (cids[cid] || this._byCid[cid] || ((id != null) && (ids[id] || this._byId[id]))) {
        dups.push(i);
        continue;
      }
      cids[cid] = ids[id] = model;
    }

    // Remove duplicates.
    i = dups.length;
    while (i--) {
      models.splice(dups[i], 1);
    }

    // Listen to added models' events, and index models for lookup by
    // `id` and by `cid`.
    for (i = 0, length = models.length; i < length; i++) {
      (model = models[i]).on('all', this._onModelEvent, this);
      this._byCid[model.cid] = model;
      if (model.id != null) this._byId[model.id] = model;
    }

    // Custom Extension to allow limits on collections
    if (options.delimit && _.isFunction(this.delimit)) {
      this.delimit(models, options);
    }

    // Insert models into the collection, re-sorting if needed, and triggering
    // `add` events unless silenced.
    this.length += length;
    index = options.at != null ? options.at : this.models.length;
    Array.prototype.splice.apply(this.models, [index, 0].concat(models));
    if (this.comparator) this.sort({silent: true});
    if (options.silent) return this;
    for (i = 0, length = this.models.length; i < length; i++) {
      if (!cids[(model = this.models[i]).cid]) continue;
      options.index = i;
      model.trigger('add', model, this, options);
    }
    return this;
  };

  return Backbone;
});