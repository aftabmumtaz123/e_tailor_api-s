const express = require('express');
const router = express.Router();
const Tailor = require('../model/tailor');
const Subscription = require('../model/subscription');

router.get('/api/reports', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate and parse dates
    const start = startDate ? new Date(startDate) : new Date('2025-01-01');
    const end = endDate ? new Date(endDate) : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    end.setHours(23, 59, 59, 999); // Include the full end day

    const reports = await Tailor.aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'tailorId',
          as: 'subscription',
        },
      },
      {
        $unwind: {
          path: '$subscription',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customers',
          foreignField: '_id',
          as: 'customerData',
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orders',
          foreignField: '_id',
          as: 'ordersData',
        },
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
                  { $lte: ['$$order.createdAt', end] },
                ],
              },
            },
          },
          subscription: {
            $cond: {
              if: { $eq: ['$subscription', {}] },
              then: null,
              else: '$subscription',
            },
          },
        },
      },
      {
        $addFields: {
          revenue: {
            $ifNull: [{ $sum: '$ordersData.amount' }, 0], // Default to 0 if no orders
          },
          customersCount: { $size: '$customerData' },
          customerSample: { $slice: ['$customerData', 3] },
          ordersCount: { $size: '$ordersData' },
          subscriptionStatus: {
            $ifNull: ['$subscription.status', 'No Subscription'],
          },
          subscriptionDetails: {
            planName: { $ifNull: ['$subscription.planName', 'N/A'] },
            price: { $ifNull: ['$subscription.price', 0] },
            duration: { $ifNull: ['$subscription.duration', 0] },
            maxCustomers: { $ifNull: ['$subscription.maxCustomers', 0] },
            startDate: { $ifNull: ['$subscription.startDate', null] },
            endDate: { $ifNull: ['$subscription.endDate', null] },
          },
        },
      },
      {
        $project: {
          tailorName: '$shopName',
          ownerName: 1,
          phone: 1,
          email: 1,
          address: 1,
          category: 1,
          status: 1,
          revenue: 1,
          customersCount: 1,
          customerSample: {
            $map: {
              input: '$customerSample',
              as: 'customer',
              in: {
                name: { $ifNull: ['$$customer.name', 'Unknown'] },
                email: { $ifNull: ['$$customer.email', 'N/A'] },
              },
            },
          },
          ordersCount: 1,
          ordersData: {
            $map: {
              input: '$ordersData',
              as: 'order',
              in: {
                orderId: '$$order._id',
                customerId: { $ifNull: ['$$order.customerId', null] },
                amount: { $ifNull: ['$$order.amount', 0] },
                status: { $ifNull: ['$$order.status', 'Unknown'] },
                createdAt: { $ifNull: ['$$order.createdAt', null] },
              },
            },
          },
          subscriptionStatus: 1,
          subscriptionDetails: 1,
          date: {
            $ifNull: [
              { $dateToString: { format: '%Y-%m-%d', date: '$subscription.endDate' } },
              'N/A',
            ],
          },
        },
      },
      { $sort: { 'subscription.endDate': -1 } },
    ]);

    // Format revenue in Pakistani Rupees
    const formattedReports = reports.map(report => ({
      ...report,
      revenue: `Rs. ${report.revenue.toLocaleString('en-IN')}`,
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ error: 'Failed to generate reports', details: error.message });
  }
});

module.exports = router;