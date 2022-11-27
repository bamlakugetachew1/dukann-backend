const mongoose = require("mongoose");
const userschema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      require: true,
    },
    phonenumber: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      require: true,
      min: [6, "password must be six character or number"],
    },
    userimage: {
      type: String,
      require: false,
    },
    address: {
      type: String,
      require: false,
    },
    wishlists: {
      type: Array,
      default: [],
    },
    mycarts:{
        type:Array,
        default:[]
    },
  },
  { timestamps: true }
);

mongoose.model("userschema", userschema);
