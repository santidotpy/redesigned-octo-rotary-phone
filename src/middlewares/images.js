import multer from "multer";
import __dirname from "../path.js";
import path from "path";

// MULTER
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let destinationFolder = "";
    if (file.fieldname == "profile") {
      destinationFolder = "profiles";
    } else if (file.fieldname == "product") {
      destinationFolder = "products";
    }

    const uploadPath = path.join(
      __dirname,
      `public/uploads/${destinationFolder}`
    );
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generar un nombre único para cada archivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({ storage: storage });
