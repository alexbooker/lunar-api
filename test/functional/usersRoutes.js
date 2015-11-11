import chai from "chai";
import config from "config";
import db from "sequelize-context";
import server from "../../server.js";
import request from "supertest-as-promised";

const expect = chai.expect;

suite("users routes", function() {

  setup(function() {
    return db
      .connection
      .sync({
        force: true
      });
  });

  test("post with empty req body should return status code 400", function() {
    return request(server)
      .post("/users")
      .expect(400);
  });

  test("post with invalid req body should return status code 400 and errors", function(
    done) {
    return request(server)
      .post("/users")
      .send({
        username: "",
        password: "",
        email: ""
      })
      .end(function(err, res) {
        expect(res.status).to.equal(400);
        expect(res.body).to.have.length(3);
        done();
      });
  });


  test("post with valid req body should return status code 201", function() {
    return request(server)
      .post("/users")
      .send({
        username: "username1",
        password: "passw0rd",
        email: "username@domain.com"
      })
      .expect(201);
  });


  test("post with valid req body should store user in the db", function () {
    const user = {
      username: "username1",
      password: "passw0rd",
      email: "username@domain.com"
    };
    return request(server)
      .post("/users")
      .send(user)
      .then(function(res) {
        return db
          .models
          .User
          .findOne({
            where: {
              username: "username1"
            }
          })
          .then(function(user) {
            expect(user).to.exist;
          });
      });

  });

});
