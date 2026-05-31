// ─────────────────────────────────────
//  VIDEO LINKS PARSER
// ─────────────────────────────────────
async function fetchVideoLinks(rootItems) {
  const txtFile = rootItems.find(f => f.name === YOUTUBE_FILE_NAME);
  if (!txtFile) { console.warn('⚠️ youtube-links.txt not found'); return {}; }

  const url = `https://www.googleapis.com/drive/v3/files/${txtFile.id}?alt=media&key=${API_KEY}`;
  let text = '';
  try {
    const res = await fetch(url);
    if (!res.ok) { console.warn('❌ Could not read youtube-links.txt'); return {}; }
    text = await res.text();
  } catch (e) { console.warn('❌ Fetch failed:', e); return {}; }

  const sections = {};
  let currentSection = null;
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  for (const line of lines) {
    const cleanLine = line.replace(/[^\x20-\x7E]/g, '').trim();
    const sectionMatch = cleanLine.match(/^\[(.+?)\]/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      sections[currentSection] = [];
      continue;
    }
    if (!currentSection) continue;
    let title = '', rawUrl = cleanLine;
    if (cleanLine.includes('|')) {
      const parts = cleanLine.split('|');
      title  = parts[0].trim();
      rawUrl = parts[1].trim();
    }
    const videoObj = parseVideoUrl(rawUrl, title);
    if (videoObj) sections[currentSection].push(videoObj);
    else console.warn('⚠️ Could not parse URL:', rawUrl);
  }
  return sections;
}

// ─────────────────────────────────────
//  UNIVERSAL URL PARSER
// ─────────────────────────────────────
function parseVideoUrl(url, title = '') {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return {
    type: 'youtube',
    embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
    title: title || 'Guruji — YouTube Video',
    badge: '▶️ YouTube'
  };

  const fbMatch = url.match(/facebook\.com\/(watch\/?\\?v=(\d+)|video\/(\d+)|.*\/videos\/(\d+))/);
  const fbId = fbMatch && (fbMatch[2] || fbMatch[3] || fbMatch[4]);
  if (fbId) return {
    type: 'facebook',
    embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`,
    title: title || 'Guruji — Facebook Video',
    badge: '📘 Facebook'
  };

  const igMatch = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (igMatch) return {
    type: 'instagram',
    embedUrl: `https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed/`,
    title: title || 'Guruji — Instagram Video',
    badge: '📸 Instagram'
  };

  return null;
}

// ─────────────────────────────────────
//  BUILD: VIDEOS
// ─────────────────────────────────────
function buildVideos(driveVideos, videoSections) {
  const container = document.getElementById('videoGrid');
  container.innerHTML = '';

  const sectionNames = Object.keys(videoSections);
  const hasDrive     = driveVideos.length > 0;
  const hasSections  = sectionNames.length > 0;

  if (!hasDrive && !hasSections) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎬</div>
        <p>No videos yet — add links to <strong>youtube-links.txt</strong> or MP4s to <strong>Videos/</strong>!</p>
      </div>`;
    return;
  }

  sectionNames.forEach(sectionName => {
    const videos = videoSections[sectionName];
    if (!videos || !videos.length) return;
    const header = document.createElement('div');
    header.className = 'video-section-header reveal';
    header.innerHTML = `
      <h3 class="video-section-title">🎬 ${sectionName}</h3>
      <div class="video-section-divider"></div>`;
    container.appendChild(header);
    requestAnimationFrame(() => revealObserver.observe(header));

    const grid = document.createElement('div');
    grid.className = 'video-grid-inner';
    container.appendChild(grid);

    videos.forEach((vid, i) => {
      const card = document.createElement('div');
      card.className = 'card video-card reveal';
      card.style.transitionDelay = `${i * 40}ms`;
      card.innerHTML = `
        <iframe class="video-embed" src="${vid.embedUrl}" title="${vid.title}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen loading="lazy"></iframe>
        <div class="video-info">
          <div class="video-title">${vid.title}</div>
          <div class="video-meta">${vid.badge}</div>
        </div>`;
      grid.appendChild(card);
      requestAnimationFrame(() => revealObserver.observe(card));
    });
  });

  if (hasDrive) {
    const header = document.createElement('div');
    header.className = 'video-section-header reveal';
    header.innerHTML = `
      <h3 class="video-section-title">🎬 Other Videos</h3>
      <div class="video-section-divider"></div>`;
    container.appendChild(header);
    requestAnimationFrame(() => revealObserver.observe(header));

    const grid = document.createElement('div');
    grid.className = 'video-grid-inner';
    container.appendChild(grid);

    driveVideos.forEach((file, i) => {
      const name = cleanName(file.name);
      const date = formatDate(file.createdTime);
      const card = document.createElement('div');
      card.className = 'card video-card reveal';
      card.style.transitionDelay = `${i * 40}ms`;
      card.innerHTML = `
        <a href="https://drive.google.com/file/d/${file.id}/view"
           target="_blank" rel="noopener" class="drive-video-thumb">
          <div class="drive-play-icon">▶</div>
          <div class="drive-video-label">🎬 Click to Watch</div>
        </a>
        <div class="video-info">
          <div class="video-title">${name}</div>
          <div class="video-meta">🎬 Video${date ? ' · ' + date : ''}</div>
        </div>`;
      grid.appendChild(card);
      requestAnimationFrame(() => revealObserver.observe(card));
    });
  }
}
