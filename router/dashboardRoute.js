const express = require('express');
const router = express.Router();
const Tailor = require('../model/tailor'); // Mongoose model for Tailors
const Customer = require('../model/customer'); // Mongoose model for Customers
const Subscription = require('../model/subscription'); // Mongoose model for Subscriptions
const UserLogin = require('../model/loginUser'); // Mongoose model for User Logins
const User = require('../model/User'); // Mongoose model for Users
// Dashboard Stats Route
const mongoose = require('mongoose');



router.get("/api/dashboard-stats", async (req, res) => {
  try {
    // Verify admin access
 

    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Total Tailors
    const totalTailors = await Tailor.countDocuments({});
    const lastMonthCount = await Tailor.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });
    const growthPercent = lastMonthCount > 0
      ? ((totalTailors - lastMonthCount) / lastMonthCount * 100).toFixed(0)
      : 0;
    const formattedGrowth = growthPercent > 0 ? `+${growthPercent}%` : `${growthPercent}%`;

    // Total Customers
    const totalCustomers = await Customer.countDocuments({});
    const customerLastMonthCount = await Customer.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });
    const customerGrowthPercent = customerLastMonthCount > 0
      ? ((totalCustomers - customerLastMonthCount) / customerLastMonthCount * 100).toFixed(0)
      : 0;
    const formattedCustomerGrowth = customerGrowthPercent > 0
      ? `+${customerGrowthPercent}%`
      : `${customerGrowthPercent}%`;

    // Total Revenue
    const totalRevenue = await Subscription.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: null, total: { $sum: "$revenue" } } },
    ]);

    // Per-Tailor Revenue
    const tailorRevenue = await Subscription.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: "$tailorId", total: { $sum: "$revenue" } } },
      {
        $lookup: {
          from: "tailors",
          localField: "_id",
          foreignField: "_id",
          as: "tailor",
        },
      },
      { $unwind: "$tailor" },
      { $project: { shopName: "$tailor.shopName", revenue: "$total" } },
    ]);

    // Active and Inactive Subscriptions
    const activeSubs = await Subscription.countDocuments({ status: "Active" });
    const inactiveSubs = await Subscription.countDocuments({ status: "Inactive" });

    // New Tailors This Month
    const dailyNewTailors = await Tailor.aggregate([
      { $match: { createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: { $toDate: "$_id" },
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Recent Activity
    const recentTailors = await Tailor.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("shopName ownerName createdAt")
      .lean();
    const formatTimeAgo = (date) => {
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    };
    const formattedRecentTailors = recentTailors.map((tailor) => ({
      shopName: tailor.shopName,
      ownerName: tailor.ownerName,
      timeAgo: formatTimeAgo(tailor.createdAt),
    }));

    // Last Logins
    const lastLogins = await UserLogin.find({})
      .populate("userId", "shopName ownerName")
      .sort({ loginTime: -1 })
      .limit(6)
      .select("userId loginTime")
      .lean();
    const formattedLastLogins = lastLogins.map((login) => ({
      shopName: login.userId?.shopName || "Unknown",
      ownerName: login.userId?.ownerName || "Unknown",
      timeAgo: formatTimeAgo(login.loginTime),
    }));

    res.json({
      success: true,
      message: "Dashboard stats fetched successfully",
      totalTailors: { count: totalTailors, growth: formattedGrowth },
      totalCustomers: { count: totalCustomers, growth: formattedCustomerGrowth },
      totalRevenue: `$${totalRevenue[0]?.total?.toLocaleString() || 0}`,
      tailorRevenue,
      subscriptions: { active: activeSubs, inactive: inactiveSubs },
      newTailorsThisMonth: dailyNewTailors,
      recentActivity: formattedRecentTailors,
      lastLogins: formattedLastLogins,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats", error: error.message });
  }
});



module.exports = router;