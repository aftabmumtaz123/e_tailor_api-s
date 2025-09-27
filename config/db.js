const mongoose = require("mongoose");
require("dotenv").config()
mongoose.connect(process.env.MONGODB_URL,{
    useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000, // Increased to 20 seconds
  socketTimeoutMS: 45000 // Optional: Increased socket timeout
}).then(()=>{
    console.log("Connection Successful");
}).catch((e)=>{
    console.log("There is some error in connection",e);
});