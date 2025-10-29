// src/components/CountdownTimer.jsx
import React, { useState, useEffect, useRef } from 'react';

const CountdownTimer = ({ initialTimeInSeconds }) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const intervalRef = useRef(null);

  // Function to start the timer
  const startTimer = () => {
    if (intervalRef.current !== null) return; // Prevent multiple intervals

    intervalRef.current = setInterval(() => {
      setTimeLeft((prevTimeLeft) => {
        if (prevTimeLeft <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prevTimeLeft - 1;
      });
    }, 1000); // Update every second
  };

  // Function to stop the timer
  const stopTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  // Function to reset the timer
  const resetTimer = () => {
    stopTimer();
    setTimeLeft(initialTimeInSeconds);
  };

  // Effect to clean up the interval when the component unmounts
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  // Format the time for display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
  <div className="flex flex-col items-center text-center space-y-4">
    <h2 className="text-lg font-semibold">Countdown: {formatTime(timeLeft)}</h2>
    <div className="flex gap-3">
      <button
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition"
        onClick={startTimer}
      >
        Start
      </button>
      <button
        className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 transition"
        onClick={stopTimer}
      >
        Stop
      </button>
      <button
        className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition"
        onClick={resetTimer}
      >
        Reset
      </button>
    </div>
  </div>
);

};

export default CountdownTimer;