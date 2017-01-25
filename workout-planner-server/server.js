var LoginHandler = require("./LoginHandler");
var CookieParser = require('restify-cookies');
var restify = require('restify');

var listeningPort = 7777;
var server = restify.createServer();

server.use(CookieParser.parse);
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// curl -XGET -i localhost:7777/ -H "Cookie: COOKIEGOESHERE"
server.get('/', function (req, res, next) {
    loginHandler = new LoginHandler();
    loginHandler.isLoggedIn(req, res)
        .then(function() {
            res.send(200, "You are logged in");
            next();
        }, function(reason) {
            res.send(401, reason);
            next();
        });
});

// curl -XPOST -i localhost:7777/login -d '{"email": "someuser@example.com", "password": "password"}' -H "Content-Type: application/json"
server.post('/login', function (req, res, next) {
    loginHandler = new LoginHandler();
    loginHandler.login(req.body.email, req.body.password, req, res)
        .then(function() {
            res.send(200, "You are logged in");
            next();
        }, function(reason) {
            res.send(401, reason);
            next();
        });
});

// curl -XDELETE -i localhost:7777/login -H "Cookie: COOKIEGOESHERE"
server.del('/login', function (req, res, next) {
    loginHandler = new LoginHandler();
    loginHandler.logout(req, res)
        .then(function() {
            res.send(200, "You are logged out");
            next();
        }, function(reason) {
            res.send(500, reason);
            next();
        });
});

server.listen(listeningPort);

