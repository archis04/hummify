// import React, { useRef, useState } from 'react';

// const AudioPlayer = ({ src }) => {
//   const audioRef = useRef(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [progress, setProgress] = useState(0);

//   const togglePlay = () => {
//     if (isPlaying) {
//       audioRef.current.pause();
//     } else {
//       audioRef.current.play();
//     }
//     setIsPlaying(!isPlaying);
//   };

//   const handleTimeUpdate = () => {
//     const percentage = (audioRef.current.currentTime / audioRef.current.duration) * 100;
//     setProgress(percentage);
//   };

//   return (
//     <div className="mt-2 flex items-center">
//       <button onClick={togglePlay} className="mr-2">
//         {isPlaying ? '⏸️' : '▶️'}
//       </button>
      
//       <input
//         type="range"
//         min="0"
//         max="100"
//         value={progress}
//         onChange={(e) => {
//           const seekTime = (audioRef.current.duration * e.target.value) / 100;
//           audioRef.current.currentTime = seekTime;
//           setProgress(e.target.value);
//         }}
//         className="w-48"
//       />
      
//       <audio
//         ref={audioRef}
//         src={src}
//         onTimeUpdate={handleTimeUpdate}
//         onEnded={() => setIsPlaying(false)}
//         onPause={() => setIsPlaying(false)}
//         className="hidden"
//       />
//     </div>
//   );
// };

// export default AudioPlayer;