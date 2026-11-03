const Joi = require("joi");

module.exports.registerPost = (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string()
      .required()
      .messages({
      "string.empty": "Vui lòng nhập họ tên",
    }),
    email: Joi.string()
      .required()
      .email()
      .messages({
      "string.empty": "Vui lòng nhập email",
      "string.email": "Email không đúng định dạng",
    }),
    password: Joi.string()
      .required()
      .min(8)
      .custom((value, helpers) => {
        if (!/[A-Z]/.test(value)) {
          return helpers.error("password.uppercase");
        }
        if (!/[a-z]/.test(value)) {
          return helpers.error("password.lowercase");
        }

        if (!/\d/.test(value)) {
          return helpers.error("password.number");
        }
        if (!/[@$!%*?&#]/.test(value)) {
          return helpers.error("password.special");
        }
        return value;
      })
      .messages({
        "string.empty": "Vui lòng nhập mật khẩu",
        "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
        "password.uppercase": "Mật khẩu phải chứa ít nhất 1 chữ in hoa",
        "password.lowercase": "Mật khẩu phải chứa ít nhất 1 chữ cái thường",
        "password.number": "Mật khẩu phải chứa ít nhất một chữ số!",
      }),
  });

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
module.exports.loginPost = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().required().email().messages({
      "string.empty": "Vui lòng nhập email",
      "string.email": "Email không đúng định dạng",
    }),
    password: Joi.string()
      .required()
      .min(8)
      .custom((value, helpers) => {
        if (!/[A-Z]/.test(value)) {
          return helpers.error("password.uppercase");
        }
        if (!/[a-z]/.test(value)) {
          return helpers.error("password.lowercase");
        }

        if (!/\d/.test(value)) {
          return helpers.error("password.number");
        }
        if (!/[@$!%*?&#]/.test(value)) {
          return helpers.error("password.special");
        }
        return value;
      })
      .messages({
        "string.empty": "Vui lòng nhập mật khẩu",
        "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
        "password.uppercase": "Mật khẩu phải chứa ít nhất 1 chữ in hoa",
        "password.lowercase": "Mật khẩu phải chứa ít nhất 1 chữ cái thường",
        "password.number": "Mật khẩu phải chứa ít nhất một chữ số!",
        "password.special": "Mật khẩu phải chứa ít nhất 1 kí tự đặc biệt",
      }),
    rememberPassword:Joi.boolean()
  });

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


module.exports.forgotPasswordPost=(req,res,next)=>{
  const schema=Joi.object({
    email: Joi.string().required().email().messages({
      "string.empty": "Vui lòng nhập email",
      "string.email": "Email không đúng định dạng",
    }),
    
  });
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
}

module.exports.resetPasswordPost=(req,res,next)=>{
  const schema=Joi.object({
     password: Joi.string()
      .required()
      .min(8)
      .custom((value, helpers) => {
        if (!/[A-Z]/.test(value)) {
          return helpers.error("password.uppercase");
        }
        if (!/[a-z]/.test(value)) {
          return helpers.error("password.lowercase");
        }

        if (!/\d/.test(value)) {
          return helpers.error("password.number");
        }
        if (!/[@$!%*?&#]/.test(value)) {
          return helpers.error("password.special");
        }
        return value;
      })
      .messages({
        "string.empty": "Vui lòng nhập mật khẩu",
        "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
        "password.uppercase": "Mật khẩu phải chứa ít nhất 1 chữ in hoa",
        "password.lowercase": "Mật khẩu phải chứa ít nhất 1 chữ cái thường",
        "password.number": "Mật khẩu phải chứa ít nhất một chữ số!",
        "password.special": "Mật khẩu phải chứa ít nhất 1 kí tự đặc biệt",
      }),
     token: Joi.string().allow("").optional()
  });
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

  module.exports.otpPasswordPost = (req, res, next) => {
  const schema = Joi.object({
    otp: Joi.string().length(6).required().messages({
      "string.empty": "OTP không được để trống",
      "string.length": "OTP phải gồm 6 ký tự"
    }),
        email:Joi.string()

  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.json({
      code: "error",
      message: error.details[0].message
    });
  }

  next();
};

