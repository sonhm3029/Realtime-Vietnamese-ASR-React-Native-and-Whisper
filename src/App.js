import React, { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import "./App.css";
import * as RecordRTC from "recordrtc";

const socket = io("wss://8041-183-91-15-7.ngrok-free.app", {
  extraHeaders: {
    "ngrok-skip-browser-warning": "true",
  },
});

function App() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    socket.on(`transcription_${socket.id}`, (data) => {
      setTranscript(data.text);
    });

    return () => {
      socket.off("transcription");
    };
  }, [socket.id]);

  console.log(socket, "SOCKET");
  const sendBuffer = useCallback(
    (buffer) => {
      console.log("SEND", socket.id);
      socket.emit("audio_chunk", socket.id, buffer);
    },
    [socket.connected]
  );

  const startRecording = useCallback(() => {
    try {
      setTranscript("");
      socket.emit("control_transcript", { id: socket.id, action: "START" });
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaRecorderRef.current = new RecordRTC(stream, {
            type: "audio",
            mimeType: "audio/webm;codecs=pcm",
            recorderType: RecordRTC.StereoAudioRecorder,
            timeSlice: 300,
            desiredSampRate: 16000,
            numberOfAudioChannels: 1,
            bufferSize: 4096,
            audioBitsPerSecond: 128000,
            ondataavailable: async (blob) => {
              console.log("NEW DATA");
              const buffer = await blob.arrayBuffer();
              sendBuffer(buffer);
            },
          });
          mediaRecorderRef.current.startRecording();
        })
        .catch((err) => {
          console.log(err);
        });
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  }, socket.connected);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      console.log("STOP RECORDING")
      setIsRecording(false);
      mediaRecorderRef.current.stopRecording();
      socket.emit("control_transcript", { id: socket.id, action: "END" });
    }
  }, [socket.id]);

  return (
    <div className="App">
      <h1>Real-Time Speech Recognition</h1>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <p>{transcript}</p>
    </div>
  );
}

export default App;
