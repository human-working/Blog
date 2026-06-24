import { Router, Request, Response } from "express";
import multer from "multer";
import { AppDataSource } from "../data-source";
import { Media } from "../entities/Media";
import cloudinary from "../cloudinary";
import { uploadMediaSchema } from "../schemas/media";
import { validate } from "../middleware/validate";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const mediaRouter = Router();
const mediaRepo = AppDataSource.getRepository(Media);

// store file in memory rather than disk
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"));
    }
  }
});

// upload media
mediaRouter.post("/media/upload", authenticate, validate(uploadMediaSchema), upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const { postId, replyId } = req.body;

    // upload to cloudinary from buffer
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          resource_type: "auto", 
          folder: "forum-media"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file!.buffer);
    });

    // save to DB
    const media = mediaRepo.create({
      url: result.secure_url,
      type: req.file.mimetype.startsWith("image") ? "image" : "video",
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user!.userId,
      postId: postId ? Number(postId) : null,
      replyId: replyId ? Number(replyId) : null,
    });

    await mediaRepo.save(media);

    res.status(201).json({ message: "Media uploaded successfully", media });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// get media by postId
mediaRouter.get("/media/post/:postId", async (req: Request, res: Response) => {
  try {
    const media = await mediaRepo.find({
      where: { postId: Number(req.params.postId)}
    });

   
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// get media by replyId
mediaRouter.get("/media/reply/:replyId", async (req: Request, res: Response) => {
  try {
    const media = await mediaRepo.find({
      where: { replyId: Number(req.params.replyId) }
    });
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// delete media — only uploader can delete
mediaRouter.delete("/media/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const media = await mediaRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!media) return res.status(404).json({ message: "Media not found" });

    if (media.uploadedBy !== req.user!.userId) {
      return res.status(403).json({ message: "You can only delete your own media" });
    }

    // extract public_id from cloudinary URL to delete from cloud too
    const publicId = media.url.split("/").pop()?.split(".")[0];
    if (publicId) await cloudinary.uploader.destroy(`forum-media/${publicId}`);

    await mediaRepo.remove(media);
    res.json({ message: "Media deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default mediaRouter;