function escapeHtml(valor = '') {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml(texto = '') {
  return String(texto)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncar(texto = '', limite = 160) {
  const limpo = stripHtml(texto);
  if (limpo.length <= limite) return limpo;
  return `${limpo.slice(0, limite - 1).trim()}…`;
}

function slugifyCategoria(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'geral';
}

function getBaseUrl(req, config = {}) {
  const cfg = String(config.siteUrl || '').trim().replace(/\/$/, '');
  if (cfg) return cfg;
  const env = String(process.env.SITE_URL || '').trim().replace(/\/$/, '');
  if (env) return env;
  const host = req.get('host');
  const protocol = req.protocol || 'http';
  return `${protocol}://${host}`;
}

function urlAbsoluta(base, caminho = '/') {
  const path = caminho.startsWith('/') ? caminho : `/${caminho}`;
  return `${base.replace(/\/$/, '')}${path}`;
}

function resolverImagemOg(imagem, config, base) {
  const candidata = imagem || config.imagemPadraoUrl || config.logoUrl || '';
  if (!candidata) return '';
  if (/^https?:\/\//i.test(candidata)) return candidata;
  return urlAbsoluta(base, candidata);
}

function buildMetaTags({
  title,
  description,
  canonical,
  image,
  type = 'website',
  siteName,
  locale = 'pt_BR',
  jsonLd = null,
  noindex = false
}) {
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    noindex
      ? '<meta name="robots" content="noindex, nofollow">'
      : '<meta name="robots" content="index, follow, max-image-preview:large">',
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta property="og:locale" content="${locale}">`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}">`,
    `<meta property="og:type" content="${escapeHtml(type)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`
  ];

  if (image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(image)}">`);
    tags.push(`<meta property="og:image:alt" content="${escapeHtml(title)}">`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(image)}">`);
  }

  if (jsonLd) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
  }

  return tags.join('\n  ');
}

function metaHome(config, base) {
  const nome = config.nomePortal || 'Portal Noticias';
  const desc = truncar(config.slogan || config.seoDescricao || `Noticias e informacoes em tempo real no ${nome}.`, 160);
  const canonical = urlAbsoluta(base, '/');
  const image = resolverImagemOg(config.logoUrl, config, base);

  return buildMetaTags({
    title: nome,
    description: desc,
    canonical,
    image,
    siteName: nome,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: nome,
      description: desc,
      url: canonical,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${canonical}?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    }
  });
}

function metaNoticia(noticia, config, base) {
  const nome = config.nomePortal || 'Portal Noticias';
  const titulo = noticia.titulo || 'Noticia';
  const desc = truncar(noticia.resumo || noticia.conteudo || '', 160);
  const slug = noticia.slug || noticia.id;
  const canonical = urlAbsoluta(base, `/noticia/${encodeURIComponent(slug)}`);
  const image = resolverImagemOg(noticia.imagemUrl, config, base);

  return buildMetaTags({
    title: `${titulo} | ${nome}`,
    description: desc,
    canonical,
    image,
    type: 'article',
    siteName: nome,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: titulo,
      description: desc,
      image: image ? [image] : undefined,
      datePublished: noticia.data,
      dateModified: noticia.data,
      author: {
        '@type': 'Person',
        name: noticia.autor || 'Redacao'
      },
      publisher: {
        '@type': 'Organization',
        name: nome,
        logo: config.logoUrl ? {
          '@type': 'ImageObject',
          url: resolverImagemOg(config.logoUrl, config, base)
        } : undefined
      },
      mainEntityOfPage: canonical
    }
  });
}

function metaCategoria(nomeCategoria, config, base, total = 0) {
  const portal = config.nomePortal || 'Portal Noticias';
  const titulo = `${nomeCategoria} | ${portal}`;
  const desc = truncar(`Noticias sobre ${nomeCategoria} no ${portal}. ${total} materia(s) publicada(s).`, 160);
  const slug = slugifyCategoria(nomeCategoria);
  const canonical = urlAbsoluta(base, `/categoria/${encodeURIComponent(slug)}`);

  return buildMetaTags({
    title: titulo,
    description: desc,
    canonical,
    image: resolverImagemOg('', config, base),
    siteName: portal,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: titulo,
      description: desc,
      url: canonical
    }
  });
}

function categoriaCombina(noticia, filtro) {
  if (!filtro) return true;
  const cat = String(noticia.categoria || 'Geral');
  const f = String(filtro).trim().toLowerCase();
  return cat.toLowerCase() === f || slugifyCategoria(cat) === f;
}

function encontrarNomeCategoria(noticias, slugOuNome) {
  const alvo = String(slugOuNome || '').trim().toLowerCase();
  const match = noticias.find((n) => slugifyCategoria(n.categoria) === alvo || String(n.categoria || '').toLowerCase() === alvo);
  return match?.categoria || null;
}

module.exports = {
  escapeHtml,
  stripHtml,
  truncar,
  slugifyCategoria,
  getBaseUrl,
  urlAbsoluta,
  buildMetaTags,
  metaHome,
  metaNoticia,
  metaCategoria,
  categoriaCombina,
  encontrarNomeCategoria,
  resolverImagemOg
};
