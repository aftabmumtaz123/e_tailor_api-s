require('dotenv').config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const authRoute = require('./router/authRouter');
const tailorRoute = require('./router/tailorRouter');
const subscriptionRoute = require('./router/subscriptionRouter');
const announcementRoute = require('./router/announcementRouter');
const adminRouter = require('./router/adminRouter');
const Admin = require('./model/admin');
const ConfigurationRouter = require('./router/appConfigurationRouter');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const ReportRouter = require("./router/reportRoute")


const connectDB = require("./config/db"); // export function, don’t await require


(async () => {
  await connectDB();
  console.log("✅ DB connected");

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();






app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(cors());
app.use(morgan('dev')); 
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static('uploads'));


app.use("/dashboard", require("./router/dashboardRoute"))


const Tailor = require("./model/tailor");

app.get("/api/tailor-stats/yearly", async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const monthlyTailors = await Tailor.aggregate([
      { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          totalTailors: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    // Map results to months Jan–Dec
    const stats = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyTailors.find((m) => m._id.month === i + 1);
      return {
        month: new Date(year, i).toLocaleString("default", { month: "long" }),
        totalTailors: monthData ? monthData.totalTailors : 0,
      };
    });

    res.status(200).json({
      success: true,
      message: `Tailor registrations per month for ${year}`,
      year,
      stats,
    });
  } catch (error) {
    console.error("Error fetching yearly tailor stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch yearly tailor stats",
      error: error.message,
    });
  }
});



app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    console.error('Error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to process request',
    });
  }
  next();
});


// Routes
app.use('/auth', authRoute);
app.use('/auth/login', adminRouter); 
app.use('/subscription', subscriptionRoute);
app.use('/tailor', tailorRoute);
app.use('/announcement', announcementRoute);
app.use('/configuration', ConfigurationRouter);
app.use('/', ReportRouter);



app.get('/', (req, res) => {
  res.json({ message: 'E-Tailor API is running' });
});


app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});


// console.log('Cloudinary config:', process.env.CLOUDINARY_CLOUD_NAME)












// registerAdmin = async (req, res) => {

//     try {
//         const password = "admin123";
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const user = new Admin({
//             name: "Aftab",
//             email: "admin@gmail.com",
//             password: hashedPassword,
//         });
//         await user.save();
//         console.log(user)
//         console.log("User registered successfully");
//         res.status(201).json({ success: true, msg: "Successfully registered user", User: user });
//     } catch (error) {
//         console.error("Error registering user:", error);
//         // res.status(500).json({ success: false, message: error.message });
//     }
// }

// registerAdmin()

