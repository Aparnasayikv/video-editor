import { fetchFile } from '@ffmpeg/ffmpeg';

export const mergeVideos = async (
  ffmpeg: any,
  ffmpegReady: boolean,
  addedVideoFiles: File[],
  setDownloadUrl: (url: string | null) => void,
  setVideoToPlay: (video: { src: string; type: string } | null) => void,
  setOutputVideo: (url: string | null) => void,
  progress: React.MutableRefObject<number | null>
) => {
  if (!ffmpeg.isLoaded()) {
    console.log("ffmpeg not loaded");
    return;
  }

  const [video1, video2] = addedVideoFiles;

  ffmpeg.setLogger(({ type, message }: { type: string; message: string }) => {
    console.log("setLogger", type, message);
  });

  await ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
    console.log("progress track", ratio);
    progress.current = ratio;
  });

  console.log("videoFiles in mergeVideos ", addedVideoFiles);

  if (!video1 || !video2) {
    console.log("Please select two video files.");
    return;
  }

  try {
    if (!ffmpegReady) {
      console.log("FFmpeg not ready");
      return;
    }

    console.log("FFmpeg is ready");

    try {
      ffmpeg.FS("unlink", "video1.mp4");
      ffmpeg.FS("unlink", "video2.mp4");
      ffmpeg.FS("unlink", "output.mp4");
      console.log("Existing files deleted");
    } catch (error) {
      console.log("No existing files to delete");
    }

    await ffmpeg.FS("writeFile", "video1.mp4", await fetchFile(video1));
    await ffmpeg.FS("writeFile", "video2.mp4", await fetchFile(video2));

    await ffmpeg.run(
      "-i",
      "video1.mp4",
      "-vf",
      "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=30",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "18",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-vsync",
      "vfr",
      "normalized_video1.mp4"
    );

    await ffmpeg.run(
      "-i",
      "video2.mp4",
      "-vf",
      "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=30",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "18",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-vsync",
      "vfr",
      "normalized_video2.mp4"
    );

    await ffmpeg.run(
      "-i",
      "normalized_video1.mp4",
      "-i",
      "normalized_video2.mp4",
      "-filter_complex",
      "[0:v:0][1:v:0]concat=n=2:v=1[outv]",
      "-map",
      "[outv]",
      "output.mp4"
    );

    if (progress.current === 1) {
      console.log("completed file merge");

      const data = ffmpeg.FS("readFile", "output.mp4");

      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
      console.log("Merged video URL created:", url);
      setDownloadUrl(url);
      setVideoToPlay({ src: url, type: "video/mp4" });
      setOutputVideo(url);
    }

    console.log("Videos merged successfully");
  } catch (error) {
    console.error("Error merging videos:", error);
  }
};



