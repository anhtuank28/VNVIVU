const router = require("express").Router();
const multer = require("multer");
const cloudinaryHelper = require("../../helpers/cloudinary.helper");
const upload = multer({ storage: cloudinaryHelper.storage });

router.post("/", upload.any(), (req, res) => {
    if (req.files && req.files.length > 0) {
        // Trả về url dạng string để FilePond lưu trữ
        res.status(200).send(req.files[0].path);
    } else {
        res.status(400).send("Upload failed");
    }
});

// Route cho TinyMCE image upload
router.post("/image", upload.any(), (req, res) => {
    if (req.files && req.files.length > 0) {
        // TinyMCE yêu cầu response JSON có trường "location"
        res.json({ location: req.files[0].path });
    } else {
        res.status(400).json({ error: "Upload failed" });
    }
});

module.exports = router;
