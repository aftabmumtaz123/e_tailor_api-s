const Subscription = require("../model/subscription");
const { ObjectId } = require("mongoose").Types;

// -------------------- Create --------------------
exports.setSubscription = async (req, res) => {
  try {
    const { planName, price, status, duration, description, maxCustomers } = req.body;

    if (!planName || !price || !status || !duration) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const subscription = await Subscription.create({
      planName,
      price: Number(price),
      status,
      duration: Number(duration),
      description,
      maxCustomers: Number(maxCustomers) || null,
    });

    console.log("✅ Subscription created:", subscription);

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      subscription,
    });
  } catch (error) {
    console.error("❌ Error creating subscription:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Update --------------------
exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    }

    const updates = req.body;
    const subscription = await Subscription.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    res.json({
      success: true,
      message: "Subscription updated successfully",
      subscription,
    });
  } catch (error) {
    console.error("❌ Error updating subscription:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Delete (Soft delete option) --------------------
exports.deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    }

    // Hard delete
    const subscription = await Subscription.findByIdAndDelete(id);

    // For soft delete, use: await Subscription.findByIdAndUpdate(id, { deleted: true });

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    console.log(`🗑️ Subscription deleted: ID=${id}`);

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
      subscription,
    });
  } catch (error) {
    console.error("❌ Error deleting subscription:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Get All --------------------
exports.getSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const totalSubscriptions = await Subscription.countDocuments(query);

    const subscriptions = await Subscription.find(query)
      .select("planName price status duration description maxCustomers")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    console.log(`✅ Fetched ${subscriptions.length} subscriptions`);

    res.status(200).json({
      success: true,
      message: "Subscriptions fetched successfully",
      subscriptions,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalSubscriptions / limit),
        totalSubscriptions,
        hasNextPage: page < Math.ceil(totalSubscriptions / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching subscriptions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Get By ID --------------------
exports.getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    }

    const subscription = await Subscription.findById(id).select(
      "planName price status duration description maxCustomers"
    );

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    console.log(`✅ Fetched subscription: ID=${id}`);

    res.status(200).json({
      success: true,
      message: "Subscription fetched successfully",
      subscription,
    });
  } catch (error) {
    console.error("❌ Error fetching subscription:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
