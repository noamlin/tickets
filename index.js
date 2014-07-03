var expressApp = require('./app.js');

var server = expressApp.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
