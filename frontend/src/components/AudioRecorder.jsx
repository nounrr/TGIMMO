import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2 } from "lucide-react";

export function AudioRecorder({ onAudioRecorded, existingAudioUrl, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(existingAudioUrl || null);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    setAudioUrl(existingAudioUrl);
  }, [existingAudioUrl]);

  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl !== existingAudioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      stopTimer();
      cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl, existingAudioUrl]);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!isRecording || !canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = "rgb(248, 250, 252)"; // bg-slate-50
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "rgb(220, 38, 38)"; // red-600
      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      // Audio Context Setup for Visualizer
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        onAudioRecorded(blob);
        stopTimer();
        setIsRecording(false);
        
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Impossible d'accéder au microphone. Vérifiez vos permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    if (audioUrl && audioUrl !== existingAudioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
    onAudioRecorded(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (disabled && !existingAudioUrl) {
      return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {!audioUrl && !isRecording && !disabled && (
        <Button type="button" variant="outline" onClick={startRecording} className="w-fit gap-2">
          <Mic className="h-4 w-4" />
          Enregistrer Audio
        </Button>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-md border border-red-100 shrink-0">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <span className="font-mono font-medium">{formatTime(recordingTime)}</span>
          </div>
          <canvas 
            ref={canvasRef} 
            width={200} 
            height={40} 
            className="rounded-md border bg-slate-50 flex-1 h-[40px]"
          />
          <Button type="button" variant="destructive" size="icon" onClick={stopRecording} className="shrink-0">
            <Square className="h-4 w-4" />
          </Button>
        </div>
      )}

      {audioUrl && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/20 w-full max-w-md">
          <audio controls src={audioUrl} className="h-8 w-full" />
          {!disabled && (
            <Button type="button" variant="ghost" size="icon" onClick={deleteRecording} className="text-destructive hover:text-destructive shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
