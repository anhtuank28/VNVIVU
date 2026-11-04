const Category = require("../../models/category.model");
const Tour = require("../../models/tour.model");
const City = require("../../models/city.model");
const moment = require("moment");

module.exports.list=async (req,res)=>{
    
    const slug=req.params.slug;

    const category=await Category.findOne({
        slug:slug,
        deleted:false,
        status:"active"
    })

    if(category){
        const bannerImages = {
            "tour-trong-nuoc": "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907685/tours/ifir8lqnyf9knxtniwbr.jpg",
            "tour-nuoc-ngoai": "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907687/tours/cnbsrsdla64i6lqni2vx.jpg",
            "mien-bac": "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907694/tours/tgp9vs79kifu1lmiazxl.jpg",
            "mien-trung": "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907690/tours/iw1k2dyraxxugo7txzr6.jpg",
            "mien-nam": "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907690/tours/iw1k2dyraxxugo7txzr6.jpg",
            "chau-a": "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907691/tours/g05cdlb765kgjvbbc3mr.jpg",
            "chau-au": "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907687/tours/cnbsrsdla64i6lqni2vx.jpg",
            "chau-my": "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907692/tours/rl76viga6usxnlhbpffh.jpg",
            "chau-uc": "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907693/tours/cg5y4ltjvu22bzy028z5.jpg",
            "default": "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907694/tours/tgp9vs79kifu1lmiazxl.jpg"
        };
        
        const bannerImage = bannerImages[category.slug] || bannerImages["default"];

            //Breadcumb
    const breadcrumb={
        image:bannerImage,
        title:category.name,
        list:[
            {
                link:"/",
                title:"Trang chủ"
            }
        ]
    };
    // Lấy toàn bộ các danh mục cha bằng vòng lặp while (Hỗ trợ đa cấp)
    let currentCategory = category;
    const parentCategories = [];

    while (currentCategory.parent) {
        currentCategory = await Category.findOne({
            _id: currentCategory.parent,
            deleted: false,
            status: "active"
        });

        if (currentCategory) {
            parentCategories.unshift(currentCategory); // unshift để các cha lớn nhất nằm đầu mảng
        } else {
            break;
        }
    }

    // Nạp các danh mục cha vào list
    for (const parent of parentCategories) {
        breadcrumb.list.push({
            link: `/category/${parent.slug}`,
            title: parent.name
        });
    }

    // Nạp danh mục hiện tại vào list cuối cùng
    breadcrumb.list.push({
        link: `/category/${category.slug}`,
        title: category.name
    });
    //end breadcumb

    // Pagination logic
    let page = parseInt(req.query.page) || 1;
    let limit = 6; // Display 6 tours per page
    let skip = (page - 1) * limit;

    // Đệ quy lấy tất cả các danh mục con
    const getSubCategories = async (parentId) => {
        let subs = [];
        const children = await Category.find({ parent: parentId, deleted: false, status: "active" });
        for (const child of children) {
            subs.push(child._id.toString());
            const childSubs = await getSubCategories(child._id.toString());
            subs = subs.concat(childSubs);
        }
        return subs;
    };

    const subCategoryIds = await getSubCategories(category.id);
    const allCategoryIds = [category.id, ...subCategoryIds];

    const find = {
        category: { $in: allCategoryIds },
        deleted: false,
        status: "active"
    };

    if (req.query.locationFrom) {
        find.locationFrom = req.query.locationFrom;
    }

    if (req.query.locationTo) {
        const safeLocationTo = req.query.locationTo.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const locationRegex = new RegExp(safeLocationTo, "i");
        find.$or = [
            { name: locationRegex },
            { locations: locationRegex }
        ];
    }

    if (req.query.departureDate) {
        const date = new Date(req.query.departureDate);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        find.departureDate = {
            $gte: startOfDay,
            $lte: endOfDay
        };
    }

    if (req.query.price) {
        const [min, max] = req.query.price.split("-");
        if(min && max) {
            find.priceNewAdult = {
                $gte: parseInt(min),
                $lte: parseInt(max)
            };
        }
    }

    if (req.query.stockAdult && parseInt(req.query.stockAdult) > 0) {
        find.stockAdult = { $gte: parseInt(req.query.stockAdult) };
    }
    if (req.query.stockChildren && parseInt(req.query.stockChildren) > 0) {
        find.stockChildren = { $gte: parseInt(req.query.stockChildren) };
    }
    if (req.query.stockBaby && parseInt(req.query.stockBaby) > 0) {
        find.stockBaby = { $gte: parseInt(req.query.stockBaby) };
    }

    // Lấy danh sách các Tour thuộc danh mục này
    let sort = {};
    if (req.query.sortKey && req.query.sortKey !== "discount") {
        sort[req.query.sortKey] = req.query.sortValue === "asc" ? 1 : -1;
    } else if (!req.query.sortKey) {
        sort["position"] = -1;
    }

    let tourList = await Tour.find(find).sort(sort);

    if (req.query.sortKey === "discount") {
        tourList = tourList.sort((a, b) => {
            const discountA = a.priceAdult > 0 ? ((a.priceAdult - a.priceNewAdult) / a.priceAdult) * 100 : 0;
            const discountB = b.priceAdult > 0 ? ((b.priceAdult - b.priceNewAdult) / b.priceAdult) * 100 : 0;
            return req.query.sortValue === "asc" ? discountA - discountB : discountB - discountA;
        });
    }

    tourList = tourList.slice(skip, skip + limit);
    
    tourList.forEach(item => {
        if(item.departureDate) {
            item.departureDateFormat = moment(item.departureDate).format("DD/MM/YYYY");
        }
    });

    const cityList = await City.find({
        deleted: false,
        status: "active"
    });

    // Lấy danh sách các điểm đến (locations) duy nhất của các tour trong danh mục này
    const destinationList = await Tour.distinct("locations", {
        category: { $in: allCategoryIds },
        deleted: false,
        status: "active"
    });

    const totalTour = await Tour.countDocuments(find);

    const totalPages = Math.ceil(totalTour / limit);

    // Build query string for pagination links (preserve filters, exclude page)
    const queryParams = { ...req.query };
    delete queryParams.page;
    const queryString = new URLSearchParams(queryParams).toString();

    res.render("client/pages/tour-list", {
        pageTitle: category.name,
        breadcrumb: breadcrumb,
        tourList: tourList,
        category:category,
        cityList: cityList,
        destinationList: destinationList,
        totalTour: totalTour,
        page: page,
        totalPages: totalPages,
        queryString: queryString
    });
    }else{
        res.redirect("/");
    }

   
}

module.exports.listAll = async (req, res) => {
    const bannerImage = "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907694/tours/tgp9vs79kifu1lmiazxl.jpg";

    const breadcrumb = {
        image: bannerImage,
        title: "Tất Cả Tour",
        list: [
            { link: "/", title: "Trang chủ" },
            { link: "/category/all", title: "Tất Cả Tour" }
        ]
    };

    // Virtual category object for template
    const category = {
        name: "Tất Cả Tour",
        description: "Khám phá toàn bộ các tour du lịch trong nước và quốc tế hấp dẫn nhất."
    };

    let page = parseInt(req.query.page) || 1;
    let limit = 6;
    let skip = (page - 1) * limit;

    const find = { deleted: false, status: "active" };

    if (req.query.locationFrom) {
        find.locationFrom = req.query.locationFrom;
    }

    if (req.query.locationTo) {
        const safeLocationTo = req.query.locationTo.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const locationRegex = new RegExp(safeLocationTo, "i");
        find.$or = [
            { name: locationRegex },
            { locations: locationRegex }
        ];
    }

    if (req.query.departureDate) {
        const date = new Date(req.query.departureDate);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        find.departureDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (req.query.price) {
        const [min, max] = req.query.price.split("-");
        if (min && max) {
            find.priceNewAdult = { $gte: parseInt(min), $lte: parseInt(max) };
        }
    }

    if (req.query.stockAdult && parseInt(req.query.stockAdult) > 0) {
        find.stockAdult = { $gte: parseInt(req.query.stockAdult) };
    }
    if (req.query.stockChildren && parseInt(req.query.stockChildren) > 0) {
        find.stockChildren = { $gte: parseInt(req.query.stockChildren) };
    }
    if (req.query.stockBaby && parseInt(req.query.stockBaby) > 0) {
        find.stockBaby = { $gte: parseInt(req.query.stockBaby) };
    }

    let sort = {};
    if (req.query.sortKey && req.query.sortKey !== "discount") {
        sort[req.query.sortKey] = req.query.sortValue === "asc" ? 1 : -1;
    } else if (!req.query.sortKey) {
        sort["position"] = -1;
    }

    let tourList = await Tour.find(find).sort(sort);

    if (req.query.sortKey === "discount") {
        tourList = tourList.sort((a, b) => {
            const discountA = a.priceAdult > 0 ? ((a.priceAdult - a.priceNewAdult) / a.priceAdult) * 100 : 0;
            const discountB = b.priceAdult > 0 ? ((b.priceAdult - b.priceNewAdult) / b.priceAdult) * 100 : 0;
            return req.query.sortValue === "asc" ? discountA - discountB : discountB - discountA;
        });
    }

    tourList = tourList.slice(skip, skip + limit);

    tourList.forEach(item => {
        if (item.departureDate) {
            item.departureDateFormat = moment(item.departureDate).format("DD/MM/YYYY");
        }
    });

    const cityList = await City.find({ deleted: false, status: "active" });
    const destinationList = await Tour.distinct("locations", { deleted: false, status: "active" });
    const totalTour = await Tour.countDocuments(find);
    const totalPages = Math.ceil(totalTour / limit);

    // Build query string for pagination links (preserve filters, exclude page)
    const queryParams = { ...req.query };
    delete queryParams.page;
    const queryString = new URLSearchParams(queryParams).toString();

    res.render("client/pages/tour-list", {
        pageTitle: "Tất Cả Tour",
        breadcrumb,
        tourList,
        category,
        cityList,
        destinationList,
        totalTour,
        page,
        totalPages,
        queryString
    });
}