import { mongoManager } from "../../../db/mongoManager.js";
import { Schema } from "mongoose";
import bcrypt from "bcrypt";

const schema = new Schema({
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    index: true,
  },
  age: {
    type: Number,
    required: true,
  },
  documents: [{
    name: {
      type: String, // doc name
    },
    reference: {
      type: String, // link to doc
    }
  }],
  last_connection: {
    type: Date,
    required: false,
    default: Date.now(),
  },
  isadmin: {
    type: Boolean,
    required: false,
    default: false,
  },
  // usuario premium
  isSeller: {
    type: Boolean,
    required: false,
    default: false,
  },
  password: {
    type: String,
    required: true,
  },
  id_cart: {
    type: Schema.Types.ObjectId,
    ref: "carts",
    required: true,
  },
});

export class UserMongo extends mongoManager {
  constructor() {
    super(process.env.mongoUrl, "users", schema);
  }

  // encriptar contraseña todavia no lo uso
  async encryptPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // comparar contraseña
  async comparePassword(password, receivedPassword) {
    return await bcrypt.compare(password, receivedPassword);
  }

  // obtener usuario por email
  async getUserByEmail(email) {
    super.connect();
    try {
      return await this.model.findOne({ email: email });
    } catch (error) {
      return false;
    }
  }
}
