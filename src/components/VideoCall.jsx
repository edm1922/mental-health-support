"use client";
import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';

export default function VideoCall({ roomUrl, userName, sessionId }) {
  const videoContainerRef = useRef(null);
  const [callObject, setCallObject] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomUrl) {
      setError("No video room URL provided");
      return;
    }
    
    try {
      // Create the Daily call object
      const daily = DailyIframe.createFrame({
        showLeaveButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '12px',
        },
        url: roomUrl,
      });

      // Add the iframe to our container
      if (videoContainerRef.current) {
        videoContainerRef.current.appendChild(daily.iframe);
      }
      
      setCallObject(daily);

      // Set up event listeners
      daily.on('joined-meeting', handleJoinedMeeting);
      daily.on('left-meeting', handleLeftMeeting);
      daily.on('participant-joined', handleParticipantUpdate);
      daily.on('participant-left', handleParticipantUpdate);
      daily.on('error', handleCallError);

      // Clean up on unmount
      return () => {
        if (daily) {
          daily.destroy();
        }
      };
    } catch (err) {
      console.error("Error initializing video call:", err);
      setError("Failed to initialize video call: " + err.message);
    }
  }, [roomUrl]);

  const handleJoinedMeeting = () => {
    setIsJoined(true);
    setError(null);
    console.log("Successfully joined the video call");
  };

  const handleLeftMeeting = () => {
    setIsJoined(false);
    console.log("Left the video call");
  };

  const handleParticipantUpdate = (event) => {
    // Update participant count when someone joins or leaves
    if (callObject) {
      const participants = callObject.participants();
      setParticipantCount(Object.keys(participants).length);
    }
  };

  const handleCallError = (err) => {
    console.error("Video call error:", err);
    setError(`Video call error: ${err.errorMsg || "Unknown error"}`);
  };

  const joinCall = () => {
    if (callObject) {
      try {
        callObject.join({ 
          userName: userName || "User",
          // You can add additional properties here
          // such as user role, profile image URL, etc.
        });
      } catch (err) {
        console.error("Error joining call:", err);
        setError("Failed to join call: " + err.message);
      }
    }
  };

  const leaveCall = () => {
    if (callObject) {
      callObject.leave();
    }
  };

  const toggleMute = () => {
    if (callObject) {
      const newMuteState = !isMuted;
      callObject.setLocalAudio(!newMuteState);
      setIsMuted(newMuteState);
    }
  };

  const toggleVideo = () => {
    if (callObject) {
      const newVideoState = !isVideoOff;
      callObject.setLocalVideo(!newVideoState);
      setIsVideoOff(newVideoState);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
        <h2 className="text-xl font-semibold">Counseling Session Video Call</h2>
        <p className="text-sm opacity-80">Session ID: {sessionId}</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 text-sm border-l-4 border-red-500">
          {error}
        </div>
      )}
      
      <div className="flex-grow relative">
        <div 
          ref={videoContainerRef} 
          className="absolute inset-0 bg-gray-100"
        />
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {isJoined ? (
              <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
            ) : (
              <span>Not connected</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            {isJoined && (
              <>
                <button 
                  onClick={toggleMute}
                  className={`p-2 rounded-full ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-700'}`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.586 7.414l4.293 4.293-4.293 4.293a1 1 0 001.414 1.414l4.293-4.293 4.293 4.293a1 1 0 001.414-1.414l-4.293-4.293 4.293-4.293a1 1 0 00-1.414-1.414l-4.293 4.293-4.293-4.293a1 1 0 00-1.414 1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={toggleVideo}
                  className={`p-2 rounded-full ${isVideoOff ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-700'}`}
                  title={isVideoOff ? "Turn video on" : "Turn video off"}
                >
                  {isVideoOff ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      <path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      <path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  )}
                </button>
              </>
            )}
            
            {!isJoined ? (
              <button 
                onClick={joinCall}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Join Call
              </button>
            ) : (
              <button 
                onClick={leaveCall}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Leave Call
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
