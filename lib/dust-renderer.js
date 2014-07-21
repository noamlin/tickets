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
	var template = templatePath.replace(/[\/\.]/g, '_');
	if(!dust.cache[template]) {
		fs.readFile(__dirname+'/../views/'+templatePath, 'utf8', function(err, fileContents) {
			if(err) {
				console.log(err);
				callback("Could not read file");
			}
			else {
				dust.loadSource( dust.compile(fileContents, template) );
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