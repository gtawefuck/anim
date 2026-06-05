/* SoulScythe runtime configuration. Loaded before main.js / auth.js / video-bg.js. */
window.SS_CONFIG = {
  // URL of the deployed auth backend (the /server app). Local dev default below.
  // After deploying the server, change this to e.g. "https://your-api.onrender.com".
  API_BASE: "http://localhost:4000",

  // Background video playlist. These are ROYALTY-FREE demo loops so the effect
  // works out of the box. Replace them with your own LICENSED anime clips
  // (highest quality / 4K first). Order = play order.
  VIDEO_SOURCES: [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
  ],

  // Milliseconds each clip shows before crossfading to the next.
  VIDEO_ROTATE_MS: 14000
};
