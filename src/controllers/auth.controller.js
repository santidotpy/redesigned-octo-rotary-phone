import passport from "passport";
import jwt from "jsonwebtoken";
import { createHash, validatePassword } from "../utils/bcrypt.js";
import { generateToken, verifyToken } from "../utils/jwt.js";
import { UserMongo } from "../dao/MongoDB/models/User.js";
import { sendEmailRecovery } from "../services/email.service.js";

export const managerUser = new UserMongo();

export const getUsers = async (req, res, page) => {
  try {
    const page = req.query.page || 1;
    const users = await managerUser.getElements(page);
    res.send(users);
  } catch (e) {
    res.status(500).send({ status: "error", message: "Internal Server Error" });
  }
};

export const loginValidation = async (req, res, next) => {
  try {
    passport.authenticate(
      "jwt",
      { session: false },
      async (err, user, info) => {
        if (err) {
          throw new Error("Error authenticating user");
        }
        if (!user) {
          await loginUser(req, res);
        } else {
          await validateToken(req, res, next);
        }
      }
    )(req, res, next);
  } catch (error) {
    res.status(500).send(`An error occurred in Session: ${error}`);
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const userBDD = await managerUser.getUserByEmail(email);
  if (!userBDD) {
    return res.status(401).send("User not found");
  }
  if (!validatePassword(password, userBDD.password)) {
    return res.status(401).send("Invalid password");
  }
  const token = generateToken({ user: { id: userBDD._id } });
  setCookie(res, token);
  return res.status(200).json({ token });
};

const validateToken = async (req, res, next) => {
  const token = req.cookies.jwt;
  try {
    const decodedToken = jwt.verify(token, process.env.PRIVATE_KEY_JWT);
    req.user = decodedToken.user;
    next();
  } catch (err) {
    return res.status(401).send("Invalid token");
  }
};

// revisar esto 
// const generateToken = (userId) => {
//   return jwt.sign({ user: { id: userId } }, process.env.PRIVATE_KEY_JWT);
// };

const setCookie = (res, token) => {
  res.cookie("jwt", token, { httpOnly: true });
};

export const getUserEmail = async (userId) => {
  const user = await managerUser.getElementById(userId);
  return user.email;
};

// recover password, only withing one hour
export const recoverPassword = async (req, res) => {
  const { email } = req.body;
  const userBDD = await managerUser.getUserByEmail(email);
  if (!userBDD) {
    return res.status(401).send("User not found");
  }
  const token = generateToken({ userBDD }, "1h");
  const link = `http://localhost:3000/auth/reset-password?token=${token}`;
  // send email with link
  await sendEmailRecovery(email, link);
  res.send({
    status: "success",
    message: "An email has been sent to recover your password",
  });
};

// reset password
export const resetPassword = async (req, res) => {
  const { token } = req.query;
  const { password } = req.body;
  try {
    const decodedToken = verifyToken(token);
    const userBDD = await managerUser.getElementById(decodedToken.userBDD._id);
    if (!userBDD) {
      return res.status(401).send("User not found");
    }
    const newPassword = createHash(password);
    if (validatePassword(password, userBDD.password)) {
      return res.status(401).send("New password must be different");
    }
    userBDD.password = newPassword;
    await managerUser.updateElement(userBDD._id, userBDD);

    //const expirationTime = new Date(decodedToken.exp * 1000); // Convert expiration timestamp to Date object
    res.send({
      status: "success",
      message: "Password updated",
      //expiration: expirationTime,
    });
  } catch (error) {
    res.status(400).send("Invalid or expired token");
  }
};
