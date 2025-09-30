const express = require('express');
const router = express.Router();
const Tailor = require('../model/tailor');
const Subscription = require('../model/subscription');

router.get('/api/reports', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the full end day

    const reports = await Tailor.aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'tailorId',
          as: 'subscription'
        }
      },
      {
        $unwind: {
          path: '$subscription',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orders',
          foreignField: '_id',
          as: 'ordersData'
        }
      },
      {
        $addFields: {
          ordersData: {
            $filter: {
              input: '$ordersData',
              as: 'order',
              cond: {
                $and: [
                  { $gte: ['$$order.createdAt', start] },
                  { $lte: ['$$order.createdAt', end] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          revenue: { $sum: '$ordersData.amount' },
          customers: {
            $size: {
              $setUnion: ['$ordersData.customerId']
            }
          },
          ordersCount: { $size: '$ordersData' },
          subscriptionStatus: {
            $cond: {
              if: { $eq: ['$subscription.status', 'Active'] },
              then: 'Active',
              else: 'Expired'
            }
          },
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$subscription.endDate'
            }
          }
        }
      },
      {
        $project: {
          tailorName: '$shopName',
          revenue: 1,
          customers: 1,
          orders: '$ordersCount',
          subscription: '$subscriptionStatus',
          date: 1
        }
      },
      { $sort: { date: -1 } }
    ]);

    // Format revenue and date
    const formattedReports = reports.map(report => ({
      ...report,
      revenue: `Rs. ${report.revenue.toLocaleString('en-IN')}`
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

module.exports = router;