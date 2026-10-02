import React, { useState, useRef, useEffect, useId } from 'react';

export default function SpeechMicButton({ 
  onTranscript, 
  title = "Dictate with Voice (Speech-to-Text)",
  className = "",
  style = {},
  size = 15
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const uniqueId = useId();
  const gradId = `micGrad-${uniqueId.replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const toggleListening = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or type directly.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript && onTranscript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech Recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      className={`speech-mic-btn ${isListening ? 'listening' : ''} ${className}`}
      onClick={toggleListening}
      title={isListening ? "Listening... Click to stop" : title}
      aria-label={isListening ? "Stop voice dictation" : "Start voice dictation"}
      style={style}
    >
      {isListening ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="7" width="3" height="10" rx="1.5" className="mic-wave-1" />
          <rect x="8.5" y="3" width="3" height="18" rx="1.5" className="mic-wave-2" />
          <rect x="14" y="5" width="3" height="14" rx="1.5" className="mic-wave-3" />
          <rect x="19.5" y="8" width="3" height="8" rx="1.5" className="mic-wave-4" />
        </svg>
      ) : (
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradId} x1="7" y1="2" x2="17" y2="14" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284c7" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {/* Modern Capsule Microphone */}
          <rect x="8" y="2" width="8" height="12" rx="4" fill={`url(#${gradId})`} />
          {/* Acoustic Grille Lines */}
          <line x1="10" y1="5.5" x2="14" y2="5.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
          <line x1="10.5" y1="8" x2="13.5" y2="8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
          {/* Cradle Arc */}
          <path d="M5 10.5v.5a7 7 0 0 0 14 0v-.5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
          {/* Base Stem */}
          <line x1="12" y1="18" x2="12" y2="21.5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
          {/* Base Foot */}
          <line x1="8.5" y1="21.5" x2="15.5" y2="21.5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
