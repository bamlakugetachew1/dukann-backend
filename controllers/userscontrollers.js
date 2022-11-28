require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const usermodels = mongoose.model("userschema");
const googlemodel = mongoose.model("googleschema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const passport = require("passport");
const { response } = require("express");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const LocalStorage = require("node-localstorage").LocalStorage;
const ratelimit = require("express-rate-limit");
const productmodels = mongoose.model("productschema");
const transactionmodels = mongoose.model("transactionschema");
const paypal = require('paypal-rest-sdk');
var totalprice = "";

var googlemail = " ";
var googledisplayname = " ";
var picture = " ";
var tokens = " ";
var user = {};
var sellerid = " ";

const limiter = ratelimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  // standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  // legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "too many attempts",
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.Googleid,
      clientSecret: process.env.Googlesecret,
      callbackURL: "http://localhost:3000/user/callback",
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      googlemail = profile.email;
      googledisplayname = profile.displayName;
      picture = profile.picture;
      return done(null, profile);
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});

router.get("/", (req, res) => {
  res.send('<a href="/google">Log in with Google</a>');
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] }),
  (req, res, next) => {
    console.log(req);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "Content-Type",
      "Authorization"
    );
    next();
  }
);

router.get(
  "/callback",
  passport.authenticate("google", {
    successRedirect: "/user/auth/callback/success",
    failureRedirect: "/user/auth/callback/failure",
  })
);

router.get("/auth/callback/success", async (req, res) => {
  user = await googlemodel.findOne({ email: googlemail });
  if (user == null) {
    const newuser = new googlemodel({
      name: googledisplayname,
      email: googlemail,
      images: picture,
    });
    await newuser
      .save()
      .then((response) => {
        tokengenerate();
        localStorage = new LocalStorage("./scratch");
        const param1 = localStorage.getItem("sellerid");
        const param2 = localStorage.getItem("tokens");
        res.redirect(
          "http://localhost:8080/passwordList/?sellerid=" +
            param1 +
            "&token=" +
            param2
        );
      })
      .catch((e) => {
        console.log(e);
      });
  } else {
    tokengenerate();
    localStorage = new LocalStorage("./scratch");
    const param1 = localStorage.getItem("sellerid");
    const param2 = localStorage.getItem("tokens");
    res.redirect(
      "http://localhost:8080/passwordList/?sellerid=" +
        param1 +
        "&token=" +
        param2
    );
  }
});

async function tokengenerate() {
  user = await googlemodel.findOne({ email: googlemail });
  // tokens= jwt.sign({ user: user }, process.env.SecretToken, { expiresIn: "1d" });

  tokens = jwt.sign(
    { user: user },
    process.env.SecretToken,
    { expiresIn: "1d" },
    (err, token) => {
      if (err) {
        res.json({
          message: "error in creating tokens",
        });
      } else {
      }
    }
  );

  sellerid = user._id.toString();
  localStorage = new LocalStorage("./scratch");
  localStorage.setItem("sellerid", sellerid);
  localStorage.setItem("tokens", tokens);
}

// failure
router.get("/auth/callback/failure", (req, res) => {
  res.send("Something went wrong please try again");
});

router.post("/register", limiter, async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hashpasswords = await bcrypt.hash(req.body.password, salt);
  const ifound = await usermodels.findOne({ email: req.body.email });
  if (ifound != null) {
    res.json({
      message: "alerady registred please log in",
    });
  } else {
    const user = new usermodels({
      fullname: req.body.fullname,
      phonenumber: req.body.phonenumber,
      email: req.body.email,
      password: hashpasswords,
    });
    await user
      .save()
      .then(() => {
        res.json({
          message: "succesully registred login please!",
          success: true,
        });
      })
      .catch((error) => {
        res.json({
          status: error,
          message: "something wrong please try again!",
        });
      });
  }
});

router.post("/login", limiter, async (req, res) => {
  const user = await usermodels.findOne({ email: req.body.email });
  if (user != null) {
    const validate = await bcrypt.compare(req.body.password, user.password);
    if (validate) {
      jwt.sign(
        { user: user },
        process.env.SecretToken,
        { expiresIn: "1d" },
        (err, token) => {
          if (err) {
            res.json({
              message: "error in creating tokens",
            });
          } else {
            res.json({
              token: token,
              success: true,
              email: user.email,
              sellerid: user._id,
            });
          }
        }
      );
    } else {
      res.json({
        message: "your passswords are incorrect",
      });
    }
  } else {
    res.json({
      message: "you are not registred please sign up",
    });
  }
});

router.post("/getallbefore", async (req, res) => {
  const userid = req.body.userid;
  var iffound = await usermodels.findById(userid);
  if (iffound == null) {
    iffound = await googlemodel.findById(userid);
  }

  res.json({
    data: iffound,
  });
});

router.post("/like", async (req, res) => {
  const productid = req.body.productid;
  const userid = req.body.userid;
  var iffound = await usermodels.findById(userid);
  var googlesucces = "false";
  if (iffound == null) {
    iffound = await googlemodel.findById(userid);
    googlesucces = "true";
  }

  //  var  noofwishlists  = iffound.wishlists.length;

  if (iffound.wishlists.includes(productid)) {
    if (googlesucces == "true") {
      await productmodels.findByIdAndUpdate(productid, {
        $pull: { loved: userid },
      });

      await googlemodel
        .findByIdAndUpdate(userid, { $pull: { wishlists: productid } })
        .then((response) => {
          res.json({
            data: response,
            length: response.wishlists.length - 1,
          });
        })
        .catch((error) => {
          res.send(error);
        });
    } else {
      await productmodels.findByIdAndUpdate(productid, {
        $pull: { loved: userid },
      });

      await usermodels
        .findByIdAndUpdate(userid, { $pull: { wishlists: productid } })
        .then((response) => {
          res.json({
            data: response,
            length: response.wishlists.length - 1,
          });
        })
        .catch((error) => {
          res.send(error);
        });
    }
  } else {
    await productmodels.findByIdAndUpdate(productid, {
      $push: { loved: userid },
    });

    if (googlesucces == "true") {
      await googlemodel
        .findByIdAndUpdate(userid, { $push: { wishlists: productid } })
        .then((response) => {
          res.json({
            data: response,
            length: response.wishlists.length + 1,
            message:"found"

          });
        })
        .catch((error) => {
          res.send(error);
        });
    } else {
      await productmodels.findByIdAndUpdate(productid, {
        $push: { loved: userid },
      });
      await usermodels
        .findByIdAndUpdate(userid, { $push: { wishlists: productid } })
        .then((response) => {
          res.json({
            data: response,
            length: response.wishlists.length + 1,
            message:"found"
          });
        })
        .catch((error) => {
          res.send(error);
        });
    }
  }
});

router.post("/countlike", async (req, res) => {
  const userid = req.body.userid;
  var iffound = await usermodels.findById(userid);
  if (iffound == null) {
    iffound = await googlemodel.findById(userid);
  }

  res.json({
    length: iffound.wishlists.length,
  });
});



router.post("/countcartitems", async (req, res) => {
  const userid = req.body.userid;
  var iffound = await usermodels.findById(userid);
  if (iffound == null) {
    iffound = await googlemodel.findById(userid);
  }
  res.json({
    length: iffound.mycarts.length,
  });
});





router.post("/addtocart",async(req,res)=>{
  const productid = req.body.productid;
  const userid = req.body.userid;
  var iffound = await usermodels.findById(userid);
  var googlesucces = "false";
  if (iffound == null) {
    iffound = await googlemodel.findById(userid);
    googlesucces = "true";
  }
   

  if(iffound.mycarts.includes(productid)){
  }
  else{
   if (googlesucces == "true") {
    await productmodels.findByIdAndUpdate(productid,{$push:{usercarts:userid}});
    await googlemodel.findByIdAndUpdate(userid, {
      $push: { mycarts: productid},
    }).then(response=>{
          res.json({
            length:response.mycarts.length+1,
            message:"added"
          })
      }).catch((e)=>{
        console.log(e)
    });
  }

    if (googlesucces == "false") {
    await productmodels.findByIdAndUpdate(productid,{$push:{usercarts:userid}});
    await usermodels.findByIdAndUpdate(userid, {
      $push: { mycarts: productid},
    }).then(response=>{
        res.json({
        length:response.mycarts.length+1,
        message:"added"
      })

      }).catch((e)=>{
        console.log(e)
    });
  }
  }
})




router.post("/unlikeproduct", async (req, res) => {
  const productid = req.body.productid;
  const userid = req.body.userid;
  var iffound = await usermodels.findById(userid);
  var googlesucces = "false";
  if (iffound == null) {
    iffound = await googlemodel.findById(userid);
    googlesucces = "true";
  }

  if (googlesucces == "true") {
    await productmodels.findByIdAndUpdate(productid, {
      $pull: { loved: userid },
    });

    await googlemodel
      .findByIdAndUpdate(userid, { $pull: { wishlists: productid } })
      .then((response) => {
        res.json({
          data: response,
          length: response.wishlists.length,
        });
      })
      .catch((error) => {
        res.send(error);
      });
  } else {
    await productmodels.findByIdAndUpdate(productid, {
      $pull: { loved: userid },
    });

    await usermodels
      .findByIdAndUpdate(userid, { $pull: { wishlists: productid } })
      .then((response) => {
        res.json({
          data: response,
          length: response.wishlists.length,
        });
      })
      .catch((error) => {
        res.send(error);
      });
  }
});




router.post("/removefromcart", async (req, res) => {
  const productid = req.body.productid;
  const userid = req.body.userid;
  var iffound = await usermodels.findById(userid);
  var googlesucces = "false";
  if (iffound == null) {
    iffound = await googlemodel.findById(userid);
    googlesucces = "true";
  }

  if (googlesucces == "true") {
    await productmodels.findByIdAndUpdate(productid, {
      $pull: { usercarts: userid },
    });

    await googlemodel
      .findByIdAndUpdate(userid, { $pull: { mycarts: productid } })
      .then((response) => {
        res.json({
          data: response,
          length: response.wishlists.length,
        });
      })
      .catch((error) => {
        res.send(error);
      });
  } else {
    await productmodels.findByIdAndUpdate(productid, {
      $pull: { usercarts: userid },
    });

    await usermodels
      .findByIdAndUpdate(userid, { $pull: { mycarts: productid } })
      .then((response) => {
        res.json({
          data: response,
          length: response.wishlists.length,
        });
      })
      .catch((error) => {
        res.send(error);
      });
  }
});




paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.paypalClientid,
  'client_secret':process.env.paypalClientsecret
});


  router.post('/pay', (req, res) => {
 totalprice = req.body.totalprice;
//   localStorage = new LocalStorage("./scratch");
//   localStorage.setItem("totalprice", totalprice);
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "https://dukannethiopia.cyclic.app/user/paymentsuccess",
        "cancel_url": "https://dukannethiopia.cyclic.app/user/paymentcancel"
    },
    "transactions": [{
        "item_list": {
         
        },
        "amount": {
            "currency": "USD",
            "total":totalprice
        },
        "description": "Washing Bar soap"
    }]
};

paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
           res.json({
            link:payment.links[i].href
           })
          // res.redirect(payment.links[i].href);
        }
      }
  }
});

});

router.get('/paymentsuccess', async(req, res) => {
   localStorage = new LocalStorage("./scratch");
   const price = localStorage.getItem("totalprice");
   const payerId = req.query.PayerID;
   const paymentId = req.query.paymentId;
   const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": price
        }
    }]
  };


// Obtains the transaction details from paypal
  paypal.payment.execute(paymentId, execute_payment_json,async function (error, payment) {
      //When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string reposponse to the user.
    if (error) {
        console.log(error.response);
        throw error;
    } else {
     
      const transaction = new transactionmodels({
        email: payment.payer.payer_info.email,
        firstname: payment.payer.payer_info.first_name,
        lastname: payment.payer.payer_info.last_name,
      });
      await transaction
        .save()
        .then(() => {
          res.redirect("https://dukaanethiopia.netlify.app/successPage");
        })
        .catch((error) => {
         console.log(error)
        });
    }
});
});

router.get('/paymentcancel', (req, res) => 
        res.redirect("https://dukaanethiopia.netlify.app/cancelPage")
);


module.exports = router;
