const express = require("express");
const router = express.Router();
const subscriptionController = require("../controller/subscriptionController");

const authMiddleware = require("../middleware/auth");

const {setSubscription, getSubscriptions, getSubscriptionById, updateSubscription, deleteSubscription} = require("../controller/subscriptionController")
router.post("/create",setSubscription);
router.get("/list", getSubscriptions);
router.get("/view/:id", getSubscriptionById);
router.put("/update/:id", updateSubscription);
router.delete("/delete/:id", deleteSubscription);

module.exports = router;