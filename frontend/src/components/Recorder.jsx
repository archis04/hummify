// import React, { useState, useRef } from 'react';
// import { useDispatch } from 'react-redux';
// import { uploadAudio } from '../features/audioSlice';

// const AudioRecorder = () => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [title, setTitle] = useState('');
//   const [audioBlob, setAudioBlob] = useState(null);
//   const mediaRecorder = useRef(null);
//   const audioChunks = useRef([]);
//   const dispatch = useDispatch();
//   const { error: audioError } = useSelector((state) => state.audio);
//   const [error, setError] = useState('');
  

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       mediaRecorder.current = new MediaRecorder(stream);
      
//       mediaRecorder.current.ondataavailable = (e) => {
//         audioChunks.current.push(e.data);
//       };
      
//       mediaRecorder.current.onstop = () => {
//         const blob = new Blob(audioChunks.current, { type: 'audio/mp3' });
//         setAudioBlob(blob);
//         audioChunks.current = [];
//         stream.getTracks().forEach(track => track.stop());
//       };
      
//       mediaRecorder.current.start();
//       setIsRecording(true);
//     } catch (err) {
//       setError('Microphone access denied. Please enable microphone permissions.');
//       console.error('Error accessing microphone:', err);
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorder.current) {
//       mediaRecorder.current.stop();
//       setIsRecording(false);
//     }
//   };

//   const handleSubmit = () => {
//   if (!audioBlob || !title.trim()) return;
  
//   // Create file with proper extension
//   const audioFile = new File([audioBlob], `${Date.now()}.mp3`, {
//     type: 'audio/mpeg',  // Use standard MIME type
//   });
  
//   dispatch(uploadAudio({ audioFile, title }));
//   setTitle('');
//   setAudioBlob(null);
// };


//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <h2 className="text-xl font-bold mb-4">Record Audio</h2>
      
//       <div className="mb-4">
//         <input
//           type="text"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           placeholder="Audio title"
//           className="w-full p-2 border rounded"
//           disabled={isRecording}
//         />
//       </div>
      
//       <div className="flex space-x-4 mb-4">
//         <button
//           onClick={startRecording}
//           disabled={isRecording}
//           className={`px-4 py-2 rounded ${
//             isRecording ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600 text-white'
//           }`}
//         >
//           Start Recording
//         </button>
        
//         <button
//           onClick={stopRecording}
//           disabled={!isRecording}
//           className={`px-4 py-2 rounded ${
//             !isRecording ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600 text-white'
//           }`}
//         >
//           Stop Recording
//         </button>
//       </div>
      
//       {audioBlob && (
//         <div className="mt-4">
//           <audio controls src={URL.createObjectURL(audioBlob)} className="mb-4" />
//           <button
//             onClick={handleSubmit}
//             className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
//           >
//             Upload Audio
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AudioRecorder;