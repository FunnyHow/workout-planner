
"use strict";
var assert = require('assert');
var mockery = require("mockery");
var sinon = require("sinon");

describe('LoginHandler', function () {
    var mockRequest, mongodbMock, mockDb, mockCollection, mockDocument;
    beforeEach(function () {
        // Delete the module being tested and the dependent modules from the require cache
        delete require.cache[require.resolve("mongodb")];
        delete require.cache[require.resolve("../LoginHandler")];

        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });

        mockDocument = {
            email: "someuser@example.com",
            loginToken: "1nu32h1b3h21jh245",
            expiryDate: new Date().getTime() + 100000
        };

        mockCollection = {
            // Mocked the find method to return our mocked document above
            find: sinon.stub().callsArgWith(1, null, mockDocument)
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
            return loginHandler.isLoggedIn(mockRequest)
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
            return loginHandler.isLoggedIn(mockRequest)
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
            return loginHandler.isLoggedIn(mockRequest)
                .then(function (isLoggedIn) {
                    throw "Expected promise to reject";
                }, function (reason) {
                    sinon.assert.called(mockCollection.find);
                    sinon.assert.calledWith(mockCollection.find, { loginToken: "1nu32h1b3h21jh245" });
                });
        });

        it('should resolve false if the cookie in the database has expired', function () {
            var LoginHandler = require('../LoginHandler');
            var loginHandler = new LoginHandler();
            mockCollection.find = sinon.stub().callsArgWith(1, null,
                {
                    email: "someuser@example.com",
                    loginToken: "1nu32h1b3h21jh245",
                    expiryDate: new Date().getTime() - 10000
                }
            );
            return loginHandler.isLoggedIn(mockRequest)
                .then(function (isLoggedIn) {
                    throw "Expected promise to reject";
                }, function (reason) {
                    sinon.assert.called(mockCollection.find);
                    sinon.assert.calledWith(mockCollection.find, { loginToken: "1nu32h1b3h21jh245" })
                });
        });
        it('should extend the expiry time of the existing cookie if the user is logged in already');
    });
});