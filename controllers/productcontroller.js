const express = require("express");
const mongoose = require("mongoose");
const productmodels = mongoose.model("productschema");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const Jimp = require("jimp");
const isImage = require("is-image");
const jwt = require("jsonwebtoken");
const ratelimit = require("express-rate-limit");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const Formidable = require('formidable');

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key:  process.env.api_key,
  api_secret: process.env.api_secret
});

var reqFiles = [];
var ext = "";

const limiter = ratelimit({
   windowMs: 1 * 60 * 1000, // 15 minutes
	max: 7, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message:"too many attempts"
})

const productaddlimiter = ratelimit({
	windowMs: 1 * 60 * 1000, // 15 minutes
	max: 2, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	// standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	// legacyHeaders: false, // Disable the `X-RateLimit-*` headers
   message:"too many attempts"
})



const storage = multer.diskStorage({
  // destination: "./uploads",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({
  storage: storage,
});

router.post("/uploadimages",productaddlimiter,verifytoken, upload.array("productimages",4), async (req, res) => {
  reqFiles = [];
//          for(let i=0; i<req.files.length; i++){
//              var upload = await cloudinary.v2.uploader.upload(req.files[i].path);
//              reqFiles.push(upload.secure_url);     
//                }
	
	    for(let i=0; i<req.files.length; i++){
             var upload = await cloudinary.v2.uploader.upload(req.files[i].path);
             var url = upload.secure_url;
             var string = '';
             var count = 0;
             for(let i=0; i<url.length; i++){
                 if(url[i]=="/"){
                   count++
                 }
                 if(count == 7 && url[i]!="/"){
                       string+=url[i]
                   }
                 }
              var finalurl = "https://res.cloudinary.com/dwq2ftoo3/image/upload/w_300,h_340,c_scale/" + string;
              reqFiles.push(finalurl);     
               }

  // const upload = await cloudinary.v2.uploader.upload(req.files.path);
  return res.json({
    success: true,
    check: "imageadded",
    
  });
});







function verifytoken(req, res, next) {
  const token = req.headers["authorization"];
  const divide = token && token.split(" ")[1];
  if (!divide) {
    res.json({
      message: "we diddnt get a token",
    });
  } else {
    jwt.verify(divide, process.env.SecretToken, (err, user) => {
      if (err) {
        res.send(err);
      } else {
        req.user = user;
        next();
      }
    });
  }
}


// router.post(
//   "/uploadimages",productaddlimiter,
//   verifytoken,
//   upload.array("productimages", 4),
//   async (req, res) => {
//     var paths = "";
//     reqFiles = [];
//     for (var i = 0; i < req.files.length; i++) {
//       reqFiles.push(req.files[i].filename);
//       paths = `./uploads/${req.files[i].filename}`;
//       ext = path.extname(req.files[i].filename);
//       if (isImage(paths) && ext != ".webp") {
//         var image = await Jimp.read(paths);
//         image
//           .resize(300, 320, function (err) {
//             if (err) console.log(err);
//           })
//           .quality(60)
//           .write(paths);
//       }
//     }
//     res.json({
//       check: "imageadded",
//     });
//   }
// );

 router.get("/",(req,res)=>{
         res.json({
           message:"hello"
         })
       });

// router.post(
//   "/uploadimages",productaddlimiter,
//   verifytoken,
//   upload.array("productimages", 4),
//   async (req, res) => {
//     var paths = "";
//     reqFiles = [];
//     for (var i = 0; i < req.files.length; i++) {
//       reqFiles.push(req.files[i].filename);
//       paths = `./uploads/${req.files[i].filename}`;
//       ext = path.extname(req.files[i].filename);
//       if (isImage(paths) && ext != ".webp") {
//         var image = await Jimp.read(paths);
//         image
//           .resize(300, 320, function (err) {
//             if (err) console.log(err);
//           })
//           .quality(60)
//           .write(paths);
//       }
//     }
//     res.json({
//       check: "imageadded",
//     });
//   }
// );
// >>>>>>> f123605c6dfc8cb31c34f6efef35b6cbec65ea05

router.post("/addproducts",productaddlimiter, verifytoken, async (req, res) => {
  const product = new productmodels({
    sellerid: req.body.sellerid,
    price: req.body.price,
    name: req.body.name,
    companyname: req.body.companyname,
    catagory: req.body.catagory,
    description: req.body.description,
    productimages: reqFiles,
  });
  product
    .save()
    .then(() => {
      res.json({
        message: "product added successfully",
        sucess: true,
      });
    })
    .catch((e) => {
      console.log(e);
    });
});

router.get("/",(req,res)=>{
         res.json({
           message:"hello"
         })
});


router.get("/getallproducts/:page",limiter, async (req, res) => {
  let limit = 6;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  let productnumber = await productmodels.find().count();
  await productmodels.find().limit(limit).skip(skip)
    .then((response) => {
      res.json({
        data: response,
        productnumber:productnumber
      });
    })
    .catch((error) => {
      res.send(error);
    });
});


router.get("/getindivisualproducts/:productid",limiter, async (req, res) => {
  let productid = req.params.productid;
  await productmodels.findById(productid)
    .then((response) => {
      res.json({
        data: response
            });
    })
    .catch((error) => {
      res.send(error);
    });
});


router.get("/getmyproducts/:page", verifytoken, async (req, res) => {
  let limit = 3;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  let productnumber = await productmodels.find({sellerid:req.user.user._id}).count();
  await productmodels.find({ sellerid: req.user.user._id }).limit(limit).skip(skip)
    .then((response) => {
      res.json({
        data: response,
        productnumber:productnumber
      });
    })
    .catch((error) => {
      res.send(error);
    });
});


router.get("/allproducts/sortbynewst/:page", async (req, res) => {
  let limit = 6;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  await productmodels.find().limit(limit).skip(skip).sort({createdAt: -1})
    .then((response) => {
      res.json({
        data: response
      
      });
    })
    .catch((error) => {
      res.send(error);
    });
});


router.get("/allproducts/sortbyoldest/:page", async (req, res) => {
  let limit = 6;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  await productmodels.find().limit(limit).skip(skip).sort({createdAt: 1})
    .then((response) => {
      res.json({
        data: response
      
      });
    })
    .catch((error) => {
      res.send(error);
    });
});


router.get("/allproducts/mostliked/:page",async (req, res) => {
  let limit = 6;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  await productmodels.find().limit(limit).skip(skip).sort({loved: -1})
    .then((response) => {
      res.json({
        data: response
      });
    })
    .catch((error) => {
      res.send(error);
    });
});



router.get("/allproducts/sortbysmallprice/:page", async (req, res) => {
  let limit = 6;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  await productmodels.find().limit(limit).skip(skip).sort({price: 1})
    .then((response) => {
      res.json({
        data: response
      
      });
    })
    .catch((error) => {
      res.send(error);
    });
});


router.get("/allproducts/sortbylargeprice/:page", async (req, res) => {
  let limit = 6;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  await productmodels.find().limit(limit).skip(skip).sort({price: -1})
    .then((response) => {
      res.json({
        data: response
      
      });
    })
    .catch((error) => {
      res.send(error);
    });
});





router.get("/sortbynewst/:page", verifytoken, async (req, res) => {
  let limit = 3;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  await productmodels.find({ sellerid: req.user.user._id }).limit(limit).skip(skip).sort({createdAt: -1})
    .then((response) => {
      res.json({
        data: response
      
      });
    })
    .catch((error) => {
      res.send(error);
    });
});



router.get("/sortbyoldest/:page", verifytoken, async (req, res) => {
  let limit = 3;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  await productmodels.find({ sellerid: req.user.user._id }).limit(limit).skip(skip).sort({createdAt: 1})
    .then((response) => {
      res.json({
        data: response
      
      });
    })
    .catch((error) => {
      res.send(error);
    });
});


router.get("/mostliked/:page", verifytoken, async (req, res) => {
  let limit = 3;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  await productmodels.find({ sellerid: req.user.user._id }).limit(limit).skip(skip).sort({loved: -1})
    .then((response) => {
      res.json({
        data: response
      
      });
    })
    .catch((error) => {
      res.send(error);
    });
});



router.get("/sortbysmallprice/:page", verifytoken, async (req, res) => {
  let limit = 3;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  await productmodels.find({ sellerid: req.user.user._id }).limit(limit).skip(skip).sort({price: 1})
    .then((response) => {
      res.json({
        data: response
      
      });
    })
    .catch((error) => {
      res.send(error);
    });
});

router.get("/sortbylargeprice/:page", verifytoken, async (req, res) => {
  let limit = 3;
  let page = req.params.page || 1;
  let skip = (page-1)*limit;
  await productmodels.find({ sellerid: req.user.user._id }).limit(limit).skip(skip).sort({price: -1})
    .then((response) => {
      res.json({
        data: response
      
      });
    })
    .catch((error) => {
      res.send(error);
    });
});






router.delete("/delete/:id",verifytoken,(req, res) => {
  const id = req.params.id;
  productmodels .findByIdAndRemove(id)
    .then(() => {
      res.json({
        message: "data deleted",
      });
    })
    .catch((error) => {
      res.send(error);
    });  
});



router.post("/userliked", async (req, res) => {
  const userid = req.body.userid;
  await productmodels.find({loved:userid})
    .then((response) => {
      res.json({
        data: response
            });
    })
    .catch((error) => {
      res.send(error);
    });
});



router.post("/usercartitems", async (req, res) => {
  const userid = req.body.userid;
  await productmodels.find({usercarts:userid})
    .then((response) => {
      res.json({
        data: response
            });
    })
    .catch((error) => {
      res.send(error);
    });
});



module.exports = router;
