require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.Mongourl, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("database is connected");
  }
});

const usersmodel = require('./users.model')
const productmodel = require('./product.model')
const googlemodel = require('./google.model')
const transactionschema = require('./transaction.model')
