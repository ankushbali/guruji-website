// ─────────────────────────────────────────────────────────────
//  VIDEO LINKS PARSER
//  Supports: YouTube, Facebook (video/reel), Instagram
//  Supports: Dynamic [Section] headers from youtube-links.txt
// ─────────────────────────────────────────────────────────────

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

    // ── Detect [Section Name] ──
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

  console.log('📄 Sections parsed:', Object.keys(sections));
  return sections;
}


// ─────────────────────────────────────────────────────────────
//  UNIVERSAL URL PARSER
//  YouTube / Facebook (all URL types) / Instagram
// ─────────────────────────────────────────────────────────────

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

  // ── Facebook ──
  // Covers: /reel/, /reels/, /watch?v=, /video/, /videos/, /share/
  const fbMatch = url.match(
    /facebook\.com(?:\/[^/]+)?\/(?:watch\/?\?v=(\d+)|video\/(\d+)|videos\/(\d+)|reel\/(\d+)|share\/(?:v\/)?(\d+)|reels\/(\d+))/i
  );
  const fbId = fbMatch &&
    (fbMatch[1] || fbMatch[2] || fbMatch[3] || fbMatch[4] || fbMatch[5] || fbMatch[6]);

  const isReel = /facebook\.com\/reel\//i.test(url);

  if (fbId || url.includes('facebook.com')) {
    const encodedUrl = encodeURIComponent(url);
    const embedUrl   = isReel
      ? `https://www.facebook.com/plugins/video.php?height=476&href=${encodedUrl}&show_text=false&width=267&t=0`
      : `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=560`;

    return {
      type     : 'facebook',
      embedUrl : embedUrl,
      sourceUrl: url,
      isReel   : isReel,
      title    : title || 'Guruji — Facebook Video',
      badge    : isReel ? '📘 Facebook Reel' : '📘 Facebook Video'
    };
  }

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


// ─────────────────────────────────────────────────────────────
//  BUILD: VIDEOS PAGE
//  Renders Drive MP4s + all sections from youtube-links.txt
// ─────────────────────────────────────────────────────────────

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

      // ── Facebook ──
      if (vid.type === 'facebook') {

        if (vid.isReel) {
          // Portrait reel
          card.innerHTML = `
            <div class="fb-reel-wrap">
              <iframe
                src="${vid.embedUrl}"
                width="267" height="476"
                style="border:none;overflow:hidden"
                scrolling="no" frameborder="0"
                allowfullscreen="true"
                allow="autoplay; clipboard-write; encrypted-media;
                       picture-in-picture; web-share">
              </iframe>
            </div>
            <div class="video-info">
              <div class="video-title">${vid.title}</div>
              <div class="video-meta">${vid.badge}</div>
            </div>`;

        } else {
          // Landscape video
          card.innerHTML = `
            <iframe class="video-embed"
              src="${vid.embedUrl}"
              width="560" height="315"
              style="border:none;overflow:hidden"
              scrolling="no" frameborder="0"
              allowfullscreen="true"
              allow="autoplay; clipboard-write; encrypted-media;
                     picture-in-picture; web-share">
            </iframe>
            <div class="video-info">
              <div class="video-title">${vid.title}</div>
              <div class="video-meta">${vid.badge}</div>
            </div>`;
        }

      // ── YouTube / Instagram ──
      } else {
        card.innerHTML = `
          <iframe class="video-embed"
            src="${vid.embedUrl}"
            title="${vid.title}"
            allow="accelerometer; autoplay; clipboard-write;
                   encrypted-media; gyroscope; picture-in-picture;
                   web-share"
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
// ── NEW CODE — embedded Drive video player ──
      card.innerHTML = `
        <div class="drive-video-wrap">
          <iframe
            src="https://drive.google.com/file/d/${file.id}/preview"
            width="640" height="360"
            allow="autoplay"
            allowfullscreen
            loading="lazy"
            style="border:none; width:100%; height:100%;">
          </iframe>
        </div>
        <div class="video-info">
          <div class="video-title">${name}</div>
          <div class="video-meta">🎬 Video${date ? ' · ' + date : ''}</div>
        </div>`;

      grid.appendChild(card);
      requestAnimationFrame(() => revealObserver.observe(card));
    });
  }
}
