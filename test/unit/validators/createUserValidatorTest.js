import chai from "chai";
import mockery from "mockery";
import httpMocks from "node-mocks-http";
import sinon from "sinon";
import Promise from "bluebird";
import chaiAsPromised from "chai-as-promised";
import mochaUtils from "leche";

chai.use(chaiAsPromised);
const expect = chai.expect;

function requireSut(validateAvailabilityStub) {
  const contextMock = {
    models: {
      User: {
        validateAvailability: validateAvailabilityStub
      }
    }
  };
  mockery.registerMock("sequelize-context", contextMock);
  return require("../../../validators/createUserValidator.js");
}

suite("createUserValidator", function() {

  setup(function() {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });
  });

  teardown(function() {
    mockery.disable();
  });

  test("exports module", function() {
    const sut = require("../../../validators/createUserValidator.js");
    expect(sut)
      .to
      .not
      .be
      .empty;
  });

  test("validateBody() returns an empty error array when input is valid",
    function() {
      const validateAvailabilityStub = function() {
        return new Promise(resolve => resolve([]));
      };
      const sut = requireSut(validateAvailabilityStub);
      const req = httpMocks.createRequest({
        body: {
          username: "username",
          password: "some password",
          email: "username@domain.com"
        }
      });
      const res = {};
      return expect(sut.validateBody(req, res))
        .to
        .eventually
        .have
        .length(0);
    });

  const invalidUsernames = {
    "empty username": "",
    "username shorter than 3 chars": "a",
    "username containing symbols": "username$",
    "username containing spaces": "user name",
    "username that isn't a string": 42,
    "username longer than 30 chars": new Array(31 + 1).join("x")
  };
  for (const key in invalidUsernames) {
    test(`validateBody() with ${key} should return an error`, function(done) {
      // setup
      const invalidUsername = invalidUsernames[key];
      const validateAvailabilityStub = function() {
        return new Promise(resolve => resolve([]));
      };
      const sut = requireSut(validateAvailabilityStub);
      const req = httpMocks.createRequest({
        body: {
          username: invalidUsername,
          password: "some password",
          email: "username@domain.com"
        }
      });
      const res = {};

      // exercise
      sut
        .validateBody(req, res)
        .then(function(errors) {
          expect(errors)
            .to
            .have
            .length(1,
              `expected input "${invalidUsername}" to cause an error, but it didn't.`
            );
          done();
          // verify
          expect(errors[0].message)
            .to
            .contain("username");
          expect(errors[0].path)
            .to
            .equal("username");
        });
    });
  }

  const invalidPasswords = {
    "empty password": "",
    "password shorer than 6 chars": "passw",
    "password that isn't a string": 42,
  };
  for (const key in invalidPasswords) {
    test(`validateBody() with ${key} should return an error`, function() {
      // setup
      const invalidPassword = invalidPasswords[key];
      const validateAvailabilityStub = function() {
        return new Promise(resolve => resolve([]));
      };
      const sut = requireSut(validateAvailabilityStub);
      const req = httpMocks.createRequest({
        body: {
          username: "username",
          password: invalidPassword,
          email: "username@domain.com"
        }
      });
      const res = {};

      // exercise
      sut
        .validateBody(req, res)
        .then(function(errors) {
          // verify
          expect(errors)
            .to
            .have
            .length(1,
              `expected input "${invalidPassword}" to cause an error, but it didn't.`
            );
          expect(errors[0].message)
            .to
            .contain("password");
          expect(errors[0].path)
            .to
            .equal("password");
        });
    });
  }


  const invalidEmails = {
    "empty email": "",
    "invalid email": "email",
    "email that isn't a string": 42,
  };
  for (const key in invalidEmails) {
    test(`validateBody() with ${key} should return an error`, function() {
      // setup
      const invalidEmail = invalidEmails[key];
      const validateAvailabilityStub = function() {
        return new Promise(resolve => resolve([]));
      };
      const sut = requireSut(validateAvailabilityStub);
      const req = httpMocks.createRequest({
        body: {
          username: "username",
          password: "some password",
          email: invalidEmail
        }
      });
      const res = {};

      // exercise
      sut
        .validateBody(req, res)
        .then(function(errors) {
          // verify
          expect(errors)
            .to
            .have
            .length(1,
              `expected input "${invalidEmail}" to cause an error, but it didn't.`
            );
          expect(errors[0].message)
            .to
            .contain("email");
          expect(errors[0].path)
            .to
            .equal("email");
        });
    });
  }


  test(
    "validateBody() returns populated errors array when unknown field is present",
    function() {
      const validateAvailabilityStub = function() {
        return new Promise(resolve => resolve([]));
      };
      const sut = requireSut(validateAvailabilityStub);
      const req = httpMocks.createRequest({
        body: {
          username: "username",
          password: "some password",
          email: "foo@bar.com",
          foo: "fosdfsf"
        }
      });
      const res = {};
      return expect(sut.validateBody(req, res))
        .to
        .eventually
        .have
        .length(1);
    });

  test(
    "validateBody() returns populated errors array when username is taken",
    function() {
      const validateAvailabilityStub = function() {
        return new Promise(resolve => resolve([
          "\"username\" is taken"
        ]));
      };
      const sut = requireSut(validateAvailabilityStub);
      const req = httpMocks.createRequest({
        body: {
          username: "username",
          password: "some password",
          email: "foo@bar.com",
        }
      });
      const res = {};
      expect(sut.validateBody(req, res))
        .to
        .eventually
        .have
        .length(1);
    });

  test("validateAvailability() can return many errors", function() {
    const validateAvailabilityStub = function() {
      return new Promise(resolve => resolve([
        "\"username\" is taken"
      ]));
    };
    const sut = requireSut(validateAvailabilityStub);
    const req = httpMocks.createRequest({
      body: {
        username: "",
        password: "",
        email: "",
      }
    });
    const res = {};
    return expect(sut.validateBody(req, res))
      .to
      .eventually
      .have
      .length(4);
  });
});
