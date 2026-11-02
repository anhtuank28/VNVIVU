const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug)

const schema = new mongoose.Schema(
    {
        name: String,
        category: String,
        position: Number,
        status: String,
        avatar: String,
        images: Array,
        priceAdult: Number,
        priceChildren: Number,
        priceBaby: Number,
        priceNewAdult: Number,
        priceNewChildren: Number,
        priceNewBaby: Number,
        stockAdult: Number,
        stockChildren: Number,
        stockBaby: Number,
        locations: Array,
        locationFrom: String,
        time: String,
        vehicle: String,
        departureDate: Date,
        information: String,
        
        schedules: Array,
        createdBy: String,
        updatedBy: String,
        slug: {
            type: String,
            slug: "name",
            unique: true
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        ratingAverage: {
            type: Number,
            default: 5.0
        },
        ratingQuantity: {
            type: Number,
            default: 0
        },
        deleted: {
            type: Boolean,
            default: false
        },
        deletedBy: String,
        deletedAt: Date
    }, {
    timestamps: true
});



const Tour = mongoose.model('Tour', schema, "tours");
module.exports = Tour