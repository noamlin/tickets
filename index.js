var expressApp = require('./app.js');

var server = expressApp.listen(3000, function() {
    console.log('Server listening on port %d in %s mode', server.address().port, process.env.NODE_ENV);
});
