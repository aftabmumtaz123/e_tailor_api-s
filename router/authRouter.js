const express = require('express');
const router = express.Router()
const upload = require("../config/multer");


const {register, refresh, logout} = require("../controller/authController")



router.post("/register", upload.single('logo') ,register)       /////     /auth/register
router.post("/refresh", refresh)                                ////        /auth/refresh
router.post("/logout", logout)                                  ////        /auth/logout



module.exports = router