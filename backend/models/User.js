const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);
//export default User;
module.exports = User;
