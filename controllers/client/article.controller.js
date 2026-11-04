const Article = require("../../models/article.model");

// Hàm decode HTML entities thành ký tự Unicode thật
const decodeEntities = (str) => {
  if (!str) return '';
  // Decode numeric entities (&#NNNN; hoặc &#xHHHH;)
  return str
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec)))
    // Decode common named entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&agrave;/g, 'à').replace(/&aacute;/g, 'á').replace(/&acirc;/g, 'â').replace(/&atilde;/g, 'ã')
    .replace(/&Agrave;/g, 'À').replace(/&Aacute;/g, 'Á').replace(/&Acirc;/g, 'Â').replace(/&Atilde;/g, 'Ã')
    .replace(/&egrave;/g, 'è').replace(/&eacute;/g, 'é').replace(/&ecirc;/g, 'ê')
    .replace(/&Egrave;/g, 'È').replace(/&Eacute;/g, 'É').replace(/&Ecirc;/g, 'Ê')
    .replace(/&igrave;/g, 'ì').replace(/&iacute;/g, 'í')
    .replace(/&Igrave;/g, 'Ì').replace(/&Iacute;/g, 'Í')
    .replace(/&ograve;/g, 'ò').replace(/&oacute;/g, 'ó').replace(/&ocirc;/g, 'ô').replace(/&otilde;/g, 'õ')
    .replace(/&Ograve;/g, 'Ò').replace(/&Oacute;/g, 'Ó').replace(/&Ocirc;/g, 'Ô').replace(/&Otilde;/g, 'Õ')
    .replace(/&ugrave;/g, 'ù').replace(/&uacute;/g, 'ú').replace(/&ucirc;/g, 'û')
    .replace(/&Ugrave;/g, 'Ù').replace(/&Uacute;/g, 'Ú').replace(/&Ucirc;/g, 'Û')
    .replace(/&[a-zA-Z]+;/g, ' '); // bỏ entity còn lại
};

// Hàm strip HTML tags và decode entities để lấy text thuần
const stripHtml = (html) => {
  if (!html) return '';
  return decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
};

// [GET] /article
module.exports.index = async (req, res) => {
  const articles = await Article.find({
    status: "active",
    deleted: false
  }).sort({ position: "asc", createdAt: "desc" });

  // Tạo shortDesc cho mỗi bài
  for (const article of articles) {
    const plain = stripHtml(article.content);
    article.shortDesc = plain.length > 160 ? plain.substring(0, 160) + '...' : plain;
  }

  res.render("client/pages/article-list", {
    pageTitle: "Tin tức",
    articles: articles
  });
};

// [GET] /article/:slug
module.exports.detail = async (req, res) => {
  try {
    const slug = req.params.slug;

    const article = await Article.findOne({
      slug: slug,
      status: "active",
      deleted: false
    });

    if (article) {
      res.render("client/pages/article-detail", {
        pageTitle: article.title,
        article: article
      });
    } else {
      res.redirect("/article");
    }
  } catch (error) {
    res.redirect("/article");
  }
};
