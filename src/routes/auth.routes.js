import { Router } from "express";
import passport from "passport";
import {upload} from "../middlewares/images.js";
import { passportError, authorization, authorizationUser } from "../utils/messageError.js";
import {
  getUsers,
  loginValidation,
  logout,
  recoverPassword,
  resetPassword,
  toSellOrNotToSell,
  uploadDocument,
} from "../controllers/auth.controller.js";

const routerAuth = Router();

routerAuth.get("/signup", (req, res) => {
  res.render("auth/signup");
});

routerAuth.post(
  "/signup",
  passport.authenticate("register"),
  async (req, res) => {
    res.send({ status: "success", message: "User created successfully" });
  }
);

routerAuth.get("/login", (req, res) => {
  if (req.session.login) {
    res.redirect("../api/products");
  } else {
    res.render("auth/login");
  }
});

routerAuth.post("/login", loginValidation);

routerAuth.get("/logout", logout);
// (req, res) => {
  // if (req.session.login) {
  //   req.session.destroy(() => {
  //     console.log("Session destroyed");
  //     res.redirect("../");
  //   });
  //   return;
  // }

  // res.redirect("../");
// });

routerAuth.get("/users", getUsers);

routerAuth.post("/users/documents/profile", upload.array("profile"), uploadDocument);

routerAuth.post("/users/documents/product", upload.array("product"), uploadDocument);


routerAuth.get(
  "/testJWT",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const username = req.user.first_name;
    res.send({ status: "success", message: `Welcome ${username}` });
  }
);

routerAuth.get(
  "/current",
  passportError("jwt"),
  authorization(),
  async (req, res) => {
    const username = req.user.first_name;
    res.send({ message: `Welcome ${username}` });
  }
);

// password recovery
routerAuth.get("/password-recovery", recoverPassword);

routerAuth.post("/reset-password", resetPassword);

routerAuth.get(
  "/users/is-seller",
  passportError("jwt"),
  authorizationUser(),
  toSellOrNotToSell
);
export default routerAuth;
