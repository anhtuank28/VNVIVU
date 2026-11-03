const Joi = require("joi");

module.exports.createPost = (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập tiêu đề bài viết",
            }),
        content: Joi.string().allow(""),
        position: Joi.number().allow(""),
        status: Joi.string().allow(""),
        avatar: Joi.string().allow(""),
        createdBy: Joi.string().allow(""),
        updatedBy: Joi.string().allow("")
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        const errorMessage = error.details[0].message;
        res.json({
            code: "error",
            message: errorMessage,
        });
        return;
    }
    next();
};
