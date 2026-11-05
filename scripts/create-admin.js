require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const AccountAdmin = require("../models/account-admin.model");
const Role = require("../models/role.model");
const permissionConfig = require("../config/permission");

async function createSuperAdmin() {
  try {
    console.log("Đang kết nối database...");
    await mongoose.connect(process.env.DATABASE);
    console.log("Kết nối MongoDB thành công!");

    // 1. Tạo hoặc cập nhật Role Super Admin có toàn bộ quyền
    const allPermissions = permissionConfig.permissionList.map(item => item.value);

    let role = await Role.findOne({ name: "Quản trị viên tối cao", deleted: false });
    if (!role) {
      role = new Role({
        name: "Quản trị viên tối cao",
        description: "Toàn quyền quản trị hệ thống VNVIVU",
        permissions: allPermissions,
        deleted: false,
      });
      await role.save();
      console.log("Đã tạo Role 'Quản trị viên tối cao' mới với full quyền!");
    } else {
      role.permissions = allPermissions;
      await role.save();
      console.log("Đã cập nhật Role 'Quản trị viên tối cao' với full quyền!");
    }

    // 2. Tạo tài khoản Super Admin
    const email = "superadmin@vnvivu.com";
    const rawPassword = "Admin@123456"; // Đủ chữ hoa, thường, số, ký tự đặc biệt, >= 8 ký tự

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(rawPassword, salt);

    let account = await AccountAdmin.findOne({ email: email });
    if (account) {
      account.fullName = "Quản trị viên hệ thống";
      account.password = hashPassword;
      account.role = role._id;
      account.status = "active";
      account.deleted = false;
      account.phone = "0987654321";
      account.positionCompany = "Quản trị viên cấp cao";
      await account.save();
      console.log(`Đã cập nhật thành công tài khoản: ${email}`);
    } else {
      account = new AccountAdmin({
        fullName: "Quản trị viên hệ thống",
        email: email,
        password: hashPassword,
        role: role._id,
        status: "active",
        deleted: false,
        phone: "0987654321",
        positionCompany: "Quản trị viên cấp cao",
      });
      await account.save();
      console.log(`Đã tạo mới thành công tài khoản: ${email}`);
    }

    console.log("\n=================================");
    console.log("THÔNG TIN TÀI KHOẢN ADMIN FULL QUYỀN:");
    console.log(`- Email: ${email}`);
    console.log(`- Mật khẩu: ${rawPassword}`);
    console.log(`- Vai trò: ${role.name} (${allPermissions.length} quyền)`);
    console.log(`- Trạng thái: active`);
    console.log("=================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản:", error);
    process.exit(1);
  }
}

createSuperAdmin();
