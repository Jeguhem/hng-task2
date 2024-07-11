const request = require("supertest");
const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");
const app = require("../index");
const { sequelize } = require("../db"); // Adjusted import to use db.js

describe("/auth/login", () => {
  // Test successful login
  it("should login if email and password are correct", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "john.doe@example.com",
        password: "password", // Ensure this password matches the hashed password in your database
      })
      .expect(200);

    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("Login successful");
    expect(response.body.data).toHaveProperty("accessToken");
    expect(response.body.data.user).toMatchObject({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "1234567890", // Ensure these fields match your user data
    });
  });

  // Test validation errors
  it("should return validation errors if email or password is missing", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "",
        password: "",
      })
      .expect(422);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Valid email is required" }),
        expect.objectContaining({ msg: "Password is required" }),
      ])
    );
  });

  // Test authentication failed
  it("should return authentication failed if email or password is incorrect", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "john.doe@example.com",
        password: "wrongpassword",
      })
      .expect(401);

    expect(response.body.status).toBe("Bad request");
    expect(response.body.message).toBe("Authentication failed");
    expect(response.body.statusCode).toBe(401);
  });
});

// Close the database connection after all tests
afterAll(async () => {
  await sequelize.close();
});
