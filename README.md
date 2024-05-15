## Frontend

- `react-native-live-audio-stream`: For get audio buffer to make realtime speech recognition

- `socket.io-client`: For send and receive request

The parameters config is as follow:

```javascript
 LiveAudioStream.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      bufferSize: 14400,
    });
```

- sampleRate: default sample rate (adjust as you need)
- channels: default
- bitsPerSample: default
- audioSource: follow author of the package for speech recognition
- bufferSize: adjust for suitable backend

I have that config follow the experiment speech recognition in realtime with only python:


```Python
transcriber = pipeline(
    "automatic-speech-recognition", model="vinai/PhoWhisper-tiny", device="cpu"
)


import sys
import numpy as np


def transcribe(chunk_length_s=5.0, stream_chunk_s=0.3):
    sampling_rate = transcriber.feature_extractor.sampling_rate

    mic = ffmpeg_microphone_live(
        sampling_rate=sampling_rate,
        chunk_length_s=chunk_length_s,
        stream_chunk_s=stream_chunk_s,
    )
    
    print("Start speaking...")
    for item in transcriber(mic):
        sys.stdout.write("\033[K")
        print(item["text"], end="\r")
        print(item)
        if not item["partial"][0]:
            break

    return item["text"]
```

I adjust the bufferSize, experiment its until i have speech recognition run OK.
