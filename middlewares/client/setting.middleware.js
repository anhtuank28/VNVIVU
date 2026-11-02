const SettingwebsiteInfo = require("../../models/setting-website-model");

module.exports.websiteInfo = async (req, res, next) => {

    const settingWebsiteInfo=await SettingwebsiteInfo.findOne({});
    
    if (settingWebsiteInfo) {
        const normalizeUrl = (url) => {
            if (!url || url === "#") return "#";
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                return "https://" + url;
            }
            return url;
        };

        settingWebsiteInfo.facebook = normalizeUrl(settingWebsiteInfo.facebook);
        settingWebsiteInfo.instagram = normalizeUrl(settingWebsiteInfo.instagram);
        settingWebsiteInfo.twitter = normalizeUrl(settingWebsiteInfo.twitter);
        settingWebsiteInfo.youtube = normalizeUrl(settingWebsiteInfo.youtube);
    }
    
    res.locals.settingWebsiteInfo=settingWebsiteInfo;

    next();
}