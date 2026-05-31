// ╔═══════════════════════════════════╗
// ║  🔧 CONFIGURATION — EDIT THESE   ║
// ╚═══════════════════════════════════╝
const API_KEY     = 'AIzaSyDegKB0By3JhcppdsM1Ur8YJ644HVArImA';
const ROOT_FOLDER = '1ZwZNt8Aa_XqnJw1_U8_ST0afcD59fBcY';

const FOLDER_NAMES = {
  photos : 'Photos',
  audio  : 'Audio',
  videos : 'Videos'
};
const YOUTUBE_FILE_NAME = 'youtube-links.txt';

// ── URL Builders ──
function imageUrl(fileId, size = 'w1200') {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
}
function audioUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
function driveVideoUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview?usp=sharing`;
}
function youtubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

// ── Utilities ──
function cleanName(name) {
  return name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
}
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}
