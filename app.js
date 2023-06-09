const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "userData.db");
const app = express();
const bcrypt = require("bcrypt");
app.use(express.json());
let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, gender, location, password } = request.body;

  const CheckUser = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await database.get(CheckUser);
  const hashedPass = await bcrypt.hash(password, 10);

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const insetDeatils = `INSERT INTO user
        (name,username,password,gender,location)
        VALUES('${name}','${username}','${hashedPass}','${gender}','${location}')`;

      await database.run(insetDeatils);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const checkUSer = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await database.get(checkUSer);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const checkUser = `SELECT * FROM user WHERE username='${username}'`;

  const dbUser = await database.get(checkUser);

  const checkPassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (checkPassword === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedNewPassword = await bcrypt.hash(request.body.newPassword, 10);

      const updatePass = `UPDATE  user SET password='${hashedNewPassword}' 
        WHERE username='${username}'`;

      await database.run(updatePass);
      response.status(200);
      response.send("Password updated");
    }
  }
});
module.exports = app;
