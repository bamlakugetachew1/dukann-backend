const mongoose = require('mongoose');
const googleschema = new mongoose.Schema({
      name:{
        type:String,
        require:false,
      },
      email:{
        type:String
      },
      images:{
        type:String
      },
      wishlists: {
        type: Array,
        default: [],
      },
      mycarts:{
        type:Array,
        default:[]
    },
},{
    timestamps:true
})

mongoose.model("googleschema",googleschema);