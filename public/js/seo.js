function aplicarMetaSeo({
  title,
  description,
  canonical,
  image,
  type = 'website',
  siteName,
  jsonLd = null
}) {
  document.title = title || document.title;

  definirMeta('name', 'description', description);
  definirLink('canonical', canonical);

  definirMeta('property', 'og:title', title);
  definirMeta('property', 'og:description', description);
  definirMeta('property', 'og:url', canonical);
  definirMeta('property', 'og:type', type);
  definirMeta('property', 'og:site_name', siteName);
  definirMeta('property', 'og:locale', 'pt_BR');

  definirMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  definirMeta('name', 'twitter:title', title);
  definirMeta('name', 'twitter:description', description);

  if (image) {
    definirMeta('property', 'og:image', image);
    definirMeta('name', 'twitter:image', image);
  } else {
    removerMeta('property', 'og:image');
    removerMeta('name', 'twitter:image');
  }

  if (jsonLd) {
    let script = document.getElementById('seo-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
  }
}

function definirMeta(attr, chave, valor) {
  if (!valor) return;
  let el = document.querySelector(`meta[${attr}="${chave}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, chave);
    document.head.appendChild(el);
  }
  el.setAttribute('content', valor);
}

function removerMeta(attr, chave) {
  document.querySelector(`meta[${attr}="${chave}"]`)?.remove();
}

function definirLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function urlAbsoluta(caminho = '/') {
  const base = window.location.origin;
  return `${base}${caminho.startsWith('/') ? caminho : `/${caminho}`}`;
}

function imagemAbsoluta(url, imagemPadrao = '') {
  const src = url || imagemPadrao || '';
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  return urlAbsoluta(src);
}

function slugifyCategoria(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'geral';
}

function urlCategoria(nome) {
  return `/categoria/${encodeURIComponent(slugifyCategoria(nome))}`;
}
