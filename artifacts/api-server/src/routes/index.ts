import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storyboardRouter from "./storyboard";
import imageGenerationRouter from "./imageGeneration";
import videoGenerationRouter from "./videoGeneration";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storyboardRouter);
router.use(imageGenerationRouter);
router.use(videoGenerationRouter);

export default router;
