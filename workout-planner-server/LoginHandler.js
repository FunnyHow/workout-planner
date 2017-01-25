var MongoClient = require('mongodb').MongoClient;
var uuid = require('uuid/v1');
const crypto = require('crypto');
class LoginHandler {
    constructor() {
        // Connection URL
        this.database_url = 'mongodb://localhost:27017/workout-planner';
    }

    getUserByLoginToken(loginToken, callback) {
        // Use connect method to connect to the server
        MongoClient.connect(this.database_url, function (err, db) {
            db.collection("users", function (err2, users_collection) {
                users_collection.find({ loginToken: loginToken }, function (err3, cursor) {
                    cursor.next().then(function(user) {
                        callback(err3, user);
                    });
                });
            });
        });
    }

    getUserByEmail(email, callback) {
        // Use connect method to connect to the server
        MongoClient.connect(this.database_url, function (err, db) {
            db.collection("users", function (err2, users_collection) {
                users_collection.find({ email: email }, function (err3, cursor) {
                    cursor.next().then(function(user) {
                        callback(err3, user);
                    });
                });
            });
        });
    }

    clearLoginToken(loginToken) {
        // Use connect method to connect to the server
        MongoClient.connect(this.database_url, function (err, db) {
            db.collection("users", function (err2, users_collection) {
                users_collection.updateOne({ loginToken: loginToken }, { $set:{ loginToken: null }});
            });
        });
    }

    setLoginToken(email, loginToken) {
        // Use connect method to connect to the server
        MongoClient.connect(this.database_url, function (err, db) {
            db.collection("users", function (err2, users_collection) {
                users_collection.updateOne({ email: email }, { $set: { loginToken: loginToken } });
            });
        });
    }

    extendingCookie(res, loginToken) {
        var nowPlusADay = new Date().getTime() + (25 * 60 * 60 * 1000);
        var cookieExpiration = new Date(nowPlusADay);
        res.setCookie('loginToken', loginToken, {
            expires: cookieExpiration
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
                        self.extendingCookie(res, req.cookies["loginToken"]);
                        resolve(true);
                    } else {
                        reject("Cookie expired");
                        self.logout();
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
                if (user == null || password == null) {
                    reject("Incorrect username or password.");
                } else {
                    var hash = crypto.createHash('sha256');
                    var saltedPassword = user.salt + password;
                    hash.update(saltedPassword);
                    var hashedPassword = hash.digest("hex");
                    if (user.passwordHash === hashedPassword) {
                        var loginToken = uuid();
                        self.setLoginToken(user.email, loginToken);
                        self.extendingCookie(res, loginToken);
                        resolve(true);
                    } else {
                        reject("Incorrect username or password.");
                    }

                }
            });
        });
    }

    logout(req, res) {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (!req.cookies["loginToken"]) {
                reject('No login cookies present');
                return;
            }
            self.clearLoginToken(req.cookies["loginToken"]);
            res.clearCookie("loginToken", req.cookies["loginToken"]);
            resolve();
        });
    }
}

module.exports = LoginHandler;