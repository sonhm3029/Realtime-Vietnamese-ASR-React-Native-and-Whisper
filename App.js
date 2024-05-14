import {useCallback, useEffect, useState} from 'react';
import {
  Button,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';
import {Buffer} from 'buffer';
import WebSocket from 'react-native-websocket';
import {io} from 'socket.io-client';

const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'App needs access to your microphone to record audio.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

const socket = io('wss://1cef-183-91-15-7.ngrok-free.app');

export default function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [ws, setWs] = useState(null);
  const [transcription, setTranscription] = useState('');

  useEffect(() => {
    socket.on('transcription', data => {
      console.log('SOCKET', data.text);
      setTranscription(prev => prev + data.text);
    });

    return () => {
      socket.off('transcription');
    };
  }, []);

  useEffect(() => {
    (async () => {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        alert('Microphone permission is required to use this feature.');
      }
    })();
  }, []);

  const startStreaming = () => {
    LiveAudioStream.init({
      sampleRate: 32000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      bufferSize: 3200,
    });
    LiveAudioStream.start();

    LiveAudioStream.on('data', async data => {
      try {
        let chunk = Buffer.from(data, 'base64');
        socket.emit('audio_chunk', chunk);
        console.log('CHUNK RECEIVE');
      } catch (error) {
        console.log('STREAM ERROR', error);
      }
    });
    setIsStreaming(true);
  };
  const stopStreaming = () => {
    LiveAudioStream.stop();
    setIsStreaming(false);
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Live Audio Stream Example</Text>
      <Button
        title={isStreaming ? 'Stop Streaming' : 'Start Streaming'}
        onPress={isStreaming ? stopStreaming : startStreaming}
      />
      <Text>Transcription: {transcription}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
