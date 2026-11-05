const mongoose = require("mongoose");
require("dotenv").config();

const SOURCE_URI = "mongodb+srv://nguyenanhtuan:Anhtuan28112005@cluster0.nguon4a.mongodb.net/backup-db";
const TARGET_URI = "mongodb+srv://nguyenanhtuan:Anhtuan28112005@cluster0.nguon4a.mongodb.net/vnvivu-db";

async function cloneDatabase() {
  console.log("🔄 Đang kết nối Source Database (backup-db)...");
  const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
  console.log("✅ Đã kết nối Source Database!");

  console.log("🔄 Đang kết nối Target Database (vnvivu-db)...");
  const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
  console.log("✅ Đã kết nối Target Database!");

  // Lấy danh sách tất cả các collections từ source
  const collections = await sourceConn.db.listCollections().toArray();
  console.log(`📦 Tìm thấy ${collections.length} collections cần nhân bản.`);

  for (const collInfo of collections) {
    const collName = collInfo.name;
    // Bỏ qua system collections nếu có
    if (collName.startsWith("system.")) continue;

    console.log(`⏳ Đang sao chép collection: "${collName}"...`);
    const sourceColl = sourceConn.db.collection(collName);
    const targetColl = targetConn.db.collection(collName);

    // Lấy dữ liệu từ source
    const docs = await sourceColl.find({}).toArray();

    // Xóa dữ liệu cũ ở target nếu có để làm mới hoàn toàn
    await targetColl.deleteMany({});

    if (docs.length > 0) {
      // Nếu là collection setting, sửa luôn tên website thành VNVIVU
      if (collName === "settings" || collName === "setting-website") {
        docs.forEach(doc => {
          if (doc.websiteName) doc.websiteName = "VNVIVU";
          if (doc.copyright) doc.copyright = "© 2024 VNVIVU. All rights reserved.";
          if (doc.footerDescription) {
            doc.footerDescription = doc.footerDescription.replace(/OLD_BRAND/gi, "VNVIVU");
          }
        });
      }

      await targetColl.insertMany(docs);
      console.log(`  -> Đã chép ${docs.length} bản ghi vào "${collName}".`);
    } else {
      console.log(`  -> Collection "${collName}" rỗng.`);
    }
  }

  console.log("\n🎉 HOÀN TẤT NHÂN BẢN TOÀN BỘ DATABASE TỪ 'backup-db' SANG 'vnvivu-db'!");

  await sourceConn.close();
  await targetConn.close();
}

cloneDatabase().catch(err => {
  console.error("❌ Lỗi nhân bản database:", err);
  process.exit(1);
});
