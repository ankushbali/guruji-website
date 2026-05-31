// ─────────────────────────────────────
//  VIDEO LINKS PARSER
//  Supports: YouTube, Facebook, Instagram
//  Supports: Dynamic [Section] headers
// ─────────────────────────────────────
async function fetchVideoLinks(rootItems) {
  const txtFile = rootItems.find(f => f.name === YOUTUBE_FILE_NAME);
  if (!txtFile) {
    console.warn('⚠️ youtube-links.txt not found in root folder.');
    return {};
  }

  const url = `https://www.googleapis.com/drive/v3/files/${txtFile.id}?alt=media&key=${API_KEY}`;
  let text = '';
  try {
    const res = await fetch(url);
    if (!res.ok) { console.warn('❌ Could not read youtube-links.txt'); return {}; }
    text = await res.text();
  } catch (e) {
    console.warn('❌ Fetch failed:', e);
    return {};
  }

  const sections = {};
  let currentSection = null;
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  for (const line of lines) {
    const cleanLine = line.replace(/[^\x20-\x7E]/g, '').trim();

    // Detect [Section Name]
    const sectionMatch = cleanLine.match(/^\[(.+?)\]/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      sections[currentSection] = [];
      console.log('📂 Section found:', currentSection);
      continue;
    }
    if (!currentSection) continue;

    let title = '', rawUrl = cleanLine;
    if (cleanLine.includes('|')) {
      const parts = cleanLine.split('|');
      title  = parts[0].trim();
      rawUrl = parts[1].trim();
    }

    console.log('🎬 Parsing:', title, '→', rawUrl);
    const videoObj = parseVideoUrl(rawUrl, title);
    if (videoObj) sections[currentSection].push(videoObj);
    else console.warn('⚠️ Could not parse URL:', rawUrl);
  }

  console.log('📄 Total lines parsed:', lines.length, lines);
  return sections;
}


// ─────────────────────────────────────
//  UNIVERSAL URL PARSER
//  YouTube / Facebook (all types) / Instagram
// ─────────────────────────────────────
function parseVideoUrl(url, title = '') {

  // ── YouTube ──
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return {
    type     : 'youtube',
    embedUrl : `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
    sourceUrl: url,
    title    : title || 'Guruji — YouTube Video',
    badge    : '▶️ YouTube'
  };

  // ── Facebook (watch, video, videos, reel, share/reels) ──
  const fbMatch = url.match(
    /facebook\.com(?:\/[^/]+)?\/(?:watch\/?\?v=(\d+)|video\/(\d+)|videos\/(\d+)|reel\/(\d+)|share\/(?:v\/)?(\d+)|reels\/(\d+))/i
  );
  const fbId = fbMatch &&
    (fbMatch[1] || fbMatch[2] || fbMatch[3] || fbMatch[4] || fbMatch[5] || fbMatch[6]);
  if (fbId || url.includes('facebook.com')) return {
    type     : 'facebook',
    embedUrl : null,
    sourceUrl: url,
    title    : title || 'Guruji — Facebook Video',
    badge    : '📘 Facebook'
  };

  // ── Instagram ──
  const igMatch = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (igMatch) return {
    type     : 'instagram',
    embedUrl : `https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed/`,
    sourceUrl: url,
    title    : title || 'Guruji — Instagram Video',
    badge    : '📸 Instagram'
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
        <p>No videos yet — add links to <strong>youtube-links.txt</strong>
           or MP4s to <strong>Videos/</strong>!</p>
      </div>`;
    return;
  }

  // ── Render each [Section] from youtube-links.txt ──
  sectionNames.forEach(sectionName => {
    const videos = videoSections[sectionName];
    if (!videos || !videos.length) return;

    // Section header
    const header = document.createElement('div');
    header.className = 'video-section-header reveal';
    header.innerHTML = `
      <h3 class="video-section-title">🎬 ${sectionName}</h3>
      <div class="video-section-divider"></div>`;
    container.appendChild(header);
    requestAnimationFrame(() => revealObserver.observe(header));

    // Section grid
    const grid = document.createElement('div');
    grid.className = 'video-grid-inner';
    container.appendChild(grid);

    videos.forEach((vid, i) => {
      const card = document.createElement('div');
      card.className = 'card video-card reveal';
      card.style.transitionDelay = `${i * 40}ms`;

      if (vid.type === 'facebook') {
        const fbThumb = `https://i.ibb.co/0jQwxWp/fb-placeholder.jpg`; // fallback
        card.innerHTML = `
          <a href="${vid.sourceUrl}"
             target="_blank" rel="noopener"
             class="fb-video-thumb">
            <div class="fb-play-btn">
              <svg viewBox="0 0 68 48" width="68" height="48">
                <path class="fb-play-bg" d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"/>
                <path class="fb-play-arrow" d="M45 24 27 14v20z"/>
              </svg>
            </div>
            <div class="fb-video-overlay">
              <span class="fb-open-label">📘 Watch on Facebook</span>
            </div>
          </a>
          <div class="video-info">
            <div class="video-title">${vid.title}</div>
            <div class="video-meta">${vid.badge}</div>
          </div>`;
      } else {
        // ── YouTube / Instagram → iframe embed ──
        card.innerHTML = `
          <iframe class="video-embed"
            src="${vid.embedUrl}"
            title="${vid.title}"
            allow="accelerometer; autoplay; clipboard-write;
                   encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen loading="lazy">
          </iframe>
          <div class="video-info">
            <div class="video-title">${vid.title}</div>
            <div class="video-meta">${vid.badge}</div>
          </div>`;
      }

      grid.appendChild(card);
      requestAnimationFrame(() => revealObserver.observe(card));
    });
  });

  // ── Drive MP4s → "Other Videos" section ──
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
           target="_blank" rel="noopener"
           class="drive-video-thumb">
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
