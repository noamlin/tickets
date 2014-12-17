var dust = require('dustjs-linkedin');
var fs = require('fs');

function renderTemplate(template, data, callback) {
	dust.render(
		template,
		data,
		function(err, out) {
			if(err) {
				console.log(err);
				callback("Error Compiling And Rendering Page");
			}
			else {
				callback(out);
			}
		}
	);
}

function checkTemplate(templatePath, data, callback) {
	var template = templatePath.replace(/[\/\.]/g, '_'); // build template's name based on file name
	if(!dust.cache[template]) { // check if already exists (previously created and cached)
		fs.readFile(__dirname+'/../views/'+templatePath, 'utf8', function(err, fileContents) {
			if(err) {
				console.log(err);
				callback("Could not read file");
			}
			else {
				if(process.env.NODE_ENV === 'development') {
					dust.optimizers.format = function(ctx, node) { return node }; // do not clear white-spaces
				}
				dust.loadSource( dust.compile(fileContents, template) ); // compiles and loads the template's file. this should occur only once per template
				renderTemplate(template, data, callback);
			}
		});
	}
	else
		renderTemplate(template, data, callback);
}

module.exports = function(req, res, next) {
	res.dustRender = checkTemplate;
	next();
}