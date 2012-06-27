define(function(require) {
  var PlayerModel = require('models/PlayerModel');
  
  describe('PlayerModel Tests', function() {
    describe('PlayerModel', function() {
      var player = new PlayerModel();
      it('should have proper defaults', function(done) {
          expect(player.get('paused')).to.equal(true);
          expect(player.get('muted')).to.equal(false);
          done();
      });
    });
  });
}); 