const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);

const schema = new mongoose.Schema(
    {
        title: String,
        content: String,
        avatar: String,
        status: {
            type: String,
            default: "active"
        },
        position: Number,
        slug: {
            type: String,
            slug: "title",
            unique: true
        },
        createdBy: String,
        updatedBy: String,
        deleted: {
            type: Boolean,
            default: false
        },
        deletedBy: String,
        deletedAt: Date
    }, {
    timestamps: true
});

const Article = mongoose.model('Article', schema, "articles");
module.exports = Article;
