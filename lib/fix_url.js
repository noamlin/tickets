module.exports = function(req, res, next) {
    if(req.originalUrl.length > 1 && req.originalUrl.match(/\/+$/) !== null) { // address ends with too many slashes
        var newUrl = req.protocol + "://" + req.headers.host.replace(/www\./, "") + req.originalUrl.replace(/\/+$/, ''); // remove slashes and by the way remove www too
        res.redirect(302, newUrl);
    }
    else if(req.subdomains.slice(-1)[0] == "www") { // address has www
        var newUrl = req.protocol + "://" + req.headers.host.replace(/www\./, "")+req.originalUrl; // remove www
        res.redirect(302, newUrl);
        return false;
    }
    else {
        next();
    }
}