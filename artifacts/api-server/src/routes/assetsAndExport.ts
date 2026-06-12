import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sceneImagesTable, sceneVideosTable, batchQueueStateTable, movieExportsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

// ─── Get Storyboard Assets ──────────────────────────────────────────────

router.get("/storyboard/assets", async (req, res): Promise<void> => {
  const storyboardId = req.query["storyboardId"] as string | undefined;
  if (!storyboardId) {
    res.status(400).json({ error: "storyboardId query parameter is required" });
    return;
  }

  try {
    const [images, videos, batch] = await Promise.all([
      db.select().from(sceneImagesTable).where(eq(sceneImagesTable.storyboardId, storyboardId)),
      db.select().from(sceneVideosTable).where(eq(sceneVideosTable.storyboardId, storyboardId)),
      db.select().from(batchQueueStateTable).where(eq(batchQueueStateTable.storyboardId, storyboardId)).then(rows => rows[0] ?? null),
    ]);

    // Merge by sceneNumber
    const sceneMap = new Map<number, Record<string, unknown>>();
    for (const img of images) {
      const entry = sceneMap.get(img.sceneNumber) ?? { sceneNumber: img.sceneNumber };
      entry.imageUrl = img.imageUrl;
      entry.imageProvider = img.imageProvider;
      entry.imageStatus = img.imageStatus;
      entry.createdAt = img.createdAt?.toISOString();
      sceneMap.set(img.sceneNumber, entry);
    }
    for (const vid of videos) {
      const entry = sceneMap.get(vid.sceneNumber) ?? { sceneNumber: vid.sceneNumber };
      entry.videoUrl = vid.videoUrl;
      entry.videoProvider = vid.videoProvider;
      entry.videoStatus = vid.videoStatus;
      entry.videoDuration = vid.videoDuration;
      entry.generationTime = vid.generationTime;
      entry.generationError = vid.generationError;
      entry.createdAt = vid.createdAt?.toISOString();
      sceneMap.set(vid.sceneNumber, entry);
    }

    const scenes = Array.from(sceneMap.values());
    const batchQueue = batch
      ? {
          status: batch.status,
          completedScenes: batch.completedScenes ?? [],
          failedScenes: batch.failedScenes ?? [],
          activeScene: batch.activeScene,
          queueProgress: batch.queueProgress ?? 0,
          estimatedRemainingTime: batch.estimatedRemainingTime ?? 0,
          totalScenes: batch.totalScenes ?? 0,
          provider: batch.provider,
          duration: batch.duration,
        }
      : null;

    res.json({ storyboardId, scenes, batchQueue });
  } catch (err) {
    req.log.warn({ err }, "Failed to load storyboard assets");
    res.status(500).json({ error: "Failed to load assets" });
  }
});

// ─── Get Batch Status (persisted) ──────────────────────────────────────

router.get("/storyboard/batch-status", async (req, res): Promise<void> => {
  const storyboardId = req.query["storyboardId"] as string | undefined;
  if (!storyboardId) {
    res.status(400).json({ error: "storyboardId query parameter is required" });
    return;
  }

  try {
    const row = await db.select().from(batchQueueStateTable).where(eq(batchQueueStateTable.storyboardId, storyboardId)).then(rows => rows[0] ?? null);
    if (!row) {
      res.json({ status: "idle", completedScenes: [], failedScenes: [], activeScene: null, queueProgress: 0, estimatedRemainingTime: 0, totalScenes: 0, provider: null, duration: null });
      return;
    }
    res.json({
      status: row.status,
      completedScenes: row.completedScenes ?? [],
      failedScenes: row.failedScenes ?? [],
      activeScene: row.activeScene,
      queueProgress: row.queueProgress ?? 0,
      estimatedRemainingTime: row.estimatedRemainingTime ?? 0,
      totalScenes: row.totalScenes ?? 0,
      provider: row.provider,
      duration: row.duration,
    });
  } catch (err) {
    req.log.warn({ err }, "Failed to load batch status");
    res.status(500).json({ error: "Failed to load batch status" });
  }
});

// ─── Movie Export ─────────────────────────────────────────────────

interface MovieExportRequestBody {
  storyboardId: string;
  format: string;
  sceneOrder?: number[];
  transitionType?: string;
  subtitleConfig?: {
    enabled?: boolean;
    language?: string;
    style?: string;
  };
  audioLayer?: {
    musicEnabled?: boolean;
    voiceEnabled?: boolean;
    effectsEnabled?: boolean;
  };
}

const validExportFormats = ["mp4", "vertical_shorts", "youtube", "tiktok", "cinematic_widescreen"];

router.post("/storyboard/movie-export", async (req, res): Promise<void> => {
  const body = req.body as MovieExportRequestBody;

  if (!body.storyboardId || !body.format) {
    res.status(400).json({ error: "storyboardId and format are required" });
    return;
  }

  if (!validExportFormats.includes(body.format)) {
    res.status(400).json({ error: `Invalid format. Must be one of: ${validExportFormats.join(", ")}` });
    return;
  }

  const exportId = randomUUID();
  const now = new Date().toISOString();

  try {
    // Insert into DB
    await db.insert(movieExportsTable).values({
      storyboardId: body.storyboardId,
      exportId,
      format: body.format,
      status: "processing",
      sceneOrder: body.sceneOrder ?? [],
      transitionType: body.transitionType ?? "cinematic_cut",
      subtitleConfig: body.subtitleConfig ?? {},
      audioLayer: body.audioLayer ?? {},
      exportProgress: 0,
    });

    // Start async "assembly" (placeholder — real assembly would use ffmpeg)
    const runExport = async () => {
      // Step 1: gather scene videos
      const videos = await db.select().from(sceneVideosTable).where(
        eq(sceneVideosTable.storyboardId, body.storyboardId)
      );
      const sceneOrder = body.sceneOrder && body.sceneOrder.length > 0 ? body.sceneOrder : videos.map(v => v.sceneNumber);
      const total = sceneOrder.length;
      if (total === 0) {
        await db.update(movieExportsTable)
          .set({ status: "failed", exportError: "No scene videos available for export" })
          .where(eq(movieExportsTable.exportId, exportId));
        return;
      }

      // Simulate progress
      for (let i = 0; i < total; i++) {
        await new Promise(r => setTimeout(r, 800));
        const progress = Math.round(((i + 1) / total) * 100);
        await db.update(movieExportsTable)
          .set({ exportProgress: progress })
          .where(eq(movieExportsTable.exportId, exportId));
      }

      // Finalize — placeholder URL
      const placeholderUrl = `https://example.com/exports/${exportId}/${body.format}.mp4`;
      await db.update(movieExportsTable)
        .set({ status: "completed", exportUrl: placeholderUrl, exportProgress: 100, duration: total * 5 })
        .where(eq(movieExportsTable.exportId, exportId));
    };

    runExport().catch(async (err) => {
      await db.update(movieExportsTable)
        .set({ status: "failed", exportError: err instanceof Error ? err.message : "Export failed" })
        .where(eq(movieExportsTable.exportId, exportId));
    });

    res.json({
      exportId,
      storyboardId: body.storyboardId,
      format: body.format,
      status: "processing",
      exportProgress: 0,
      createdAt: now,
    });
  } catch (err) {
    req.log.warn({ err }, "Failed to create movie export");
    res.status(500).json({ error: "Failed to create movie export" });
  }
});

// GET export by id
router.get("/storyboard/movie-export/:exportId", async (req, res): Promise<void> => {
  const exportId = req.params["exportId"];
  if (!exportId) {
    res.status(400).json({ error: "exportId is required" });
    return;
  }

  try {
    const row = await db.select().from(movieExportsTable).where(eq(movieExportsTable.exportId, exportId)).then(rows => rows[0] ?? null);
    if (!row) {
      res.status(404).json({ error: "Export not found" });
      return;
    }
    res.json({
      exportId: row.exportId,
      storyboardId: row.storyboardId,
      format: row.format,
      status: row.status,
      exportUrl: row.exportUrl,
      exportProgress: row.exportProgress ?? 0,
      exportError: row.exportError,
      fileSize: row.fileSize,
      duration: row.duration,
      createdAt: row.createdAt?.toISOString(),
    });
  } catch (err) {
    req.log.warn({ err }, "Failed to load movie export");
    res.status(500).json({ error: "Failed to load export" });
  }
});

export default router;
