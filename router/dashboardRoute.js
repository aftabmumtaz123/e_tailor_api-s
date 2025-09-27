const express = require('express');
const router = express.Router();
const Tailor = require('../model/tailor'); // Mongoose model for Tailors
const Customer = require('../model/customer'); // Mongoose model for Customers
const Subscription = require('../model/subscription'); // Mongoose model for Subscriptions
const UserLogin = require('../model/loginUser'); // Mongoose model for User Logins
const User = require('../model/User'); // Mongoose model for Users
// Dashboard Stats Route
router.get('/api/dashboard-stats', async (req, res) => {
  try {
    // Current date and time (September 25, 2025, 05:14 PM PKT)
    const now = new Date('2025-09-25T17:14:00+05:00'); // PKT is UTC+5

    // 1. Total Tailors with growth percentage
    const totalTailors = await Tailor.countDocuments({});
    const lastMonthStart = new Date(2025, 7, 1); // August 1, 2025
    const lastMonthEnd = new Date(2025, 8, 0);   // August 31, 2025
    const lastMonthCount = await Tailor.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const growthPercent = lastMonthCount > 0 ? ((totalTailors - lastMonthCount) / lastMonthCount * 100).toFixed(0) : 0;
    const formattedGrowth = growthPercent > 0 ? `+${growthPercent}%` : `${growthPercent}%`;

    // 2. Total Customers
    const totalCustomers = await Customer.countDocuments({});

    // 3. Total Revenue
    const totalRevenue = await Subscription.aggregate([
      { $match: { status: { $in: ['Active', 'Expired'] } } },
      { $group: { _id: null, total: { $sum: '$revenue' } } }
    ]);
    const formattedRevenue = `$${totalRevenue[0]?.total?.toLocaleString() || 0}`;

    // 4. Active and Expired Subscriptions
    const activeSubs = await Subscription.countDocuments({ status: 'Active' });
    const expiredSubs = await Subscription.countDocuments({
      status: 'Expired',
      endDate: { $lt: now }
    });

    // 5. New Tailors This Month (Daily breakdown for September 2025)
    const thisMonthStart = new Date(2025, 8, 1); // September 1, 2025
    const thisMonthEnd = new Date(2025, 9, 1);   // October 1, 2025 (exclusive)
    const dailyNewTailors = await Tailor.aggregate([
      { $match: { createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
      { $group: { _id: { $dayOfMonth: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);

    // 6. Recent Activity: Latest Tailors Signed Up (Top 5)
    const recentTailors = await Tailor.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt')
      .lean();
    const formatTimeAgo = (date) => {
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return `  ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    };
    const formattedRecentTailors = recentTailors.map(tailor => ({
      name: tailor.name,
      timeAgo: formatTimeAgo(tailor.createdAt)
    }));

    // 7. Last Logins (Top 6)
    const lastLogins = await UserLogin.find({})
  .populate('userId', 'name')   // just pick the name from the User model
  .sort({ loginTime: -1 })
  .limit(6)
  .select('userId loginTime')   // no nested path here
  .lean();

    const formattedLastLogins = lastLogins.map(login => ({
      name: login.userId.name,
      timeAgo: formatTimeAgo(login.loginTime)
    }));

    // Compile all stats into a single response
    const dashboardStats = {
      totalTailors: { count: totalTailors, growth: formattedGrowth },
      totalCustomers,
      totalRevenue: formattedRevenue,
      subscriptions: { active: activeSubs, expired: expiredSubs },
      newTailorsThisMonth: dailyNewTailors,
      recentActivity: formattedRecentTailors,
      lastLogins: formattedLastLogins
    };

    res.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;