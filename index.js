require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const bodyparser = require("body-parser");
const db_connecion = require('./models/db_connection');
const userroutes = require("./controllers/userscontrollers");
const productroutes = require("./controllers/productcontroller");
const passport = require("passport");
const cookieSession = require("cookie-session");
var session = require("express-session");
var cookieParser = require("cookie-parser");
const cluster = require("cluster");
const os = require("os");
const numcpu = os.cpus().length;
const app = express();
app.use(cors());
app.use(cookieParser());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(cors());
app.use(
  bodyparser.urlencoded({
    extended: true,
  })
);
app.use(bodyparser.json());
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use("/user", userroutes);
app.use("/product", productroutes);

app.use(passport.initialize());
app.use(passport.session());

if (cluster.isMaster) {
  for (let i = 0; i < numcpu; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(process.pid);
  app.listen(process.env.port, (err) => {
    if (!err) {
      console.log(`app is running at ${process.env.port}`);
    }
  });
}


// app.listen(process.env.port, (err) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(`app is running at ${process.env.port}`);
//   }
// });
