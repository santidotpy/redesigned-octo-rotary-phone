// import { validationResult } from "express-validator";
// import jwt from "jsonwebtoken";

// export const authToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];

//   const token = authHeader && authHeader.split(" ")[1].toString();

//   if (!token) return res.status(401).send({ msg: "Falta access token" });

//   jwt.verify(token, process.env.SECRET_ACCESS_TOKEN || "", (err, user) => {
//     if (err) return res.status(403).send({ msg: "No autorizado" });

//     req.body.user = user;

//     next();
//   });
// };

// export const validate = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     let errorsArr = {};
//     const nonDupParams = [...new Set(errors.array().map((e) => e.param))];
//     for (const param of nonDupParams) {
//       errorsArr = {
//         ...errorsArr,
//         [param]: errors
//           .array()
//           .filter((t) => t.param == param)
//           .map((d) => d.msg),
//       };
//     }
//     console.log(errorsArr);
//     return res.status(400).send({ msg: "Datos incorrectos/incompletos", errorsArr });
//   }
//   next();
// };
