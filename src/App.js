import { useState } from "react";
import "./App.css";

function App() {
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isRecording, setRecording] = useState(false);

  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    let audioChunks = [];
    let timer; // Timer variable to track silence duration

    mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunks);
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);

        // Send audioBlob to backend for transcription
        const formData = new FormData();
        formData.append("file", audioBlob, "ok.wav");

        const response = await fetch("http://localhost:8000/speech2text", {
            method: "POST",
            body: formData,
            headers: {
                Ivirsekey: "Ivirse speech2text vippro 01",
            },
        });
        console.log("THERE");
        const data = await response.json();
        setTranscript(data.data);
    });

    mediaRecorder.start();

    // Function to stop recording after 5 seconds of silence
    const stopRecordingAfterSilence = () => {
        mediaRecorder.stop();
    };

    // Function to reset timer
    const resetTimer = () => {
        clearTimeout(timer);
        timer = setTimeout(stopRecordingAfterSilence, 5000); // 5 seconds of silence
    };

    // Reset timer whenever there's audio input
    stream.getAudioTracks()[0].addEventListener("ended", resetTimer);
    resetTimer(); // Start the initial timer
  };

  const stopRecording = () => {
    setRecording(false);
  };

  return (
    <div>
      {isRecording ? (
        <button onClick={stopRecording}>Stop recording</button>
      ) : (
        <button onClick={startRecording}>Start talk</button>
      )}
      <div>{transcript}</div>
      <audio src={audioUrl}></audio>
    </div>
  );
}

export default App;
