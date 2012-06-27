define(["underscore", "models/LastFmModel"], function(_, LastFmModel) {

  describe("LastFmModel", function() {
    var ARTIST_IMAGES = {
      "artist": {
        "image": [
          {"#text": "http://userserve-ak.last.fm/serve/34/886281.jpg", "size": ""},
          {"#text": "http://userserve-ak.last.fm/serve/34/886281.jpg"},
          {"#text": "","size": "medium"},
          {"size": "medium"},
          {"#text": "http://userserve-ak.last.fm/serve/126/886281.jpg","size": "large"},
          {"#text": "http://userserve-ak.last.fm/serve/252/886281.jpg","size": "extralarge"},
          {"#text": "http://userserve-ak.last.fm/serve/500/886281/Modest+Mouse.jpg","size": "mega"}
        ]
      }
    };

    var ALBUM_TRACKS = {
      "album": {
        "name":"The Lonesome Crowded West",
        "tracks": {
          "track": [
            {
              "name":"Teeth Like God's Shoeshine",
              "duration":"414",
              "mbid":"0764d5fc-e571-47cc-8917-cf55ff7f4de3",
              "url":"http:\/\/www.last.fm\/music\/Modest+Mouse\/_\/Teeth+Like+God's+Shoeshine",
              "downloadurl": "http:\/\/www.last.fm\/music\/Modest+Mouse\/_\/Teeth+Like+God's+Shoeshin\/FakeDownload",
              "streamable": {
                "#text":"0",
                "fulltrack":"0"
              },
              "artist": {
                "name":"Modest Mouse",
                "mbid":"a96ac800-bfcb-412a-8a63-0a98df600700",
                "url":"http:\/\/www.last.fm\/music\/Modest+Mouse"
              },
              "@attr": {
                "rank":"1"
              }
            },
            {
              "name":"Heart Cooks Brain",
              "duration":"243",
              "mbid":"3e6f056d-170e-4ef3-b267-9f0dbad27f0a",
              "url":"http:\/\/www.last.fm\/music\/Modest+Mouse\/_\/Heart+Cooks+Brain",
              "streamable": {
                "#text":"0",
                "fulltrack":"0"
              },
              "artist": {
                "name":"Modest Mouse",
                "mbid":"a96ac800-bfcb-412a-8a63-0a98df600700",
                "url":"http:\/\/www.last.fm\/music\/Modest+Mouse"
              },
              "@attr": {
                "rank":"2"
              }
            },
            {
              "name":"Convenient Parking",
              "duration":"248",
              "mbid":"516d3ecd-150f-45f3-93d0-fe9dd96ecd7a",
              "url":"http:\/\/www.last.fm\/music\/Modest+Mouse\/_\/Convenient+Parking",
              "streamable":{
                "#text":"0",
                "fulltrack":"0"
              },
              "artist":{
                "name":"Modest Mouse",
                "mbid":"a96ac800-bfcb-412a-8a63-0a98df600700",
                "url":"http:\/\/www.last.fm\/music\/Modest+Mouse"
              },
              "@attr":{
                "rank":"3"
              }
            }
          ]
        }
      }
    };

    beforeEach(function() {
      this.model = new LastFmModel();
    });

    describe("#parse", function() {
      it("should throw if entity is missing or invalid", function() {
        expect(function() {this.model.parse({})}).to.throw(Error);
        expect(function() {this.model.parse({unknown: {name: "unknown"}})}).to.throw(Error);
      });

      it("should have default attributes when artist is parsed with undefined properties", function() {
        var result = this.model.parse({"artist":{}});
        result.should.have.property("entity", "artist");
        result.should.have.property("id", "");
        result.should.have.property("name", "");
        result.should.have.property("url", "");
        result.should.have.property("mbid", "");
      });

      it("should have default attributes when album is parsed with undefined properties", function() {
        var result = this.model.parse({"album":{}});
        result.should.have.property("entity", "album");
        result.should.have.property("id", "");
        result.should.have.property("name", "");
        result.should.have.property("url", "");
        result.should.have.property("mbid", "");
      });

      it("should have name attribute when parsed with name property", function() {
        var result = this.model.parse({"artist":{"name":"Modest Mouse"}});
        result.should.have.property("name", "Modest Mouse");
      });

      it("should have id attribute when parsed with id property", function() {
        var result = this.model.parse({"artist":{"id":"2025359"}});
        result.should.have.property("id", "2025359");
      });

      it("should have id attribute when parsed without id but with url property", function() {
        var result = this.model.parse({"artist":{"url":"http:\/\/www.last.fm\/music\/Modest+Mouse"}});
        result.should.have.property("id", "http:\/\/www.last.fm\/music\/Modest+Mouse");
      });

      it("should have url attribute when parsed with url property", function() {
        var result = this.model.parse({"artist":{"url":"http:\/\/www.last.fm\/music\/Modest+Mouse"}});
        result.should.have.property("url", "http:\/\/www.last.fm\/music\/Modest+Mouse");
      });

      it("should have mbid attribute when parsed with mbid property", function() {
        var result = this.model.parse({"artist":{"mbid":"a96ac800-bfcb-412a-8a63-0a98df600700"}});
        result.should.have.property("mbid", "a96ac800-bfcb-412a-8a63-0a98df600700");
      });

      it("should have image array with non-empty text and size elements when parsed ", function() {
        var result = this.model.parse(ARTIST_IMAGES);
        result.images.should.have.length(3);
        result.images[0].should.have.property("url", "http://userserve-ak.last.fm/serve/126/886281.jpg");
        result.images[0].should.have.property("size", "large");
      });

      it("should have image array with 1 image when parsed with single image", function() {
        var response = {
          "artist": {
            "image": {
                "#text": "http://userserve-ak.last.fm/serve/126/886281.jpg",
                "size": "large"
              }
          }
        };
        var result = this.model.parse(response);
        result.images.should.have.length(1);
        result.images[0].should.have.property("url", "http://userserve-ak.last.fm/serve/126/886281.jpg");
        result.images[0].should.have.property("size", "large");
      });


      it("should have track array with non-empty text and size elements when parsed ", function() {
 
        var result = this.model.parse(ALBUM_TRACKS);
        result.tracks.should.have.length(3);
        result.tracks[0].should.have.property("rank", "1");
        result.tracks[0].artist.should.eql({
          "name":"Modest Mouse",
          "mbid":"a96ac800-bfcb-412a-8a63-0a98df600700",
          "url":"http:\/\/www.last.fm\/music\/Modest+Mouse"
        });
        result.tracks[0].should.have.property("mbid", "0764d5fc-e571-47cc-8917-cf55ff7f4de3");
        result.tracks[0].should.have.property("name", "Teeth Like God's Shoeshine");
        result.tracks[0].should.have.property("url", "http:\/\/www.last.fm\/music\/Modest+Mouse\/_\/Teeth+Like+God's+Shoeshine");
        result.tracks[0].should.have.property("downloadurl", "http:\/\/www.last.fm\/music\/Modest+Mouse\/_\/Teeth+Like+God's+Shoeshin\/FakeDownload");
      });

      it("should have track array with 1 track when parsed with single track", function() {
        var response = {
          "album": {
            "tracks": {
              "track": {
                "name":"Teeth Like God's Shoeshine",
                "duration":"414",
                "mbid":"0764d5fc-e571-47cc-8917-cf55ff7f4de3",
                "url":"http:\/\/www.last.fm\/music\/Modest+Mouse\/_\/Teeth+Like+God's+Shoeshine",
                "downloadurl": "http:\/\/www.last.fm\/music\/Modest+Mouse\/_\/Teeth+Like+God's+Shoeshin\/FakeDownload",
                "streamable": {
                  "#text":"0",
                  "fulltrack":"0"
                },
                "artist": {
                  "name":"Modest Mouse",
                  "mbid":"a96ac800-bfcb-412a-8a63-0a98df600700",
                  "url":"http:\/\/www.last.fm\/music\/Modest+Mouse"
                },
                "@attr": {
                  "rank":"1"
                }
              }
            }
          }
        };
        var result = this.model.parse(response);
        result.tracks.should.have.length(1);
        result.tracks[0].should.have.property("rank", "1");
        result.tracks[0].artist.should.eql({
          "name":"Modest Mouse",
          "mbid":"a96ac800-bfcb-412a-8a63-0a98df600700",
          "url":"http:\/\/www.last.fm\/music\/Modest+Mouse"
        });
        result.tracks[0].should.have.property("mbid", "0764d5fc-e571-47cc-8917-cf55ff7f4de3");
        result.tracks[0].should.have.property("name", "Teeth Like God's Shoeshine");
        result.tracks[0].should.have.property("url", "http:\/\/www.last.fm\/music\/Modest+Mouse\/_\/Teeth+Like+God's+Shoeshine");
        result.tracks[0].should.have.property("downloadurl", "http:\/\/www.last.fm\/music\/Modest+Mouse\/_\/Teeth+Like+God's+Shoeshin\/FakeDownload");
      });


      it("should have summary when parsed with bio summary", function() {
        var response = {
          "artist": {
            "bio": {
                "summary": "This is a summary",
                "content": "This is content"
              }
          }
        };
        var result = this.model.parse(response);

        result.should.have.property("summary", "This is a summary");
        result.should.have.property("content", "This is content");
      });

      it("should have summary when parsed with wiki summary", function() {
        var response = {
          "album": {
            "wiki": {
                "summary": "This is a summary",
                "content": "This is content"
              }
          }
        };
        var result = this.model.parse(response);

        result.should.have.property("summary", "This is a summary");
        result.should.have.property("content", "This is content");
      });

    });

    describe("#isAlbum", function() {
      it("should return true when entity is album", function() {
        this.model = new LastFmModel(this.model.parse({"album":{}}));
        this.model.isAlbum().should.be.true;
      });

      it("should return false when entity is not album", function() {
        this.model = new LastFmModel(this.model.parse({"artist":{}}));
        this.model.isAlbum().should.be.false;
      });
    });

    describe("#isArtist", function() {
      it("should return true when entity is artist", function() {
        this.model = new LastFmModel(this.model.parse({"artist":{}}));
        this.model.isArtist().should.be.true;
      });

      it("should return false when entity is not artist", function() {
        this.model = new LastFmModel(this.model.parse({"artist":{}}));
        this.model.isAlbum().should.be.false;
      });
    });


    describe("#getImageBySize", function() {
      it("should return image with size matching first sizeSort element", function() {
        this.model = new LastFmModel(this.model.parse(ARTIST_IMAGES));

        var image = this.model.getImageBySize(["large", "mega", "extralarge"]);
        image.size.should.equal("large");
        image.url.should.equal("http://userserve-ak.last.fm/serve/126/886281.jpg");
      });

      it("should return undefined when no valid image match is found", function() {
        this.model = new LastFmModel(this.model.parse(ARTIST_IMAGES));

        var image = this.model.getImageBySize(["small", "medium"]);
        expect(image).to.be.undefined;
      });

      it("should return image with size matching last sizeSort element", function() {
        this.model = new LastFmModel(this.model.parse(ARTIST_IMAGES));

        var image = this.model.getImageBySize(["small", "medium", "large"]);
        image.size.should.equal("large");
        image.url.should.equal("http://userserve-ak.last.fm/serve/126/886281.jpg");
      });

      it("should return image with size matching default sort", function() {
        this.model = new LastFmModel(this.model.parse(ARTIST_IMAGES));

        var image = this.model.getImageBySize();
        image.size.should.equal("large");
        image.url.should.equal("http://userserve-ak.last.fm/serve/126/886281.jpg");
      });
    });

    describe("#getTrack", function() {
      it("should return undefined when no track name is specified", function() {
        this.model = new LastFmModel(this.model.parse(ALBUM_TRACKS));

        var track = this.model.getTrack("", "Modest Mouse", "The Lonesome Crowded West");
        expect(track).to.be.undefined;

      });

      it("should return undefined when no artist name is specified", function() {
        this.model = new LastFmModel(this.model.parse(ALBUM_TRACKS));

        var track = this.model.getTrack("Heart Cooks Brain", "", "The Lonesome Crowded West");
        expect(track).to.be.undefined;

      });

      it("should return undefined when no album name is specified", function() {
        this.model = new LastFmModel(this.model.parse(ALBUM_TRACKS));

        var track = this.model.getTrack("Heart Cooks Brain", "Modest Mouse", "");
        expect(track).to.be.undefined;

      });


      it("should return undefined when no matching track is found", function() {
        this.model = new LastFmModel(this.model.parse(ALBUM_TRACKS));

        var track = this.model.getTrack("Cowboy Dan", "Modest Mouse", "The Lonesome Crowded West");
        expect(track).to.be.undefined;

      });

      it("should return track when matching track, artist, & album specified", function() {
        this.model = new LastFmModel(this.model.parse(ALBUM_TRACKS));

        var track = this.model.getTrack("Heart Cooks Brain", "Modest Mouse", "The Lonesome Crowded West");
        track.should.have.property("rank", "2");
        track.artist.should.eql({
          "name":"Modest Mouse",
          "mbid":"a96ac800-bfcb-412a-8a63-0a98df600700",
          "url":"http:\/\/www.last.fm\/music\/Modest+Mouse"
        });
        track.should.have.property("name", "Heart Cooks Brain");

      });
    });

  });
});