import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storyboardRouter from "./storyboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storyboardRouter);

export default router;
