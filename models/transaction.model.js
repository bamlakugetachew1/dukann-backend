const mongoose = require("mongoose");
const transactionschema = new mongoose.Schema({
         email:{
            type:String,
            require:true
         },

         firstname:{
            type:String,
            require:true
         },
         lastname:{
            type:String,
            require:true
         },
         amount:{
             type:String
         },
},  { timestamps: true }
)

mongoose.model("transactionschema",transactionschema);