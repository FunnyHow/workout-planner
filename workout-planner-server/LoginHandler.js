var MongoClient = require('mongodb').MongoClient;

class LoginHandler {
    constructor() {
        // Connection URL
        this.database_url = 'mongodb://localhost:27017/workout-planner';
    }

    getUserByLoginToken(loginToken, callback) {
        // Use connect method to connect to the server
        MongoClient.connect(this.database_url, function (err, db) {
            db.collection("users", function (err2, users_collection) {
                users_collection.find({ loginToken: loginToken }, function (err3, user) {
                    callback(err3, user);
                });
            });
        });
    }

    getUserByEmail(email, callback) {
        // Use connect method to connect to the server
        MongoClient.connect(this.database_url, function (err, db) {
            db.collection("users", function (err2, users_collection) {
                users_collection.find({ email: email }, function (err3, user) {
                    callback(err3, user);
                });
            });
        });
    }

    checkCookieExpiry(user) {
        var currentTime = new Date().getTime();
        return (user.expiryDate > currentTime);
    }

    isLoggedIn(req, res) {
        var self = this;

        return new Promise(function (resolve, reject) {
            if (!req.cookies["loginToken"]) {
                reject('No login cookies present');
                return;
            }
            self.getUserByLoginToken(req.cookies["loginToken"], function (err3, user) {
                if (user != null) {
                    if (self.checkCookieExpiry(user)) {
                        var nowPlusADay = new Date().getTime() + (25 * 60 * 60 * 1000);
                        var cookieExpiration = new Date(nowPlusADay);
                        res.setCookie('loginToken', req.cookies["loginToken"], {
                            expires: cookieExpiration
                        });
                        resolve(true);
                    } else {
                        reject("Cookie expired");
                    }
                } else {
                    reject('No Login Token in the database matched provided');
                }
            });
        });
    }

    login(email, password, req, res) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.getUserByEmail(email, function (err3, user) {
                if(user == null) {
                    reject("User does not exist");
                } else {
                   resolve(true);
                }
            });
        });
    }
}

module.exports = LoginHandler;