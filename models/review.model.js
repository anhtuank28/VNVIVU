const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: Array,
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "hidden"],
      default: "active",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index phục vụ truy vấn review theo tour và sắp xếp theo ngày tạo
reviewSchema.index({ tourId: 1, status: 1, deleted: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema, "reviews");

module.exports = Review;

