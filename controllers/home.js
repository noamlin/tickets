module.exports = function(req, res) {
	res.dustRender(
		"home.dust",
		{
			lang: "en",
			title: "The Tickets Network - fast and robust online ticketing solution for all types of events"
		},
		function(output) {
			res.send(output);
		}
	);
}