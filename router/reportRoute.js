const express = require('express');
const router = express.Router();
const Tailor = require('../model/tailor');
const Subscription = require('../model/subscription');

router.get('/api/reports', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Parse dates with default values if not provided
    const start = startDate ? new Date(startDate) : new Date('2025-01-01');
    const end = endDate ? new Date(endDate) : new Date();
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
          revenue: { $sum: '$ordersData.amount' },
          customersCount: { $size: '$customerData' },
          customerSample: { $slice: ['$customerData', 3] }, // Top 3 customer names
          ordersCount: { $size: '$ordersData' },
          subscriptionStatus: {
            $ifNull: ['$subscription.status', 'No Subscription'],
          },
          subscriptionDetails: {
            planName: '$subscription.planName',
            price: '$subscription.price',
            duration: '$subscription.duration',
            maxCustomers: '$subscription.maxCustomers',
            startDate: '$subscription.startDate',
            endDate: '$subscription.endDate',
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
              in: { name: '$$customer.name', email: '$$customer.email' },
            },
          },
          ordersCount: 1,
          ordersData: {
            $map: {
              input: '$ordersData',
              as: 'order',
              in: {
                orderId: '$$order._id',
                customerId: '$$order.customerId',
                amount: '$$order.amount',
                status: '$$order.status',
                createdAt: '$$order.createdAt',
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
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

module.exports = router;