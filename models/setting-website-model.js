const mongoose = require("mongoose");

const schema = new mongoose.Schema(
    {
        websiteName: String,
        phone: String,
        email: String,
        address: String,
        logo: String,
        favicon: String,
        footerDescription: String,
        facebook: String,
        instagram: String,
        twitter: String,
        youtube: String,
        copyright: String
    }
);

const SettingwebsiteInfo = mongoose.model("SettingwebsiteInfo", schema, "setting-website-info");

module.exports = SettingwebsiteInfo;