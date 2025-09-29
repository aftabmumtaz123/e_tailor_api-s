const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const authMiddleware = require("../middleware/auth");

const {getAnnouncement, createAnnouncement, deleteAnnouncement} = require("../controller/anouncementController");





router.get("/list", getAnnouncement);
router.post('/create', upload.single('announcementImage'), createAnnouncement);
router.delete("/delete/:id", deleteAnnouncement);

module.exports = router;
