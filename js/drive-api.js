// ─────────────────────────────────────
//  DRIVE API HELPERS
// ─────────────────────────────────────
async function fetchFolderContents(folderId) {
  const files = [];
  let pageToken = '';
  do {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q',        `'${folderId}' in parents and trashed = false`);
    url.searchParams.set('key',      API_KEY);
    url.searchParams.set('fields',   'nextPageToken, files(id, name, mimeType, createdTime)');
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('orderBy',  'name');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const res  = await fetch(url.toString());
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    files.push(...(data.files || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return files;
}

async function findSubfolder(parentId, name) {
  const safeName = name.replace(/'/g, "\\'");
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q',
    `'${parentId}' in parents and name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  url.searchParams.set('key',    API_KEY);
  url.searchParams.set('fields', 'files(id, name)');
  const res  = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.files?.[0] || null;
}
