const moongose = require("mongoose");

const schema = new moongose.Schema(
    {
        name: String,
        status: {
            type: String,
            default: "active"
        },
        deleted: {
            type: Boolean,
            default: false
        },
        deletedAt: Date
    },
    {
        timestamps: true
    }
);

const City = moongose.model("City", schema, "cities");
module.exports = City