const express = require('express');
const router = express.Router()
const authMiddleware = require("../middleware/auth");
const upload = require("../config/multer");



const {getTailorById, updateTailor, deleteTailor, getTailor}= require("../controller/tailorController")

router.get("/view/:id", authMiddleware,getTailorById)           ////////         /tailor/view/:id
router.put(
  "/update/:id",
  authMiddleware,
  upload.single("logo"),   // <── field name must match Postman
  updateTailor
);

router.delete("/delete/:id", authMiddleware,deleteTailor)       //////        /tailor/delete/:id
router.get("/list",getTailor) 

module.exports = router
