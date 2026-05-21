const slugCategoria = obterSlugCategoria();
const container = document.getElementById('lista-categoria');
const tituloEl = document.getElementById('categoria-titulo');
const contadorEl = document.getElementById('categoria-contador');

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

let configPortal = null;

document.addEventListener('DOMContentLoaded', carregarPaginaCategoria);

function obterSlugCategoria() {
  const match = window.location.pathname.match(/^\/categoria\/([^/]+)/);
  if (match) return decodeURIComponent(match[1]);
  const params = new URLSearchParams(window.location.search);
  return params.get('categoria') || '';
}

async function carregarPaginaCategoria() {
  if (!slugCategoria) {
    container.innerHTML = '<div class="empty-box">Categoria nao informada.</div>';
    return;
  }

  try {
    await carregarConfig();
    const resposta = await fetch(`/api/noticias?categoria=${encodeURIComponent(slugCategoria)}&limite=50`);
    if (!resposta.ok) throw new Error('Erro ao carregar');
    const dados = await resposta.json();
    const noticias = dados.grid || dados;
    const lista = Array.isArray(noticias) ? noticias : [];

    const nomeExibicao = lista[0]?.categoria || formatarSlug(slugCategoria);
    tituloEl.textContent = nomeExibicao;
    contadorEl.textContent = `${lista.length} noticia(s)`;

    const portal = configPortal?.nomePortal || 'Portal Noticias';
    aplicarMetaSeo({
      title: `${nomeExibicao} | ${portal}`,
      description: `Noticias sobre ${nomeExibicao} no ${portal}.`,
      canonical: urlAbsoluta(`/categoria/${encodeURIComponent(slugCategoria)}`),
      image: imagemAbsoluta(configPortal?.logoUrl, configPortal?.imagemPadraoUrl),
      siteName: portal,
      type: 'website'
    });

    if (!lista.length) {
      container.innerHTML = '<div class="empty-box">Nenhuma noticia publicada nesta categoria.</div>';
      return;
    }

    container.innerHTML = lista.map((noticia) => `
      <a class="news-item" href="${urlNoticia(noticia)}">
        ${mediaNoticia(noticia)}
        <div>
          <div class="news-meta">
            <span>${escapeHtml(noticia.categoria || 'Geral')}</span>
            <span>${formatarData(noticia.data)}</span>
          </div>
          <h2>${escapeHtml(noticia.titulo)}</h2>
          <p>${escapeHtml(noticia.resumo || '')}</p>
        </div>
      </a>
    `).join('');
  } catch {
    container.innerHTML = '<div class="empty-box">Nao foi possivel carregar esta categoria.</div>';
  }
}

async function carregarConfig() {
  if (configPortal) return;
  try {
    const resposta = await fetch('/api/config');
    configPortal = await resposta.json();
    aplicarTemaPortal(configPortal);
    renderizarMarca(configPortal, document.getElementById('brand-link'));
  } catch {
    configPortal = {};
  }
}

function urlNoticia(noticia) {
  return `/noticia/${encodeURIComponent(noticia.slug || noticia.id)}`;
}

function mediaNoticia(noticia) {
  const imagem = noticia.imagemUrl || configPortal?.imagemPadraoUrl;
  return imagem
    ? `<img class="thumb" src="${imagem}" alt="${escapeHtml(noticia.titulo)}">`
    : `<div class="thumb-fallback">${iniciais(noticia.titulo)}</div>`;
}

function formatarSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ');
}

function formatarData(data) {
  if (!data) return '';
  return formatadorData.format(new Date(data));
}

function iniciais(texto = 'PN') {
  return texto.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function escapeHtml(valor = '') {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
