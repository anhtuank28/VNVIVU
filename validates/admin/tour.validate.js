const Joi = require("joi");

module.exports.createPost = (req, res, next) => {
    if (req.body.locations && typeof req.body.locations === 'string') {
        try { req.body.locations = JSON.parse(req.body.locations); } catch (e) {}
    }
    if (req.body.schedules && typeof req.body.schedules === 'string') {
        try { req.body.schedules = JSON.parse(req.body.schedules); } catch (e) {}
    }

    const schema = Joi.object({
        name: Joi.string()
            .required()
            .messages({
                "string.empty": "Vui lòng nhập tên tour",
            }),
        category: Joi.string().allow(""),
        position: Joi.number(),
        status: Joi.string().allow(""),
        avatar: Joi.string().allow(""),
        priceAdult: Joi.number(),
        priceChildren: Joi.number(),
        priceBaby: Joi.number(),
        priceNewAdult: Joi.number(),
        priceNewChildren: Joi.number(),
        priceNewBaby: Joi.number(),
        stockAdult: Joi.number(),
        stockChildren: Joi.number(),
        stockBaby: Joi.number(),
        locations: Joi.array(),
        time: Joi.string().allow(""),
        vehicle: Joi.string().allow(""),
        departureDate: Joi.date(),
        information: Joi.string().allow(""),
        schedules: Joi.array(),
        createdBy: Joi.string().allow(""),
        updatedBy: Joi.string().allow(""),
        images: Joi.alternatives().try(Joi.array(), Joi.string()).allow(""),
        locationFrom: Joi.string().allow(""),
        isFeatured: Joi.string().allow("")
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
