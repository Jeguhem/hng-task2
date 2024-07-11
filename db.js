const bcrypt = require("bcrypt");
const { Sequelize, INTEGER, STRING } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

sequelize
  .authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.log("Error: " + err));

const User = sequelize.define("User", {
  userId: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  },
  firstName: {
    type: STRING,
    allowNull: false,
  },
  lastName: {
    type: STRING,
    allowNull: false,
  },
  email: {
    type: STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: STRING,
    allowNull: false,
  },
  phone: {
    type: STRING,
  },
});

const Organisation = sequelize.define("Organisation", {
  orgId: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  },
  name: {
    type: STRING,
    allowNull: false,
  },
  description: {
    type: STRING,
  },
});

User.belongsToMany(Organisation, { through: "UserOrganisations" });
Organisation.belongsToMany(User, { through: "UserOrganisations" });

// Ensure the User model is properly created in the database
sequelize
  .sync({ alter: true })
  .then(() => console.log("User model synchronized"))
  .catch((err) => console.log("Error synchronizing User model:", err));

module.exports = { User, Organisation, sequelize };
