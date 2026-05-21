function aplicarTemaPortal(config = {}) {
  const corPrincipal = config.corPrincipal || '#111418';
  const corAcento = config.corAcento || '#0f766e';
  const fundoHeaderCor = config.fundoHeaderCor || corPrincipal;
  const fundoHeaderTipo = config.fundoHeaderTipo === 'imagem' && config.fundoHeaderImagemUrl
    ? 'imagem'
    : 'cor';
  const fundoSiteTipo = config.fundoSiteTipo === 'imagem' && config.fundoSiteImagemUrl
    ? 'imagem'
    : (config.fundoSiteTipo === 'cor' ? 'cor' : 'padrao');

  document.documentElement.style.setProperty('--nav', fundoHeaderCor);
  document.documentElement.style.setProperty('--nav-dark', fundoHeaderCor);
  document.documentElement.style.setProperty('--accent', corAcento);

  if (fundoHeaderTipo === 'imagem') {
    document.documentElement.style.setProperty('--nav-bg-image', `url("${config.fundoHeaderImagemUrl}")`);
    document.documentElement.style.setProperty('--nav-bg-overlay', String((Number(config.fundoHeaderOverlay) || 35) / 100));
    document.documentElement.dataset.navFundo = 'imagem';
  } else {
    document.documentElement.style.removeProperty('--nav-bg-image');
    document.documentElement.style.removeProperty('--nav-bg-overlay');
    delete document.documentElement.dataset.navFundo;
  }

  if (fundoSiteTipo === 'imagem') {
    document.documentElement.style.setProperty('--site-bg-image', `url("${config.fundoSiteImagemUrl}")`);
    document.documentElement.style.setProperty('--site-bg-color', config.fundoSiteCor || '#f7f8fa');
    document.documentElement.style.setProperty('--site-bg-overlay', String((Number(config.fundoSiteOverlay) || 0) / 100));
    document.documentElement.dataset.siteFundo = 'imagem';
  } else if (fundoSiteTipo === 'cor') {
    document.documentElement.style.removeProperty('--site-bg-image');
    document.documentElement.style.setProperty('--site-bg-color', config.fundoSiteCor || '#f7f8fa');
    document.documentElement.style.removeProperty('--site-bg-overlay');
    document.documentElement.dataset.siteFundo = 'cor';
  } else {
    document.documentElement.style.removeProperty('--site-bg-image');
    document.documentElement.style.removeProperty('--site-bg-color');
    document.documentElement.style.removeProperty('--site-bg-overlay');
    delete document.documentElement.dataset.siteFundo;
  }
}
