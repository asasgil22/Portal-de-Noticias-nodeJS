const params = new URLSearchParams(window.location.search);
const identificador = params.get('slug') || params.get('id');
const container = document.getElementById('noticia-detalhe');
const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
});
let configPortal = null;

document.addEventListener('DOMContentLoaded', carregarNoticia);

async function carregarNoticia() {
  if (!identificador) {
    container.innerHTML = '<div class="empty-box">Noticia nao informada.</div>';
    return;
  }

  try {
    await carregarConfig();
    const resposta = await fetch(`/api/noticias/${encodeURIComponent(identificador)}`);
    if (!resposta.ok) throw new Error('Noticia nao encontrada');
    const noticia = await resposta.json();

    fetch(`/api/noticias/${encodeURIComponent(identificador)}/view`, { method: 'POST' }).catch(() => {});

    document.title = `${noticia.titulo} - Portal Noticias`;
    container.innerHTML = `
      <div class="news-meta">
        <span>${escapeHtml(noticia.categoria || 'Geral')}</span>
        <span>${formatarData(noticia.data)}</span>
        <span>${escapeHtml(noticia.autor || 'Redacao')}</span>
      </div>
      <h1>${escapeHtml(noticia.titulo)}</h1>
      <p class="article-lead">${escapeHtml(noticia.resumo || '')}</p>
      ${Array.isArray(noticia.tags) && noticia.tags.length
        ? `<div class="tag-row mb-3">${noticia.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>`
        : ''}
      ${noticia.imagemUrl
        ? `<img class="article-image" src="${noticia.imagemUrl}" alt="${escapeHtml(noticia.titulo)}">`
        : mediaPadrao(noticia)}
      <div class="article-body">
        ${formatarConteudo(noticia.conteudo || noticia.resumo || '')}
      </div>
    `;
  } catch {
    container.innerHTML = '<div class="empty-box">Nao foi possivel carregar esta noticia.</div>';
  }
}

async function carregarConfig() {
  if (configPortal) return;
  try {
    const resposta = await fetch('/api/config');
    configPortal = await resposta.json();
    document.documentElement.style.setProperty('--nav', configPortal.corPrincipal || '#111418');
    document.documentElement.style.setProperty('--nav-dark', configPortal.corPrincipal || '#000000');
    document.documentElement.style.setProperty('--accent', configPortal.corAcento || '#0f766e');
    const brand = document.getElementById('brand-link');
    if (brand) {
      brand.innerHTML = configPortal.logoUrl
        ? `<img class="brand-logo" src="${configPortal.logoUrl}" alt="${escapeHtml(configPortal.nomePortal)}"><span>${escapeHtml(configPortal.nomePortal)}</span>`
        : escapeHtml(configPortal.nomePortal || 'Portal Noticias');
    }
  } catch {
    configPortal = {};
  }
}

function mediaPadrao(noticia) {
  return configPortal?.imagemPadraoUrl
    ? `<img class="article-image" src="${configPortal.imagemPadraoUrl}" alt="${escapeHtml(noticia.titulo)}">`
    : `<div class="article-fallback">${iniciais(noticia.titulo)}</div>`;
}

function formatarConteudo(texto) {
  return String(texto)
    .split(/\n{2,}/)
    .map((paragrafo) => `<p>${escapeHtml(paragrafo).replaceAll('\n', '<br>')}</p>`)
    .join('');
}

function formatarData(data) {
  if (!data) return '';
  return formatadorData.format(new Date(data));
}

function iniciais(texto = 'PN') {
  return texto.split(/\s+/).filter(Boolean).slice(0, 2).map((palavra) => palavra[0]).join('').toUpperCase();
}

function escapeHtml(valor = '') {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
