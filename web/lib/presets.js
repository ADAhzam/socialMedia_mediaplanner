'use strict';
// Channel-mix presets (percent allocations) by archetype and tier index (0,1,2).
const PRESETS = {
  branding: [
    { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 },
    { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 },
    { google_search: 8, meta_feed_image: 42, meta_feed_video: 30, meta_reels: 20 },
  ],
  jobad: [
    { google_search: 55, meta_feed_image: 30, meta_feed_video: 15 },
    { google_search: 50, meta_feed_image: 30, meta_feed_video: 20 },
    { google_search: 45, meta_feed_image: 30, meta_feed_video: 15, meta_reels: 10 },
  ],
};
module.exports = { PRESETS };
