define([
  "jquery",
  "underscore",
  "backbone"
  ], function($, _, Backbone) {

   // Adds delimit support for collections
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

  // Adds update or insert support to collections
  Backbone.Collection.prototype.upsert = function(models, options) {
    var i, index, length, existingModel, model, cid, id, cids = {}, ids = {}, dups = [];
    options || (options = {});
    models = _.isArray(models) ? models.slice() : [models];

    // Begin by turning bare objects into model references, and preventing
    // invalid models or duplicate models from being added.
    for (i = 0, length = models.length; i < length; i++) {
      if (!(model = models[i] = this._prepareModel(models[i], options))) {
        console.warn("Can't update or add an invalid model to a collection", models[i], this, options);
        throw new Error("Can't update or add an invalid model to a collection");
      }
      cid = model.cid;
      id = model.id;
      if (cids[cid] || ((id != null) && (ids[id]))) {
        dups.push(i);
        continue;
      } else if  (this._byCid[cid] || (id != null) && (ids[id] || this._byId[id])) {
        existingModel = this.getByCid(cid) || this.get(id);
        existingModel.set(model, options);
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

    return this.add(models, options);
  };

  // Adds promise pattern to fetch
  Backbone.Collection.prototype.fetch = function(options) {
    options = options ? _.clone(options) : {};
    if (options.parse === undefined) options.parse = true;
    var collection = this;
    var fetchDfr = $.Deferred();

    if (options.success) {
      fetchDfr.done(options.success);
    }
    fetchDfr.fail(Backbone.wrapError(options.error, collection, options));

    options.success = function(resp, status, xhr) {
      try {
        collection[options.add ? 'add' : (options.upsert ? "upsert" : 'reset')](collection.parse(resp, xhr), options);
        fetchDfr.resolve(collection, resp);
      }
      catch (e) {
        console.warn("Error {%s} fetching collection =>", e.toString(), e.stack, collection, e, options);
        fetchDfr.reject(collection, e, options);
      }
    };
    options.error = function(collection, error, options) {
      fetchDfr.reject(collection, error, options);
    };

    (this.sync || Backbone.sync).call(this, 'read', this, options);
    return fetchDfr.promise();
  };


  Backbone.Model.prototype.fetch = function(options) {
    options = options ? _.clone(options) : {};
    if (options.parse === undefined) options.parse = true;
    var model = this;
    var fetchDfr = $.Deferred();

    if (options.success) {
      fetchDfr.done(options.success);
    }
    fetchDfr.fail(Backbone.wrapError(options.error, model, options));

    options.success = function(resp, status, xhr) {
      try {
        if (!model.set(model.parse(resp, xhr), options)) return false;
        fetchDfr.resolve(model, resp);
      }
      catch (e) {
        console.warn("Error {%s} fetching model =>", e.toString(), e.stack, model, e, options);
        fetchDfr.reject(model, e, options);
      }
    };
    options.error = function(model, error, options) {
      fetchDfr.reject(model, error, options);
    };

    (this.sync || Backbone.sync).call(this, 'read', this, options);
    return fetchDfr.promise();
  };

  return Backbone;
});