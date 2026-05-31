// ─────────────────────────────────────
//  INTERSECTION OBSERVER
// ─────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─────────────────────────────────────
//  ERROR STATE
// ─────────────────────────────────────
function showError(msg) {
  ['galleryGrid','audioGrid','videoGrid'].forEach(id => {
    document.getElementById(id).innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p><strong>Error:</strong> ${msg}</p>
      </div>`;
  });
  ['photoCount','audioCount','videoCount'].forEach(id => {
    document.getElementById(id).textContent = '!';
  });
}

// ─────────────────────────────────────
//  HAMBURGER
// ─────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// ─────────────────────────────────────
//  MAIN INIT
// ─────────────────────────────────────
async function init() {
  try {
    const rootItems = await fetchFolderContents(ROOT_FOLDER);
    console.log('📂 Root folder items:', rootItems.map(f => f.name));
    const [photosFolder, audioFolder, videosFolder] = await Promise.all([
      findSubfolder(ROOT_FOLDER, FOLDER_NAMES.photos),
      findSubfolder(ROOT_FOLDER, FOLDER_NAMES.audio),
      findSubfolder(ROOT_FOLDER, FOLDER_NAMES.videos)
    ]);
    const [photos, audios, driveVideos, videoSections] = await Promise.all([
      photosFolder ? fetchFolderContents(photosFolder.id) : Promise.resolve([]),
      audioFolder  ? fetchFolderContents(audioFolder.id)  : Promise.resolve([]),
      videosFolder ? fetchFolderContents(videosFolder.id) : Promise.resolve([]),
      fetchVideoLinks(rootItems)
    ]);
    buildGallery(photos);
    buildAudio(audios);
    buildVideos(driveVideos, videoSections);
    const totalVids = driveVideos.length + Object.values(videoSections).flat().length;
    document.getElementById('photoCount').textContent = photos.length || '0';
    document.getElementById('audioCount').textContent = audios.length || '0';
    document.getElementById('videoCount').textContent = totalVids    || '0';
  } catch (err) {
    console.error('❌ Init error:', err);
    showError(err.message || 'Something went wrong. Please try again.');
  }
}

init();
