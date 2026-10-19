
import Article from "../models/Article.js";

// GET /api/articles
export async function getPublishedArticles(req, res) {
  try {
    const { search = "", category = "", page = "1", limit = "12" } =
      req.query;

    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number.parseInt(limit, 10) || 12)
    );

    const filter = { published: true };

    if (category.trim() && category.toLowerCase() !== "all") {
      filter.category = category.trim();
    }

    if (search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { summary: { $regex: escapedSearch, $options: "i" } },
        { content: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .select("-content")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Article.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      articles,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get published articles error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load articles.",
    });
  }
}

// GET /api/articles/:slug
export async function getPublishedArticleBySlug(req, res) {
  try {
    const article = await Article.findOne({
      slug: req.params.slug,
      published: true,
    }).lean();

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    return res.status(200).json({ success: true, article });
  } catch (error) {
    console.error("Get article details error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load this article.",
    });
  }
}
