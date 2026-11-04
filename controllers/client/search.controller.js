const Tour = require("../../models/tour.model");
const City = require("../../models/city.model");
const moment = require("moment");

module.exports.list = async (req, res) => {
    try {
        let keyword = req.query.keyword || "";
        const safeKeyword = keyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const keywordRegex = new RegExp(safeKeyword, "i");
        
        let page = parseInt(req.query.page) || 1;
        let limit = 6;
        let skip = (page - 1) * limit;

        const find = {
            deleted: false,
            status: "active"
        };

        if (keyword) {
            find.name = keywordRegex;
        }

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

        const totalTour = await Tour.countDocuments(find);
        const totalPages = Math.ceil(totalTour / limit);

        const breadcrumb = {
            image: "https://res.cloudinary.com/dk4hfh4un/image/upload/v1780907694/tours/tgp9vs79kifu1lmiazxl.jpg",
            title: "Kết Quả Tìm Kiếm",
            list: [
                { link: "/", title: "Trang chủ" },
                { link: `/search?keyword=${keyword}`, title: "Tìm kiếm" }
            ]
        };

        const cityList = await City.find({
            deleted: false,
            status: "active"
        });
        const destinationList = await Tour.distinct("locations", {
            deleted: false,
            status: "active"
        });

        res.render("client/pages/search", {
            pageTitle: keyword ? `Kết quả tìm kiếm cho "${keyword}"` : "Tìm kiếm tour",
            keyword: keyword,
            tourList: tourList,
            totalTour: totalTour,
            page: page,
            totalPages: totalPages,
            breadcrumb: breadcrumb,
            cityList: cityList,
            destinationList: destinationList
        });
    } catch (error) {
        console.error(error);
        res.redirect("back");
    }
};