var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.send("response with tabs		spaces  and breaks\n\n\nlike this");
});

module.exports = router;
