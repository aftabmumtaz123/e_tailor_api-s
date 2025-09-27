const mongoose = require("mongoose");
require("dotenv").config()
mongoose.connect(process.env.MONGODB_URL).then(()=>{
    console.log("Connection Successful");
}).catch((e)=>{
    console.log("There is some error in connection",e);
});