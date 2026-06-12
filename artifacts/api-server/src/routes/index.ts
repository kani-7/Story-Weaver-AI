import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storyboardRouter from "./storyboard";
import imageGenerationRouter from "./imageGeneration";
import videoGenerationRouter from "./videoGeneration";
import assetsAndExportRouter from "./assetsAndExport";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storyboardRouter);
router.use(imageGenerationRouter);
router.use(videoGenerationRouter);
router.use(assetsAndExportRouter);

export default router;
