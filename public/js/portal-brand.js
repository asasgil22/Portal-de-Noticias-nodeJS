function escapeHtmlMarca(valor = '') {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderizarMarca(config = {}, elemento) {
  if (!elemento) return;

  const nome = config.nomePortal || 'Portal Noticias';
  const modo = config.modoMarca || 'texto';
  const logo = config.logoUrl || '';
  const banner = config.bannerMarcaUrl || '';
  const altura = Math.min(Math.max(Number(config.alturaBannerMarca) || 52, 28), 120);
  const mostrarTexto = config.mostrarTextoMarca !== false;

  document.documentElement.style.setProperty('--brand-banner-height', `${altura}px`);

  const partes = [];
  elemento.classList.remove('brand-lockup--banner', 'brand-lockup--icone');

  if ((modo === 'icone' || modo === 'icone_banner') && logo) {
    partes.push(`<img class="brand-logo" src="${logo}" alt="">`);
    elemento.classList.add('brand-lockup--icone');
  }

  if ((modo === 'banner' || modo === 'icone_banner') && banner) {
    partes.push(`<img class="brand-banner" src="${banner}" alt="${escapeHtmlMarca(nome)}">`);
    elemento.classList.add('brand-lockup--banner');
  }

  if (modo === 'texto' || (mostrarTexto && (!banner || modo === 'icone' || modo === 'icone_banner'))) {
    if (!banner || modo !== 'banner') {
      partes.push(`<span class="brand-text">${escapeHtmlMarca(nome)}</span>`);
    }
  }

  if (!partes.length) {
    elemento.innerHTML = `<span class="brand-text">${escapeHtmlMarca(nome)}</span>`;
    return;
  }

  elemento.innerHTML = partes.join('');
  elemento.setAttribute('aria-label', nome);
}
