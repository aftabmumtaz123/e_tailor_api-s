const Tailor = require("../model/tailor");

// -------------------- Get By ID --------------------
exports.getTailorById = async (req, res) => {

  try {
    const tailor = await Tailor.findById(req.params.id);

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: "Tailor not found",
        data: null,
      });
    }

    // Remove password
    const safeTailor = tailor.toObject();
    delete safeTailor.password;

    res.status(200).json({
      success: true,
      message: "Tailor fetched successfully",
      data: safeTailor,
    });
  } catch (error) {
    console.error("Error fetching tailor:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tailor",
      error: error.message,
    });
  }
};

// -------------------- Get All --------------------
exports.getTailor = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found in request",
      });
    }

    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const tailors = await Tailor.find()
      .select("-password") // Exclude password
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalTailors = await Tailor.countDocuments();
    const totalPages = Math.ceil(totalTailors / limit);

    res.status(200).json({
      success: true,
      message: "Tailors fetched successfully",
      data: {
        tailors,
        pagination: {
          currentPage: page,
          totalPages,
          totalTailors,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      isAuthenticated: true,
    });
  } catch (e) {
    console.error("Error fetching tailors:", e);
    res.status(500).json({
      success: false,
      message: "Error fetching tailors",
      error: e.message,
    });
  }
};

// -------------------- Update --------------------
exports.updateTailor = async (req, res) => {
  try {
    const allowedUpdates = [
      "shopName",
      "ownerName",
      "phone",
      "subscriptionPlan",
      "category",
      "status",
      "email",
      "address",
      "logo",
    ];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const tailor = await Tailor.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: "Tailor not found",
      });
    }

    console.log("Tailor updated:", tailor);
    res.status(200).json({
      success: true,
      message: "Tailor updated successfully",
      data: tailor,
    });
  } catch (error) {
    console.error("Error updating tailor:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating tailor",
      error: error.message,
    });
  }
};

// -------------------- Delete --------------------
exports.deleteTailor = async (req, res) => {
  try {
    const tailor = await Tailor.findByIdAndDelete(req.params.id);

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: "Tailor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tailor deleted successfully",
      data: { id: tailor._id, shopName: tailor.shopName },
    });
  } catch (error) {
    console.error("Error deleting tailor:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting tailor",
      error: error.message,
    });
  }
};

