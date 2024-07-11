const express = require("express");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User, Organisation, sequelize } = require("./db"); // Adjust the path to match your db.js file
require("dotenv").config();

const app = express();
app.use(express.json());

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Validate User Middleware
const validateUser = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// User Registration Endpoint
app.post("/auth/register", validateUser, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { firstName, lastName, email, password, phone } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
    });

    const token = jwt.sign({ id: newUser.userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      status: "success",
      message: "Registration successful",
      data: {
        accessToken: token,
        user: {
          userId: newUser.userId,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
        },
      },
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(400).json({
      status: "Bad request",
      message: "Registration unsuccessful",
      statusCode: 400,
      error: err.message,
    });
  }
});

// User Login Endpoint
app.post(
  "/auth/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const userRecord = await User.findOne({ where: { email } });

      if (userRecord && bcrypt.compareSync(password, userRecord.password)) {
        const token = jwt.sign(
          { id: userRecord.userId },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.status(200).json({
          status: "success",
          message: "Login successful",
          data: {
            accessToken: token,
            user: {
              userId: userRecord.userId,
              firstName: userRecord.firstName,
              lastName: userRecord.lastName,
              email: userRecord.email,
              phone: userRecord.phone,
            },
          },
        });
      } else {
        res.status(401).json({
          status: "Bad request",
          message: "Authentication failed",
          statusCode: 401,
        });
      }
    } catch (err) {
      console.error("Error during login:", err);
      res.status(400).json({
        status: "Bad request",
        message: "Login unsuccessful",
        statusCode: 400,
        error: err.message,
      });
    }
  }
);

// Create Organisation Endpoint
app.post(
  "/api/organisations",
  [
    body("name").notEmpty().withMessage("Organisation name is required"),
    body("description").optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { name, description } = req.body;
      const newOrganisation = await Organisation.create({
        name,
        description,
      });

      res.status(201).json({
        status: "success",
        message: "Organisation created successfully",
        data: newOrganisation,
      });
    } catch (err) {
      console.error("Error creating organisation:", err);
      res.status(400).json({
        status: "Bad request",
        message: "Organisation creation unsuccessful",
        statusCode: 400,
        error: err.message,
      });
    }
  }
);

// Get User Endpoint
app.get("/api/users/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
        statusCode: 404,
      });
    }

    res.status(200).json({
      status: "success",
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      statusCode: 500,
    });
  }
});

// Get All Organisations Endpoint
app.get("/api/organisations", authenticateJWT, async (req, res) => {
  try {
    const organisations = await Organisation.findAll();
    res.status(200).json({
      status: "success",
      message: "Organisations retrieved successfully",
      data: {
        organisations,
      },
    });
  } catch (err) {
    console.error("Error fetching organisations:", err);
    res.status(500).json({
      status: "error",
      message: "Server error",
      statusCode: 500,
      error: err.message,
    });
  }
});

// Get Organisation by ID Endpoint
app.get("/api/organisations/:orgId", authenticateJWT, async (req, res) => {
  try {
    const orgId = req.params.orgId;
    const organisation = await Organisation.findOne({ where: { orgId } });

    if (!organisation) {
      return res.status(404).json({
        status: "error",
        message: "Organisation not found",
        statusCode: 404,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Organisation retrieved successfully",
      data: organisation,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      statusCode: 500,
    });
  }
});

// Add User to Organisation Endpoint
app.post(
  "/api/organisations/:orgId/users",
  [body("userId").notEmpty().withMessage("User ID is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const orgId = req.params.orgId;
      const { userId } = req.body;

      // Check if user and organisation exist
      const user = await User.findOne({ where: { userId } });
      const organisation = await Organisation.findOne({ where: { orgId } });

      if (!user || !organisation) {
        return res.status(404).json({
          status: "error",
          message: "User or Organisation not found",
          statusCode: 404,
        });
      }

      // Add user to organisation
      await organisation.addUser(user);

      res.status(200).json({
        status: "success",
        message: "User added to organisation successfully",
      });
    } catch (err) {
      console.error("Error adding user to organisation:", err);
      res.status(400).json({
        status: "Bad request",
        message: "Failed to add user to organisation",
        statusCode: 400,
        error: err.message,
      });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
