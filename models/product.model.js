const mongoose = require("mongoose");
const productschema = new mongoose.Schema(
  {
    sellerid: {
      type: String,
      require: true,
    },
    price: {
      type: Number,
      require: true,
    },
    name: {
      type: String,
      require: true,
    },
    companyname: {
      type: String,
      require: false,
    },
    description: {
      type: String,
      require: true,
    },
    catagory: {
      type: String,
      require: false,
    },
    productimages: {
      type: Array,
      default: [],
    },
    loved: {
      type: Array,
      default: [],
    },
    usercarts:{
      type:Array,
      default:[]
  },
  },
  { timestamps: true }
);

mongoose.model('productschema',productschema);
