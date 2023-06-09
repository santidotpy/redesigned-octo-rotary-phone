import passport from "passport";
import jwt from "jsonwebtoken";
import { createHash, validatePassword } from "../utils/bcrypt.js";
import { generateToken, verifyToken } from "../utils/jwt.js";
import { UserMongo } from "../dao/MongoDB/models/User.js";
import { sendEmailRecovery } from "../services/email.service.js";
import { tr } from "@faker-js/faker";

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
  // update last login
  // userBDD.last_login = new Date();
  userBDD.last_connection = new Date();
  await managerUser.updateElement(userBDD._id, userBDD);
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

export const logout = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).send("Please login first");
    }
    const decodedToken = jwt.verify(token, process.env.PRIVATE_KEY_JWT);
    const userBDD = await managerUser.getElementById(decodedToken.user.id);
    userBDD.last_connection = new Date();
    await managerUser.updateElement(userBDD._id, userBDD);
    req.session.destroy();
    res.clearCookie("jwt");
    res.send({ status: "success", message: "User logged out successfully" });
  } catch (error) {
    res.status(500).send(`An error occurred in Session: ${error}`);
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
    res
      .status(400)
      .send(
        "Invalid or expired token. Please go to /password-recovery to recover your password."
      );
  }
};

export const toSellOrNotToSell = async (req, res) => {
  const { user_id } = req.query;
  const user = await managerUser.getElementById(user_id);
  if (!user) {
    return res.status(401).send("User not found");
  }
  
  if (user._id.toString() === req.user._id.toString() || req.user.isadmin) {
    user.isSeller = !user.isSeller;
    await managerUser.updateElement(user_id, user);
    res.send({
      status: "success",
      message: `User updated successfully. User ${user.first_name} seller status is now ${user.isSeller}`,
    });
  } else {
    return res
      .status(401)
      .send("You are not authorized to change this user's seller status");
  }
};

export const uploadDocument = async (req, res) => {
  const { user_id} = req.query;
  const { files } = req;
  const newFiles = files.map((file) => {
    return {
      name: file.filename,
      reference: file.path.split('/src')[1],
    };
  });
  const user = await managerUser.getElementById(user_id);
  if (!user) {
    return res.status(401).send("User not found");
  }
  try {
    user.documents.push(...newFiles);
    await managerUser.updateElement(user_id, user);
    const {_id, documents} = await managerUser.getElementById(user_id);
    return res.send({
      status: "success",
      message: `Files successfully uploaded`,
      id: _id,
      documents: documents,
    });
  } catch (error) {
    return res.status(500).send("Error uploading documents");
  }
}
