// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchAudios, deleteAudio } from '../features/audioSlice';
// import AudioPlayer from './AudioPlayer';

// const AudioList = () => {
//     const dispatch = useDispatch();
//     const { recordings, status, error } = useSelector((state) => state.audio);
//     const [deletingId, setDeletingId] = useState(null);

//     const handleDelete = (id) => {
//         setDeletingId(id);
//         dispatch(deleteAudio(id))
//             .finally(() => setDeletingId(null));
//     };

//     useEffect(() => {
//         dispatch(fetchAudios());
//     }, [dispatch]);

//     if (status === 'loading') {
//         return <div className="text-center py-8">Loading...</div>;
//     }

//     if (error) {
//         return <div className="text-red-500 text-center py-8">Error: {error}</div>;
//     }

//     return (
//         <div className="mt-8">
//             <h2 className="text-xl font-bold mb-4">Recordings</h2>

//             {recordings.length === 0 ? (
//                 <p className="text-gray-500">No recordings found</p>
//             ) : (
//                 <div className="space-y-4">
//                     {recordings.map((audio) => (
//                         <div
//                             key={audio._id}
//                             className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
//                         >
//                             <div>
//                                 <h3 className="font-bold">{audio.title}</h3>
//                                 <p className="text-sm text-gray-500">
//                                     {new Date(audio.createdAt).toLocaleString()} |
//                                     Duration: {Math.round(audio.duration)}s
//                                 </p>
//                                 <AudioPlayer src={audio.cloudinaryUrl} />
//                             </div>

//                             <button
//                                 onClick={() => handleDelete(audio._id)}
//                                 disabled={deletingId === audio._id}
//                                 className="text-red-500 hover:text-red-700 disabled:opacity-50"
//                             >
//                                 {deletingId === audio._id ? 'Deleting...' : 'Delete'}
//                             </button>
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default AudioList;