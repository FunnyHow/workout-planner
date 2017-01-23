
"use strict";
var assert = require('assert');
var mockery = require("mockery");
var sinon = require("sinon");

describe('LoginHandler', function () {
    var mockRequest, mongodbMock, mockDb, mockCollection, mockDocument, mockResponse;
    beforeEach(function () {
        // Delete the module being tested and the dependent modules from the require cache
        delete require.cache[require.resolve("mongodb")];
        delete require.cache[require.resolve("../LoginHandler")];

        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });

        mockResponse = {
            setCookie: sinon.stub(),
            clearCookie: sinon.stub()
        }

        mockDocument = {
            email: "someuser@example.com",
            password: "hocuspocus",
            salt: "SALT",
            loginToken: "1nu32h1b3h21jh245",
            expiryDate: new Date().getTime() + 100000
        };

        mockCollection = {
            // Mocked the find method to return our mocked document above
            find: sinon.stub().callsArgWith(1, null, mockDocument),
            updateOne: sinon.stub()
        };

        mockDb = {
            // Mock collection to give above mock collection with no error
            collection: sinon.stub().callsArgWith(1, null, mockCollection)
        };

        mongodbMock = {
            MongoClient: {
                // Mock connect to give the above mock database with no error
                connect: sinon.stub().callsArgWith(1, null, mockDb)
            }
        };

        mockery.registerMock('mongodb', mongodbMock);

        mockRequest = {
            cookies: {
                loginToken: "1nu32h1b3h21jh245"
            }
        };
    });
    describe('#isLoggedIn()', function () {
        it('should look for the cookie in the database.', function () {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            return loginHandler.isLoggedIn(mockRequest, mockResponse)
                .then(function (isLoggedIn) {
                    sinon.assert.called(mockCollection.find);
                    sinon.assert.calledWith(mockCollection.find, { loginToken: "1nu32h1b3h21jh245" })
                    assert(isLoggedIn);
                });
        });

        it('should reject if no cookie is provided.', function () {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            mockRequest.cookies = {}
            return loginHandler.isLoggedIn(mockRequest, mockResponse)
                .then(function (isLoggedIn) {
                    throw "Expected promise to reject";
                }, function (reason) {
                    sinon.assert.notCalled(mockCollection.find);
                });
        });

        it('should resolve false if the cookie is present but the database doesnt have it', function () {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            mockCollection.find = sinon.stub().callsArgWith(1, null, null);
            return loginHandler.isLoggedIn(mockRequest, mockResponse)
                .then(function (isLoggedIn) {
                    throw "Expected promise to reject";
                }, function (reason) {
                    sinon.assert.called(mockCollection.find);
                    sinon.assert.calledWith(mockCollection.find, { loginToken: "1nu32h1b3h21jh245" });
                });
        });

        it('should reject if the cookie in the database has expired', function () {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            mockCollection.find = sinon.stub().callsArgWith(1, null,
                {
                    email: "someuser@example.com",
                    loginToken: "1nu32h1b3h21jh245",
                    expiryDate: new Date().getTime() - 10000
                }
            );
            return loginHandler.isLoggedIn(mockRequest, mockResponse)
                .then(function (isLoggedIn) {
                    throw "Expected promise to reject";
                }, function (reason) {
                    sinon.assert.called(mockCollection.find);
                    sinon.assert.calledWith(mockCollection.find, { loginToken: "1nu32h1b3h21jh245" })
                });
        });

        it('should call logout if the cookie in the database has expired', function () {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            mockCollection.find = sinon.stub().callsArgWith(1, null,
                {
                    email: "someuser@example.com",
                    loginToken: "1nu32h1b3h21jh245",
                    expiryDate: new Date().getTime() - 10000
                }
            );
            // Track any calls to loginHandler.logout
            var logoutSpy = sinon.spy(loginHandler, "logout");
            return loginHandler.isLoggedIn(mockRequest, mockResponse)
                .then(function (isLoggedIn) {
                    throw "Expected promise to reject";
                }, function (reason) {
                    // Check that logout is called
                    sinon.assert.called(logoutSpy);
                });
        });

        it('should extend the expiry time of the existing cookie if the user is logged in already', function () {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            return loginHandler.isLoggedIn(mockRequest, mockResponse)
                .then(function (isLoggedIn) {
                    sinon.assert.called(mockResponse.setCookie);
                    assert.equal(mockResponse.setCookie.getCall(0).args[0], "loginToken");
                    assert.equal(mockResponse.setCookie.getCall(0).args[1], "1nu32h1b3h21jh245");
                    assert(new Date().getTime() - mockResponse.setCookie.getCall(0).args[2].expires.getTime() < -(24 * 60 * 60 * 1000));
                });
        });
    });

    describe('#login()', function () {
        it('should find the username provided', function () {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            return loginHandler.login("someuser@example.com", "password", mockRequest, mockResponse)
                .then(function (login) {
                    sinon.assert.called(mockCollection.find);
                    sinon.assert.calledWith(mockCollection.find, { email: "someuser@example.com" })
                });
        });

        it('should reject if email does not match one in the database', function () {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            mockCollection.find = sinon.stub().callsArgWith(1, null, null);
            return loginHandler.login("drPlatypus@pretendemail.com", "password", mockRequest, mockResponse)
                .then(function (login) {
                    throw "Expected promise to reject";
                }, function (reason) {
                    sinon.assert.called(mockCollection.find);
                    sinon.assert.calledWith(mockCollection.find, { email: "drPlatypus@pretendemail.com" })
                });
        });

        it('should hash and salt the password provided');
        it('should find the hashed and salted password for the user in the database');
        it('should check that the cookie has been set');
        it('should check that the password is correct');
    });

    describe('#logout()', function () {
        it('should clear the cookie on the request', function () {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            return loginHandler.logout(req, res)
                .then(function (logout) {
                    sinon.assert.called(mockResponse.clearCookie);
                    sinon.assert.calledWith(mockResponse.clearCookie, "loginToken");
                });
        });

        it('should clear the loginToken in mongo', function() {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            return loginHandler.logout(req, res)
                .then(function (logout) {
                    sinon.assert.called(mockCollection.updateOne);
                    var args = mockCollection.updateOne.getCall(0).args;
                    assert.deepEqual(args[0], { loginToken: "1nu32h1b3h21jh245" });
                    assert.deepEqual(args[1], { loginToken: null });
                });
        });
    });
});