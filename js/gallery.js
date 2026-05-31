// ─────────────────────────────────────
//  BUILD: GALLERY + LIGHTBOX
// ─────────────────────────────────────
function buildGallery(images) {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  if (!images.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🖼️</div>
      <p>No photos yet — add images to the <strong>Photos/</strong> folder in Drive!</p></div>`;
    return;
  }
  document.getElementById('aboutImage').innerHTML =
    `<img src="${imageUrl(images[0].id, 'w800')}" alt="Guruji"
          onerror="this.parentElement.innerHTML='<span>🕉️</span>'"/>`;

  images.forEach((file, i) => {
    const thumb   = imageUrl(file.id, 'w600');
    const fullRes = imageUrl(file.id, 'w2000');
    const name    = cleanName(file.name);
    const card    = document.createElement('div');
    card.className = 'card gallery-card reveal';
    card.style.transitionDelay = `${i * 40}ms`;
    card.innerHTML = `
      <img src="${thumb}" alt="${name}" loading="lazy"
           onerror="this.parentElement.style.display='none'"/>
      <div class="gallery-overlay">${name}</div>`;
    card.addEventListener('click', () => openLightbox(fullRes, name));
    grid.appendChild(card);
    requestAnimationFrame(() => revealObserver.observe(card));
  });
}

function openLightbox(src, caption) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-caption').textContent = caption || '';
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightbox-img').src = '';
  document.body.style.overflow = '';
}
