// ─────────────────────────────────────
//  BUILD: AUDIO
// ─────────────────────────────────────
function buildAudio(audios) {
  const grid = document.getElementById('audioGrid');
  grid.innerHTML = '';
  if (!audios.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🎵</div>
      <p>No audio yet — add MP3 files to the <strong>Audio/</strong> folder in Drive!</p></div>`;
    return;
  }
  const icons = ['🎵','🙏','🪔','🕉️','🪷','✨','🌸','🔔'];
  audios.forEach((file, i) => {
    const src  = `https://drive.google.com/file/d/${file.id}/preview`;
    const name = cleanName(file.name);
    const date = formatDate(file.createdTime);
    const icon = icons[i % icons.length];
    const card = document.createElement('div');
    card.className = 'card audio-card reveal';
    card.style.transitionDelay = `${i * 40}ms`;
    card.innerHTML = `
      <div class="audio-info">
        <div class="audio-icon">${icon}</div>
        <div>
          <div class="audio-title">${name}</div>
          <div class="audio-sub">${date || 'Satsang'}</div>
        </div>
      </div>
      <iframe src="${src}" width="100%" height="80" allow="autoplay"
        style="border:none; border-radius:12px; margin-top:4px;" loading="lazy">
      </iframe>`;
    grid.appendChild(card);
    requestAnimationFrame(() => revealObserver.observe(card));
  });
}
