import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { mergeVideos } from './utils/mergeVideos';


const ffmpeg = createFFmpeg({ log: true });

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [videoToPlay, setVideoToPlay] = useState<{ src: string; type: string } | null>(null);
  const [outputVideo, setOutputVideo] = useState<string | null>(null);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const progress = useRef<number | null>(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      await ffmpeg.load();
      setFfmpegReady(true);
    };
    loadFFmpeg();
  }, []);

  // Handle file uploads
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // Function to merge media and export the video
  const mergeMedia = async () => {
    setIsMerging(true);
    await mergeVideos(
      ffmpeg,
      ffmpegReady,
      files,
      setDownloadUrl,
      setVideoToPlay,
      setOutputVideo,
      progress
    );
    setIsMerging(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Video Editor</h1>

      {!ffmpegReady && <p>Loading FFmpeg...</p>}

      {ffmpegReady && (
        <>
          {/* File Uploader */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{ border: '2px dashed #cccccc', padding: '20px', textAlign: 'center', cursor: 'pointer' }}
          >
            <p>Drag & drop some videos here, or click to select files</p>
          </div>

          {/* Display Uploaded Files */}
          <div style={{ marginTop: '20px' }}>
            <h3>Uploaded Files:</h3>
            <ul>
              {files.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>

          {/* Timeline to Display Uploaded Files */}
          <div style={{ marginTop: '20px' }}>
            <h3>Timeline</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', border: '1px solid #ccc', padding: '10px' }}>
              {files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid gray',
                    padding: '10px',
                    width: '100px',
                    textAlign: 'center',
                    margin: '0 10px',
                  }}
                >
                  {file.name}
                </div>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={mergeMedia}
            disabled={isMerging || files.length < 2}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isMerging ? 'Merging...' : 'Export Merged Video'}
          </button>

          {/* Video Player */}
          {videoToPlay && (
            <div style={{ marginTop: '20px' }}>
              <h3>Merged Video:</h3>
              <video controls src={videoToPlay.src} style={{ width: '100%' }} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;