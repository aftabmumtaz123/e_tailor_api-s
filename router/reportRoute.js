const express = require('express');
const router = express.Router();
const Tailor = require('../model/tailor');
const Subscription = require('../model/subscription');

router.get('/api/reports', async (req, res) => {
  try {
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

    // Admin Revenue
    const admin = await Admin.findById(req.user.id);
    const formattedRevenue = `$${admin.revenue.toLocaleString() || 0}`;

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


     res.json({
      success: true,
      message: "Report stats fetched successfully",
      totalTailors: { count: totalTailors, growth: formattedGrowth },
      totalCustomers: { count: totalCustomers, growth: formattedCustomerGrowth },
      totalRevenue: formattedRevenue,
      tailorRevenue,
      subscriptions: { active: activeSubs, inactive: inactiveSubs },
      
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

module.exports = router;