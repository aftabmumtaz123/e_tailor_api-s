const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const authMiddleware = require("../middleware/auth");

const {getAnnouncement, createAnnouncement, deleteAnnouncement} = require("../controller/anouncementController");





router.get("/list", authMiddleware ,getAnnouncement);
router.post('/create', authMiddleware ,upload.single('announcementImage'), createAnnouncement);
router.delete("/delete/:id", authMiddleware ,deleteAnnouncement);

module.exports = router;
