var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
    res.render('index', {title: 'dMVC Home'});
});

module.exports = router;
