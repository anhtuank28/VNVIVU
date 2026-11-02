require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;
const { log } = require("console");
const adminRoutes = require("./routes/admin/index.route");
const clientRoutes = require("./routes/client/index.route");
const variableConfig = require("./config/variable");
const cookieParser = require('cookie-parser')
const flash=require("express-flash")
const session=require("express-session");
//ket noi database
const database = require("./config/database");
database.connect();
//thiet lap views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//thiet lap thu muc chua file tinh cua frontend
app.use(express.static(path.join(__dirname, "public")));

//tạo biến toàn cục trong file PUG
app.locals.pathAdmin = variableConfig.pathAdmin;

//Tạo biến toàn cục trong các file backend
global.pathAdmin=variableConfig.pathAdmin;

//cho phép gửi data lên dạng json
app.use(express.json());

//su dung cookie-parser
app.use(cookieParser("abcqfsfsdsv"));

//nhúng flash
app.use(session({cookie:{maxAge: 60000}}))
app.use(flash());

//thiet lap duong dan
app.use(`/${variableConfig.pathAdmin}`, adminRoutes);
app.use("/", clientRoutes);

app.listen(port, () => {
  console.log(`Web đang cổng ${port}`);
});
