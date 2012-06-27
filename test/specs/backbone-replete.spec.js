define(["jquery", "backbone-replete"], function($, Backbone) {
  
  describe("Backbone Replete", function() {
    
    describe("Backbone.Collection Delimit", function() {
      var DelimitCollection = Backbone.Collection.extend({
        delimit: function() {}
      });

      beforeEach(function() {
        this.collection = new DelimitCollection();
        this.stub = sinon.stub(this.collection, "delimit");
      });

      it("should call delimit function when option is true", function() {
          this.collection.add([{name: "delimitModel"}], {delimit: true});
          this.stub.should.have.been.calledOnce;
      });
      it("should not call delimit function when option is false", function() {
          this.collection.add([{name: "delimitModel"}], {delimit: false});
          this.stub.should.not.have.been.called;
      });
      it("should not call delimit function when option is not specified", function() {
          this.collection.add([{name: "delimitModel"}], {});
          this.stub.should.not.have.been.called;
      });
    });

    describe("Backbone.Collection Upsert", function() {

      beforeEach(function() {
        this.collection = new Backbone.Collection();
      });

      it("should update an existing model when ids match", function() {
          var originalModel = new Backbone.Model({id: 123, name: "original"}),
              updatedModel = new Backbone.Model({id: 123, name: "updated"}),
              result;

          this.collection.upsert(originalModel.clone());
          this.collection.upsert(updatedModel);

          this.collection.should.have.length(1);
          result = this.collection.at(0);

          result.id.should.equal(originalModel.id);
          result.get("name").should.not.equal(originalModel.get("name"));
          
      });

      it("should add a model with different id", function() {
          var originalModel = new Backbone.Model({id: 123, name: "original"}),
              newModel = new Backbone.Model({id: 321, name: "new"}),
              result;

          this.collection.upsert(originalModel);
          this.collection.upsert(newModel);

          this.collection.should.have.length(2);
          this.collection.at(0).id.should.equal(originalModel.id);
          this.collection.at(1).id.should.equal(newModel.id);
      });

      it("should update an existing model with same cid", function() {
          var originalModel = new Backbone.Model({name: "original"}),
              updatedModel = new Backbone.Model({name: "updated"}),
              result;

          updatedModel.cid = originalModel.cid;

          this.collection.upsert(originalModel);
          this.collection.upsert(updatedModel);

          this.collection.should.have.length(1);
          result = this.collection.at(0);

          result.cid.should.equal(originalModel.cid);
          result.get("name").should.not.equal("original");
          
      });

      it("should add a model with different cid", function() {
          var originalModel = new Backbone.Model({name: "original"}),
              newModel = new Backbone.Model({name: "new"}),
              result;

          this.collection.upsert(originalModel);
          this.collection.upsert(newModel);

          this.collection.should.have.length(2);
          this.collection.at(0).cid.should.equal(originalModel.cid);
          this.collection.at(1).cid.should.equal(newModel.cid);
      });
    });


    describe("Backbone.Collection Fetch", function() {

      beforeEach(function() {
        this.collection = new Backbone.Collection();

      });

      it("should call deferred done callback on sync success", function(done) {

        var self = this;
        this.collection.sync = function(method, model, options) {
          options.success({id: 123, name:"success"});
        };

        this.collection.fetch().then(
          function(collection, resp) {
            self.collection.should.have.length(1);
            self.collection.at(0).id.should.equal(123);
            self.collection.at(0).get("name").should.equal("success");
            done();
          },
          function() {
            sinon.assert.fail("fail callback should not be called");
          }
        );
      });

      it("should call deferred fail callback on sync error", function(done) {

        var self = this;
        this.collection.sync = function(method, model, options) {
          options.error("Not Found");
        };

        this.collection.fetch().then(
          function(collection, resp) {
            sinon.assert.fail("success callback should not be called");
          },
          function(collection, resp) {
            self.collection.should.have.length(0);
            done();
          }
        );
      });
    });
    
    describe("Backbone.Model Fetch", function() {

      beforeEach(function() {
        this.model = new Backbone.Model();
      });

      it("should call deferred done callback on sync success", function(done) {
        var self = this;

        this.model.sync = function(method, model, options) {
          options.success({id: 123, name:"success"});
        };

        this.model.fetch().then(
          function(model, resp) {
            self.model.id.should.equal(123);
            self.model.get("name").should.equal("success");
            done();
          },
          function() {
            sinon.assert.fail("fail callback should not be called");
          }
        );
      });

      it("should call deferred fail callback on sync error", function(done) {

        this.model.sync = function(method, model, options) {
          options.error("Not Found");
        };

        this.model.fetch().then(
          function(model, resp) {
            sinon.assert.fail("success callback should not be called");
          },
          function(model, resp) {
            done();
          }
        );
      });
    });
  });
}); 

