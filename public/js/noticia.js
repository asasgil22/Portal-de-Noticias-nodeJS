function obterIdentificadorNoticia() {
  const match = window.location.pathname.match(/^\/noticia\/([^/]+)/);
  if (match) return decodeURIComponent(match[1]);
  const params = new URLSearchParams(window.location.search);
  return params.get('slug') || params.get('id');
}

const identificador = obterIdentificadorNoticia();
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

    const portal = configPortal?.nomePortal || 'Portal Noticias';
    const slug = noticia.slug || noticia.id;
    aplicarMetaSeo({
      title: `${noticia.titulo} | ${portal}`,
      description: noticia.resumo || '',
      canonical: urlAbsoluta(`/noticia/${encodeURIComponent(slug)}`),
      image: imagemAbsoluta(noticia.imagemUrl, configPortal?.imagemPadraoUrl),
      siteName: portal,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: noticia.titulo,
        datePublished: noticia.data,
        author: { '@type': 'Person', name: noticia.autor || 'Redacao' }
      }
    });

    const categoriaHtml = noticia.categoria
      ? `<a href="${urlCategoria(noticia.categoria)}">${escapeHtml(noticia.categoria)}</a>`
      : '<span>Geral</span>';

    container.innerHTML = `
      <div class="news-meta">
        <span>${categoriaHtml}</span>
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
    aplicarTemaPortal(configPortal);
    renderizarMarca(configPortal, document.getElementById('brand-link'));
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
  const valor = String(texto || '').trim();
  if (!valor) return '<p></p>';
  if (/<[a-z][\s\S]*>/i.test(valor)) {
    return sanitizarHtml(valor);
  }
  return valor
    .split(/\n{2,}/)
    .map((paragrafo) => `<p>${escapeHtml(paragrafo).replaceAll('\n', '<br>')}</p>`)
    .join('');
}

function sanitizarHtml(html) {
  const permitidos = new Set([
    'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE',
    'H2', 'H3', 'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE'
  ]);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const limpar = (no) => {
    [...no.childNodes].forEach((filho) => {
      if (filho.nodeType === Node.ELEMENT_NODE) {
        if (!permitidos.has(filho.tagName)) {
          const fragmento = document.createDocumentFragment();
          while (filho.firstChild) fragmento.appendChild(filho.firstChild);
          filho.replaceWith(fragmento);
          limpar(fragmento);
          return;
        }
        if (filho.tagName === 'A') {
          const href = filho.getAttribute('href') || '';
          if (!/^https?:\/\//i.test(href)) {
            filho.removeAttribute('href');
          } else {
            filho.setAttribute('href', href);
            filho.setAttribute('rel', 'noopener noreferrer');
            filho.setAttribute('target', '_blank');
          }
        }
        [...filho.attributes].forEach((attr) => {
          if (!['href', 'target', 'rel'].includes(attr.name)) {
            filho.removeAttribute(attr.name);
          }
        });
        limpar(filho);
      }
    });
  };
  limpar(doc.body);
  return doc.body.innerHTML;
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
