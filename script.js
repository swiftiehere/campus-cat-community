const sampleCats = [{ id: 'mimi', name: '咪咪', pinyin: 'MI MI', location: '图书馆后门', gender: '女生猫猫', personality: '安静、亲人、爱晒太阳', status: '已绝育 · 已接种疫苗', note: '下午常在台阶边等一个温柔的摸摸。', image: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=85', created_at: '2026-01-01' }];
const config = window.CAT_ARCHIVE_CONFIG || {};
const usingSupabase = Boolean(config.url && config.anonKey);
const storageKey = 'campus-cat-archive-v2';
const favoritesKey = 'campus-cat-favorites-v2';
let cats = [];
let favorites = new Set(JSON.parse(localStorage.getItem(favoritesKey) || '[]'));
let favoriteCounts = JSON.parse(localStorage.getItem('campus-cat-favorite-counts-v2') || '{}');
let favoritesOnly = false;
let uploadedImage = '';
const grid = document.querySelector('#catGrid');
const form = document.querySelector('#catForm');
const dialog = document.querySelector('#catDialog');
const dialogContent = document.querySelector('#dialogContent');
const searchInput = document.querySelector('#searchInput');
const genderFilter = document.querySelector('#genderFilter');
const formMessage = document.querySelector('#formMessage');
const photoPreview = document.querySelector('#photoPreview');
const fallbackImage = sampleCats[0].image;

function apiHeaders(extra = {}) { return { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}`, ...extra }; }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function saveLocal() { localStorage.setItem(storageKey, JSON.stringify(cats.filter(cat => cat.id !== 'mimi'))); }
function saveFavorites() { localStorage.setItem(favoritesKey, JSON.stringify([...favorites])); }
function normalizeCat(cat) { return { ...cat, gender: cat.gender || '未知', pinyin: cat.pinyin || 'CAMPUS CAT', image: cat.image || fallbackImage }; }
async function loadCats() {
  if (usingSupabase) {
    const response = await fetch(`${config.url}/rest/v1/cats?select=*&order=created_at.asc`, { headers: apiHeaders(), cache: 'no-store' });
    if (!response.ok) throw new Error('云端档案读取失败');
    cats = [...sampleCats, ...(await response.json()).map(normalizeCat)];
    return;
  }
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  cats = [...sampleCats, ...saved.map(normalizeCat)];
}
function filteredCats() {
  const keyword = searchInput.value.trim().toLowerCase();
  return cats.filter(cat => `${cat.name} ${cat.location} ${cat.personality} ${cat.gender}`.toLowerCase().includes(keyword) && (genderFilter.value === 'all' || cat.gender === genderFilter.value) && (!favoritesOnly || favorites.has(cat.id)));
}
function render() {
  const visible = filteredCats();
  grid.innerHTML = visible.map(cat => `<article class="cat-card" data-id="${escapeHtml(cat.id)}" tabindex="0" role="button" aria-label="查看${escapeHtml(cat.name)}的档案"><div class="cat-photo-wrap"><img class="cat-photo" src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}的照片" loading="lazy" /><button class="favorite-button ${favorites.has(cat.id) ? 'is-favorite' : ''}" data-favorite="${escapeHtml(cat.id)}" type="button" aria-label="收藏${escapeHtml(cat.name)}">${favorites.has(cat.id) ? '♥' : '♡'}</button></div><div class="cat-body"><div class="cat-name-row"><h3 class="cat-name">${escapeHtml(cat.name)}</h3><span class="cat-pronunciation">${escapeHtml(cat.pinyin)}</span></div><p class="cat-location"><span>●</span>${escapeHtml(cat.location)}</p><div class="tags"><span class="tag gender">${escapeHtml(cat.gender)}</span><span class="tag">${escapeHtml((cat.personality || '待了解').split('、')[0])}</span><span class="tag status">${escapeHtml((cat.status || '情况未知').split(' · ')[0])}</span></div></div></article>`).join('');
  document.querySelector('#resultCount').textContent = `共 ${visible.length} 位居民`;
  document.querySelector('#favoriteCount').textContent = favorites.size;
  document.querySelector('#emptyState').classList.toggle('hidden', visible.length > 0);
  document.querySelector('#favoritesToggle').setAttribute('aria-pressed', favoritesOnly);
  document.querySelector('#totalCount').textContent = cats.length;
  document.querySelector('#favoriteTotal').textContent = favorites.size;
  document.querySelector('#femaleCount').textContent = cats.filter(cat => cat.gender === '女生猫猫').length;
  document.querySelector('#maleCount').textContent = cats.filter(cat => cat.gender === '男生猫猫').length;
  renderLeaderboard();
}
function renderLeaderboard() {
  const ranked = [...cats].sort((a, b) => (favoriteCounts[b.id] || 0) - (favoriteCounts[a.id] || 0));
  const list = document.querySelector('#leaderboardList');
  if (!ranked.some(cat => favoriteCounts[cat.id])) { list.innerHTML = '<div class="rank-empty">收藏几位猫猫后，这里会出现社区人气榜。</div>'; return; }
  list.innerHTML = ranked.filter(cat => favoriteCounts[cat.id]).slice(0, 6).map((cat, index) => `<div class="rank-item"><span class="rank-number">0${index + 1}</span><img class="rank-image" src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" /><div><div class="rank-name">${escapeHtml(cat.name)}</div><div class="rank-location">${escapeHtml(cat.location)}</div></div><span class="rank-likes">♥ ${favoriteCounts[cat.id]} 次</span></div>`).join('');
}
function toggleFavorite(id) { if (favorites.has(id)) { favorites.delete(id); favoriteCounts[id] = Math.max(0, (favoriteCounts[id] || 1) - 1); } else { favorites.add(id); favoriteCounts[id] = (favoriteCounts[id] || 0) + 1; } saveFavorites(); localStorage.setItem('campus-cat-favorite-counts-v2', JSON.stringify(favoriteCounts)); render(); }
function openDetails(cat) {
  dialogContent.innerHTML = `<div class="dialog-layout"><img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}的照片" /><div class="dialog-info"><span class="eyebrow">CAT PROFILE / ${escapeHtml(cat.pinyin)}</span><h2>${escapeHtml(cat.name)}</h2><p class="dialog-location">● ${escapeHtml(cat.location)}</p><dl><dt>性别</dt><dd>${escapeHtml(cat.gender)}</dd><dt>性格</dt><dd>${escapeHtml(cat.personality || '待同学们继续认识')}</dd><dt>健康</dt><dd>${escapeHtml(cat.status || '情况未知')}</dd></dl><p class="dialog-note">“${escapeHtml(cat.note || '这是一条由同学补充的校园猫猫档案。')}”</p><div class="dialog-buttons"><button class="edit-button" data-edit-cat type="button">编辑档案</button>${cat.id.startsWith('custom-') ? '<button class="delete-button" data-delete-cat type="button">删除这条档案</button>' : ''}</div></div></div>`;
  dialogContent.querySelector('[data-edit-cat]').onclick = () => { dialog.close(); fillForm(cat); };
  const deleteButton = dialogContent.querySelector('[data-delete-cat]');
  if (deleteButton) deleteButton.onclick = () => removeCat(cat, deleteButton);
  dialog.showModal();
}
function fillForm(cat) {
  for (const field of ['id', 'name', 'location', 'gender', 'status', 'personality', 'note']) form.elements[field].value = cat[field] || '';
  uploadedImage = cat.image === fallbackImage ? '' : cat.image;
  photoPreview.innerHTML = `<img src="${escapeHtml(cat.image)}" alt="当前照片" />`;
  document.querySelector('#submitLabel').textContent = '保存修改';
  document.querySelector('#cancelEdit').classList.remove('hidden');
  document.querySelector('#update').scrollIntoView({ behavior: 'smooth' });
}
function resetForm() { form.reset(); form.elements.id.value = ''; uploadedImage = ''; photoPreview.textContent = '＋'; document.querySelector('#submitLabel').textContent = '加入档案'; document.querySelector('#cancelEdit').classList.add('hidden'); }
async function removeCat(cat, button) {
  if (!confirm(`确定删除“${cat.name}”吗？删除后这条记录将无法恢复。`)) return;
  button.disabled = true;
  try {
    if (usingSupabase) { const response = await fetch(`${config.url}/rest/v1/cats?id=eq.${encodeURIComponent(cat.id)}`, { method: 'DELETE', headers: apiHeaders({ Prefer: 'return=minimal' }) }); if (!response.ok) throw new Error('云端删除失败'); }
    cats = cats.filter(item => item.id !== cat.id); if (!usingSupabase) saveLocal(); favorites.delete(cat.id); saveFavorites(); dialog.close(); render();
  } catch (error) { button.disabled = false; alert(error.message); }
}
async function uploadToSupabase(data, id) {
  if (!uploadedImage) return data.image;
  const blob = await fetch(uploadedImage).then(response => response.blob());
  const extension = blob.type.split('/')[1] || 'jpg';
  const path = `${id}.${extension}`;
  const upload = await fetch(`${config.url}/storage/v1/object/cat-photos/${path}`, { method: 'POST', headers: apiHeaders({ 'Content-Type': blob.type, 'x-upsert': 'true' }), body: blob });
  if (!upload.ok) throw new Error('照片上传失败');
  return `${config.url}/storage/v1/object/public/cat-photos/${path}`;
}
async function saveCat(cat, editing) {
  if (usingSupabase) {
    cat.image = await uploadToSupabase(cat, cat.id);
    const response = await fetch(`${config.url}/rest/v1/cats${editing ? `?id=eq.${encodeURIComponent(cat.id)}` : ''}`, { method: editing ? 'PATCH' : 'POST', headers: apiHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }), body: JSON.stringify(cat) });
    if (!response.ok) throw new Error('云端档案保存失败');
    return normalizeCat((await response.json())[0] || cat);
  }
  const index = cats.findIndex(item => item.id === cat.id);
  if (index >= 0) cats[index] = cat; else cats.push(cat);
  saveLocal();
  return cat;
}
document.querySelector('#photoInput').onchange = event => { const file = event.target.files[0]; if (!file) return; if (file.size > 6 * 1024 * 1024) { formMessage.textContent = '图片请小于 6MB'; event.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => { uploadedImage = reader.result; photoPreview.innerHTML = `<img src="${escapeHtml(uploadedImage)}" alt="已选择照片" />`; }; reader.readAsDataURL(file); };
form.onsubmit = async event => { event.preventDefault(); const data = new FormData(form); const editing = Boolean(data.get('id')); const id = data.get('id') || `custom-${Date.now()}`; const cat = { id, name: data.get('name').trim(), pinyin: editing ? (cats.find(item => item.id === id)?.pinyin || 'CAMPUS CAT') : 'NEW ENTRY', location: data.get('location').trim(), gender: data.get('gender'), personality: data.get('personality').trim() || '待同学们继续认识', status: data.get('status'), note: data.get('note').trim() || '这是一条由同学补充的校园猫猫档案。', image: uploadedImage || cats.find(item => item.id === id)?.image || fallbackImage, created_at: new Date().toISOString() }; formMessage.textContent = usingSupabase ? '正在同步到共享档案…' : '正在保存到本机…'; try { const saved = await saveCat(cat, editing); if (!editing && usingSupabase) cats.push(saved); resetForm(); formMessage.textContent = `${saved.name} 的档案已${editing ? '更新' : '加入'}社区`; render(); } catch (error) { formMessage.textContent = error.message; } };
grid.onclick = event => { const favorite = event.target.closest('[data-favorite]'); if (favorite) { event.stopPropagation(); toggleFavorite(favorite.dataset.favorite); return; } const card = event.target.closest('[data-id]'); if (card) openDetails(cats.find(cat => cat.id === card.dataset.id)); };
grid.onkeydown = event => { if (event.key === 'Enter') { const card = event.target.closest('[data-id]'); if (card) openDetails(cats.find(cat => cat.id === card.dataset.id)); } };
searchInput.oninput = render; genderFilter.onchange = render; document.querySelector('#favoritesToggle').onclick = () => { favoritesOnly = !favoritesOnly; render(); }; document.querySelector('#cancelEdit').onclick = resetForm; document.querySelector('#closeDialog').onclick = () => dialog.close(); dialog.onclick = event => { if (event.target === dialog) dialog.close(); }; document.onkeydown = event => { if (event.key === '/' && document.activeElement !== searchInput) { event.preventDefault(); searchInput.focus(); } };
(async function init() { try { await loadCats(); render(); } catch (error) { cats = [...sampleCats]; render(); formMessage.textContent = error.message; } }());
