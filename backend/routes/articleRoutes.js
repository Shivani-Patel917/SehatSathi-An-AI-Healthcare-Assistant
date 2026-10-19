
import { Router } from "express";
import {
  getPublishedArticles,
  getPublishedArticleBySlug,
} from "../controllers/articleController.js";

const router = Router();

router.get("/", getPublishedArticles);
router.get("/:slug", getPublishedArticleBySlug);

export default router;
