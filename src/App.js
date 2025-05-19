import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_KEY = process.env.YT_API_KEY;

function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [query, setQuery] = useState("Pilates"); // Default search query
  const [page, setPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoDetails, setVideoDetails] = useState([]); // Store video duration and other details

  const maxResultsPerPage = 10;
  const totalResults = 200;

  // Fetch videos based on the selected query (Pilates/Yoga) and current page
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/search`,
          {
            params: {
              part: "snippet",
              q: query,
              key: API_KEY,
              maxResults: maxResultsPerPage * page, // Adjust this to get the total number of videos for pagination
            },
          }
        );
        const videoIds = response.data.items.map((item) => item.id.videoId);
        fetchVideoDetails(videoIds); // Fetch detailed video information (duration)
        setVideos(response.data.items);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching videos:", error);
        setLoading(false);
      }
    };

    fetchVideos();
  }, [query, page]);

  // Fetch video duration and other details
  const fetchVideoDetails = async (videoIds) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: "contentDetails",
            id: videoIds.join(","),
            key: API_KEY,
          },
        }
      );
      setVideoDetails(response.data.items);
    } catch (error) {
      console.error("Error fetching video details:", error);
    }
  };

  // Filter videos by title
  const filteredVideos = videos.filter((video) =>
    video.snippet.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert YouTube video duration (ISO 8601) to seconds
  const convertDurationToSeconds = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1], 10) || 0;
    const minutes = parseInt(match[2], 10) || 0;
    const seconds = parseInt(match[3], 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Sort videos by duration
  const handleSortByLength = () => {
    const sorted = [...filteredVideos].sort((a, b) => {
      const aDetails = videoDetails.find((item) => item.id === a.id.videoId);
      const bDetails = videoDetails.find((item) => item.id === b.id.videoId);
      const aDuration = aDetails
        ? convertDurationToSeconds(aDetails.contentDetails.duration)
        : 0;
      const bDuration = bDetails
        ? convertDurationToSeconds(bDetails.contentDetails.duration)
        : 0;
      return aDuration - bDuration; // Sort in ascending order (shortest to longest)
    });
    setVideos(sorted);
  };

  // Pagination: Change page
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Show video in modal
  const openVideoModal = (videoId) => {
    const video = videos.find((v) => v.id.videoId === videoId);
    setSelectedVideo(video);
  };

  // Close the modal
  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="App">
      <h1>Pilates & Yoga Videos</h1>

      {/* Home screen to choose Pilates or Yoga */}
      <div className="buttons">
        <button onClick={() => setQuery("Pilates")} className="category-btn">
          Pilates
        </button>
        <button onClick={() => setQuery("Yoga")} className="category-btn">
          Yoga
        </button>
        <button
          onClick={() => setQuery("Barre Workout")}
          className="category-btn"
        >
          Barre
        </button>
      </div>

      {/* Search filter */}
      <input
        type="text"
        placeholder="Search by video title..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-bar"
      />

      {/* Sort by length */}
      <button onClick={handleSortByLength} className="sort-btn">
        Sort by Video Length
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="video-list">
          {filteredVideos.length === 0 && searchQuery && (
            <p>No videos found for your search query.</p>
          )}
          {filteredVideos.map((video) => (
            <div key={video.id.videoId} className="video-card">
              <div
                className="video-embed"
                onClick={() => openVideoModal(video.id.videoId)}
              >
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                  className="thumbnail"
                />
              </div>
              <h3>{video.snippet.title}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        {page > 1 && (
          <button
            onClick={() => handlePageChange(page - 1)}
            className="page-btn"
          >
            Previous
          </button>
        )}
        {page < totalResults / maxResultsPerPage && (
          <button
            onClick={() => handlePageChange(page + 1)}
            className="page-btn"
          >
            Next
          </button>
        )}
      </div>

      {/* Modal for video */}
      {selectedVideo && (
        <div className="modal" onClick={closeVideoModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeVideoModal}>
              X
            </button>
            <iframe
              width="100%"
              height="500px"
              src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}`}
              title={selectedVideo.snippet.title}
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
