const form = document.getElementById('form-noticia');
const lista = document.getElementById('lista-admin-noticias');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSubmit = document.getElementById('btn-submit');
const tituloForm = document.getElementById('titulo-form');
const inputImagem = document.getElementById('imagem');
const inputImagemUrl = document.getElementById('imagemUrl');
const previewImagem = document.getElementById('preview-imagem');
const btnRemoverImagem = document.getElementById('btn-remover-imagem');
const removerImagem = document.getElementById('remover-imagem');
const conteudoCampo = document.getElementById('conteudo');
const conteudoEditor = document.getElementById('conteudo-editor');
const editorToolbar = document.getElementById('editor-toolbar');
let fonteImagemAtual = 'upload';

const formEnquete = document.getElementById('form-enquete');
const formJogo = document.getElementById('form-jogo');
const btnCancelarJogo = document.getElementById('btn-cancelar-jogo');
const formConfig = document.getElementById('form-config');
const formPlantao = document.getElementById('form-plantao');
const btnCancelarPlantao = document.getElementById('btn-cancelar-plantao');

let noticiasCache = [];
let jogosCache = [];
let plantoesCache = [];
let configCache = null;
let carrosselSelecionados = [];
let noticiasCarrosselCache = [];

const HOME_SWITCH_IDS = [
  'mostrarTicker', 'mostrarBusca', 'mostrarCarrossel', 'mostrarUltimas',
  'mostrarMaisLidas', 'mostrarJogos', 'mostrarEnquete'
];

document.addEventListener('DOMContentLoaded', () => {
  inicializarEditorTexto();
  inicializarFonteImagem();
  carregarConfigAdmin();
  carregarListaAdmin();
  carregarPlantoesAdmin();
  carregarEnqueteAdmin();
  carregarJogosAdmin();
  HOME_SWITCH_IDS.forEach((id) => {
    document.getElementById(id)?.addEventListener('change', renderizarPreviewLayout);
  });
  document.getElementById('temaCarrossel')?.addEventListener('change', renderizarPreviewLayout);
  document.getElementById('alturaCarrossel')?.addEventListener('change', renderizarPreviewLayout);
  document.getElementById('autoplayCarrossel')?.addEventListener('change', renderizarPreviewLayout);
  document.getElementById('mostrarResumoCarrossel')?.addEventListener('change', renderizarPreviewLayout);
  document.getElementById('mostrarMiniaturasCarrossel')?.addEventListener('change', renderizarPreviewLayout);
  ['mostrarDotsCarrossel', 'mostrarContadorCarrossel', 'mostrarSetasCarrossel'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', renderizarPreviewLayout);
  });
  montarGradeModelosCarrossel();
  montarFormularioWidgetsAdmin();
  document.getElementById('limiteCarrossel')?.addEventListener('change', () => {
    ajustarLimiteCarrossel();
    renderizarSeletorCarrossel();
    renderizarPreviewLayout();
  });
  document.getElementById('carrossel-busca')?.addEventListener('input', renderizarSeletorCarrossel);
  document.getElementById('carrossel-selecionados')?.addEventListener('click', tratarCliqueCarrossel);
  document.getElementById('carrossel-disponiveis')?.addEventListener('click', tratarCliqueCarrossel);
});

form.addEventListener('submit', salvarNoticia);
btnCancelar.addEventListener('click', limparFormulario);
inputImagem.addEventListener('change', atualizarPreviewArquivo);
inputImagemUrl?.addEventListener('input', atualizarPreviewUrl);
btnRemoverImagem.addEventListener('click', marcarImagemParaRemocao);
formEnquete.addEventListener('submit', salvarEnquete);
formJogo.addEventListener('submit', salvarJogo);
btnCancelarJogo.addEventListener('click', limparFormularioJogo);
formConfig.addEventListener('submit', salvarConfig);
formPlantao.addEventListener('submit', salvarPlantao);
btnCancelarPlantao.addEventListener('click', limparFormularioPlantao);
document.getElementById('logo').addEventListener('change', () => previewArquivo('logo', 'preview-logo', 'btn-remover-logo', 'remover-logo'));
document.getElementById('bannerMarca').addEventListener('change', () => previewArquivo('bannerMarca', 'preview-banner-marca', 'btn-remover-banner-marca', 'remover-banner-marca'));
document.getElementById('bannerMarcaUrl').addEventListener('input', previewBannerUrl);
document.getElementById('imagemPadrao').addEventListener('change', () => previewArquivo('imagemPadrao', 'preview-imagem-padrao', 'btn-remover-imagem-padrao', 'remover-imagem-padrao'));
document.getElementById('btn-remover-logo').addEventListener('click', () => removerPreview('logo', 'preview-logo', 'btn-remover-logo', 'remover-logo'));
document.getElementById('btn-remover-banner-marca').addEventListener('click', () => {
  removerPreview('bannerMarca', 'preview-banner-marca', 'btn-remover-banner-marca', 'remover-banner-marca');
  const urlBanner = document.getElementById('bannerMarcaUrl');
  if (urlBanner) urlBanner.value = '';
});
document.getElementById('btn-remover-imagem-padrao').addEventListener('click', () => removerPreview('imagemPadrao', 'preview-imagem-padrao', 'btn-remover-imagem-padrao', 'remover-imagem-padrao'));
document.getElementById('modoMarca')?.addEventListener('change', atualizarAjudaMarca);
document.getElementById('alturaBannerMarca')?.addEventListener('input', (event) => {
  document.getElementById('altura-banner-valor').textContent = event.target.value;
});
document.querySelectorAll('[data-fundo-header]').forEach((botao) => {
  botao.addEventListener('click', () => alternarFundoHeader(botao.dataset.fundoHeader));
});
document.getElementById('fundoSiteTipo')?.addEventListener('change', alternarFundoSite);
document.getElementById('fundoHeader')?.addEventListener('change', () => {
  previewArquivo('fundoHeader', 'preview-fundo-header', 'btn-remover-fundo-header', 'remover-fundo-header');
  alternarFundoHeader('imagem');
  aplicarTemaPortal(lerTemaPreview());
});
document.getElementById('fundoHeaderUrl')?.addEventListener('input', previewFundoHeaderUrl);
document.getElementById('fundoSite')?.addEventListener('change', () => {
  previewArquivo('fundoSite', 'preview-fundo-site', 'btn-remover-fundo-site', 'remover-fundo-site');
  document.getElementById('fundoSiteTipo').value = 'imagem';
  alternarFundoSite();
  aplicarTemaPortal(lerTemaPreview());
});
document.getElementById('fundoSiteUrl')?.addEventListener('input', previewFundoSiteUrl);
document.getElementById('btn-remover-fundo-header')?.addEventListener('click', () => {
  removerPreview('fundoHeader', 'preview-fundo-header', 'btn-remover-fundo-header', 'remover-fundo-header');
  document.getElementById('fundoHeaderUrl').value = '';
});
document.getElementById('btn-remover-fundo-site')?.addEventListener('click', () => {
  removerPreview('fundoSite', 'preview-fundo-site', 'btn-remover-fundo-site', 'remover-fundo-site');
  document.getElementById('fundoSiteUrl').value = '';
});
document.getElementById('fundoHeaderOverlay')?.addEventListener('input', (event) => {
  document.getElementById('fundo-header-overlay-valor').textContent = event.target.value;
});
document.getElementById('fundoSiteOverlay')?.addEventListener('input', (event) => {
  document.getElementById('fundo-site-overlay-valor').textContent = event.target.value;
});
document.getElementById('fundoHeaderCor')?.addEventListener('input', () => aplicarTemaPortal(lerTemaPreview()));
document.getElementById('corPrincipal')?.addEventListener('input', () => aplicarTemaPortal(lerTemaPreview()));
document.getElementById('corAcento')?.addEventListener('input', () => aplicarTemaPortal(lerTemaPreview()));

async function carregarConfigAdmin() {
  const resposta = await fetch('/api/config');
  configCache = await resposta.json();
  document.getElementById('nomePortal').value = configCache.nomePortal || '';
  document.getElementById('slogan').value = configCache.slogan || '';
  document.getElementById('corPrincipal').value = configCache.corPrincipal || '#2f3a44';
  document.getElementById('corAcento').value = configCache.corAcento || '#0f766e';
  document.getElementById('limiteNoticias').value = configCache.home?.limiteNoticias || 6;
  document.getElementById('limiteJogos').value = configCache.home?.limiteJogos || 3;
  document.getElementById('limiteCarrossel').value = configCache.home?.limiteCarrossel || 5;
  document.getElementById('temaCarrossel').value = configCache.home?.temaCarrossel === 'escuro' ? 'escuro' : 'claro';
  document.getElementById('modeloCarrossel').value = configCache.home?.modeloCarrossel || 'editorial';
  document.getElementById('alturaCarrossel').value = configCache.home?.alturaCarrossel || 'medio';
  document.getElementById('autoplayCarrossel').value = configCache.home?.autoplayCarrossel || 6;
  document.getElementById('mostrarResumoCarrossel').checked = configCache.home?.mostrarResumoCarrossel !== false;
  document.getElementById('mostrarMiniaturasCarrossel').checked = configCache.home?.mostrarMiniaturasCarrossel !== false;
  document.getElementById('mostrarDotsCarrossel').checked = configCache.home?.mostrarDotsCarrossel !== false;
  document.getElementById('mostrarContadorCarrossel').checked = configCache.home?.mostrarContadorCarrossel !== false;
  document.getElementById('mostrarSetasCarrossel').checked = configCache.home?.mostrarSetasCarrossel !== false;
  preencherFormularioWidgetsAdmin(configCache);
  document.getElementById('modoMarca').value = configCache.modoMarca || 'texto';
  document.getElementById('alturaBannerMarca').value = configCache.alturaBannerMarca || 52;
  document.getElementById('altura-banner-valor').textContent = configCache.alturaBannerMarca || 52;
  document.getElementById('mostrarTextoMarca').checked = configCache.mostrarTextoMarca !== false;
  if (configCache.bannerMarcaUrl) {
    document.getElementById('bannerMarcaUrl').value = /^https?:\/\//i.test(configCache.bannerMarcaUrl)
      ? configCache.bannerMarcaUrl
      : '';
    mostrarPreviewGenerico('preview-banner-marca', 'btn-remover-banner-marca', configCache.bannerMarcaUrl, 'Banner da marca');
  }

  alternarFundoHeader(configCache.fundoHeaderTipo || 'cor');
  document.getElementById('fundoHeaderCor').value = configCache.fundoHeaderCor || configCache.corPrincipal || '#121212';
  document.getElementById('fundoHeaderOverlay').value = configCache.fundoHeaderOverlay ?? 35;
  document.getElementById('fundo-header-overlay-valor').textContent = configCache.fundoHeaderOverlay ?? 35;
  if (configCache.fundoHeaderImagemUrl) {
    if (/^https?:\/\//i.test(configCache.fundoHeaderImagemUrl)) {
      document.getElementById('fundoHeaderUrl').value = configCache.fundoHeaderImagemUrl;
    }
    mostrarPreviewGenerico('preview-fundo-header', 'btn-remover-fundo-header', configCache.fundoHeaderImagemUrl, 'Fundo do header');
  }
  document.getElementById('fundoSiteTipo').value = configCache.fundoSiteTipo || 'padrao';
  document.getElementById('fundoSiteCor').value = configCache.fundoSiteCor || '#f7f8fa';
  document.getElementById('fundoSiteOverlay').value = configCache.fundoSiteOverlay ?? 0;
  document.getElementById('fundo-site-overlay-valor').textContent = configCache.fundoSiteOverlay ?? 0;
  if (configCache.fundoSiteImagemUrl) {
    if (/^https?:\/\//i.test(configCache.fundoSiteImagemUrl)) {
      document.getElementById('fundoSiteUrl').value = configCache.fundoSiteImagemUrl;
    }
    mostrarPreviewGenerico('preview-fundo-site', 'btn-remover-fundo-site', configCache.fundoSiteImagemUrl, 'Fundo do site');
  }
  alternarFundoSite();
  aplicarTemaPortal(configCache);

  HOME_SWITCH_IDS.forEach((id) => {
    document.getElementById(id).checked = configCache.home?.[id] !== false;
  });

  if (configCache.logoUrl) mostrarPreviewGenerico('preview-logo', 'btn-remover-logo', configCache.logoUrl, configCache.nomePortal);
  if (configCache.imagemPadraoUrl) mostrarPreviewGenerico('preview-imagem-padrao', 'btn-remover-imagem-padrao', configCache.imagemPadraoUrl, 'Imagem padrao');
  marcarModeloCarrosselAtivo(configCache.home?.modeloCarrossel || 'editorial');
  atualizarAjudaMarca();
  await inicializarSeletorCarrossel();
  renderizarPreviewLayout();
}

function montarGradeModelosCarrossel() {
  const grid = document.getElementById('carousel-model-grid');
  if (!grid || typeof MODELOS_CARROSSEL === 'undefined') return;

  grid.innerHTML = Object.entries(MODELOS_CARROSSEL).map(([id, info]) => `
    <button type="button" class="carousel-model-card" data-modelo="${id}">
      <strong>${escapeHtml(info.label)}</strong>
      <span>${escapeHtml(info.desc)}</span>
    </button>
  `).join('');

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('[data-modelo]');
    if (!card) return;
    document.getElementById('modeloCarrossel').value = card.dataset.modelo;
    marcarModeloCarrosselAtivo(card.dataset.modelo);
    renderizarPreviewLayout();
  });
}

function marcarModeloCarrosselAtivo(modelo) {
  document.querySelectorAll('.carousel-model-card').forEach((card) => {
    card.classList.toggle('is-active', card.dataset.modelo === modelo);
  });
}

function atualizarAjudaMarca() {
  const modo = document.getElementById('modoMarca')?.value || 'texto';
  const grupo = document.getElementById('grupo-banner-marca');
  if (grupo) grupo.classList.toggle('d-none', modo === 'texto' || modo === 'icone');
}

function alternarFundoHeader(tipo = 'cor') {
  document.getElementById('fundoHeaderTipo').value = tipo;
  document.querySelectorAll('[data-fundo-header]').forEach((botao) => {
    botao.classList.toggle('is-active', botao.dataset.fundoHeader === tipo);
  });
  document.getElementById('painel-fundo-header-cor')?.classList.toggle('d-none', tipo !== 'cor');
  document.getElementById('painel-fundo-header-imagem')?.classList.toggle('d-none', tipo !== 'imagem');
  aplicarTemaPortal(lerTemaPreview());
}

function alternarFundoSite() {
  const tipo = document.getElementById('fundoSiteTipo')?.value || 'padrao';
  document.getElementById('painel-fundo-site-cor')?.classList.toggle('d-none', tipo !== 'cor');
  document.getElementById('painel-fundo-site-imagem')?.classList.toggle('d-none', tipo !== 'imagem');
  aplicarTemaPortal(lerTemaPreview());
}

function lerTemaPreview() {
  return {
    corPrincipal: document.getElementById('corPrincipal')?.value,
    corAcento: document.getElementById('corAcento')?.value,
    fundoHeaderTipo: document.getElementById('fundoHeaderTipo')?.value,
    fundoHeaderCor: document.getElementById('fundoHeaderCor')?.value,
    fundoHeaderImagemUrl: document.getElementById('preview-fundo-header')?.querySelector('img')?.src
      || document.getElementById('fundoHeaderUrl')?.value
      || '',
    fundoHeaderOverlay: document.getElementById('fundoHeaderOverlay')?.value,
    fundoSiteTipo: document.getElementById('fundoSiteTipo')?.value,
    fundoSiteCor: document.getElementById('fundoSiteCor')?.value,
    fundoSiteImagemUrl: document.getElementById('preview-fundo-site')?.querySelector('img')?.src
      || document.getElementById('fundoSiteUrl')?.value
      || '',
    fundoSiteOverlay: document.getElementById('fundoSiteOverlay')?.value
  };
}

function previewFundoHeaderUrl() {
  const url = document.getElementById('fundoHeaderUrl')?.value.trim();
  if (!url) return;
  document.getElementById('remover-fundo-header').value = 'false';
  alternarFundoHeader('imagem');
  mostrarPreviewGenerico('preview-fundo-header', 'btn-remover-fundo-header', url, 'Fundo do header');
  aplicarTemaPortal(lerTemaPreview());
}

function previewFundoSiteUrl() {
  const url = document.getElementById('fundoSiteUrl')?.value.trim();
  if (!url) return;
  document.getElementById('remover-fundo-site').value = 'false';
  document.getElementById('fundoSiteTipo').value = 'imagem';
  alternarFundoSite();
  mostrarPreviewGenerico('preview-fundo-site', 'btn-remover-fundo-site', url, 'Fundo do site');
  aplicarTemaPortal(lerTemaPreview());
}

function previewBannerUrl() {
  const url = document.getElementById('bannerMarcaUrl')?.value.trim();
  if (!url) return;
  document.getElementById('remover-banner-marca').value = 'false';
  mostrarPreviewGenerico('preview-banner-marca', 'btn-remover-banner-marca', url, 'Banner da marca');
}

async function salvarCarrosselConfig() {
  const resposta = await fetch('/api/config/carrossel', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      ids: carrosselSelecionados,
      limite: limiteCarrosselAtual()
    })
  });

  if (!resposta.ok) {
    throw new Error('Falha ao salvar o carrossel.');
  }

  return resposta.json();
}

async function salvarConfig(event) {
  event.preventDefault();
  const dados = new FormData(formConfig);
  HOME_SWITCH_IDS.forEach((id) => dados.set(id, document.getElementById(id).checked ? 'true' : 'false'));
  dados.set('limiteNoticias', document.getElementById('limiteNoticias').value);
  dados.set('limiteJogos', document.getElementById('limiteJogos').value);
  dados.set('limiteCarrossel', document.getElementById('limiteCarrossel').value);
  dados.set('temaCarrossel', document.getElementById('temaCarrossel').value);
  dados.set('modeloCarrossel', document.getElementById('modeloCarrossel').value);
  dados.set('alturaCarrossel', document.getElementById('alturaCarrossel').value);
  dados.set('autoplayCarrossel', document.getElementById('autoplayCarrossel').value);
  dados.set('mostrarResumoCarrossel', document.getElementById('mostrarResumoCarrossel').checked ? 'true' : 'false');
  dados.set('mostrarMiniaturasCarrossel', document.getElementById('mostrarMiniaturasCarrossel').checked ? 'true' : 'false');
  dados.set('mostrarDotsCarrossel', document.getElementById('mostrarDotsCarrossel').checked ? 'true' : 'false');
  dados.set('mostrarContadorCarrossel', document.getElementById('mostrarContadorCarrossel').checked ? 'true' : 'false');
  dados.set('mostrarSetasCarrossel', document.getElementById('mostrarSetasCarrossel').checked ? 'true' : 'false');
  dados.set('modoMarca', document.getElementById('modoMarca').value);
  dados.set('alturaBannerMarca', document.getElementById('alturaBannerMarca').value);
  dados.set('mostrarTextoMarca', document.getElementById('mostrarTextoMarca').checked ? 'true' : 'false');
  dados.set('carrosselIds', JSON.stringify(carrosselSelecionados));

  try {
    const resposta = await fetch('/api/config', {
      method: 'PUT',
      credentials: 'same-origin',
      body: dados
    });

    if (!resposta.ok) {
      alert('Nao foi possivel salvar as configuracoes.');
      return;
    }

    await salvarCarrosselConfig();

    const configAtualizada = await fetch('/api/config', { credentials: 'same-origin' });
    configCache = await configAtualizada.json();
  } catch {
    alert('Nao foi possivel salvar a selecao do carrossel.');
    return;
  }
  aplicarTemaPortal(configCache);
  carrosselSelecionados = [...(configCache.home?.carrosselIds || [])];
  renderizarPreviewLayout();
  renderizarSeletorCarrossel();
  alert('Configuracao da pagina inicial salva com sucesso.');
}

function renderizarPreviewLayout() {
  const blocos = [
    { id: 'mostrarTicker', label: 'Plantao' },
    { id: 'mostrarBusca', label: 'Busca' },
    { id: 'mostrarCarrossel', label: 'Carrossel' },
    { id: 'mostrarUltimas', label: 'Ultimas noticias' },
    { id: 'mostrarMaisLidas', label: 'Mais lidas' },
    { id: 'mostrarJogos', label: 'Jogos' },
    { id: 'mostrarEnquete', label: 'Enquete' }
  ];

  document.getElementById('preview-layout-home').innerHTML = blocos.map((bloco) => {
    const ativo = document.getElementById(bloco.id)?.checked;
    return `<span class="layout-chip ${ativo ? 'is-on' : ''}">${escapeHtml(bloco.label)}</span>`;
  }).join('');

  const tema = document.getElementById('temaCarrossel')?.value === 'escuro' ? 'Escuro' : 'Claro';
  const modelo = document.getElementById('modeloCarrossel')?.value || 'editorial';
  const modeloLabel = MODELOS_CARROSSEL?.[modelo]?.label || modelo;
  const altura = document.getElementById('alturaCarrossel')?.value || 'medio';
  const carrossel = document.getElementById('mostrarCarrossel')?.checked;
  const qtdCarrossel = carrosselSelecionados.length;
  const controles = [
    document.getElementById('mostrarDotsCarrossel')?.checked ? 'barras' : null,
    document.getElementById('mostrarContadorCarrossel')?.checked ? 'numeros' : null,
    document.getElementById('mostrarSetasCarrossel')?.checked ? 'setas' : null
  ].filter(Boolean).join(', ') || 'nenhum';
  document.getElementById('preview-layout-home').innerHTML += `
    <div class="layout-meta">
      <span>Carrossel: ${carrossel ? `ativo · ${modeloLabel} · ${tema} · altura ${altura} · ${qtdCarrossel} slide(s) · controles: ${controles}` : 'oculto'}</span>
      <span>Marca: ${document.getElementById('modoMarca')?.value || 'texto'}</span>
      <span>Lista: ${document.getElementById('limiteNoticias')?.value || 6} por pagina</span>
    </div>
  `;
}

const WIDGETS_ADMIN_MAP = {
  maisLidas: { prefix: 'widgetMaisLidas', label: 'Mais lidas' },
  jogos: { prefix: 'widgetJogos', label: 'Agenda de jogos' },
  enquete: { prefix: 'widgetEnquete', label: 'Enquete' }
};

function montarFormularioWidgetsAdmin() {
  const grid = document.getElementById('widgets-admin-grid');
  if (!grid || typeof LAYOUTS_WIDGET === 'undefined') return;

  grid.innerHTML = Object.entries(WIDGETS_ADMIN_MAP).map(([chave, meta]) => {
    const layouts = LAYOUTS_WIDGET[chave] || {};
    const icones = Object.entries(ICONES_WIDGET).map(([id, info]) => (
      `<option value="${id}">${escapeHtml(info.label)}</option>`
    )).join('');
    const layoutOptions = Object.entries(layouts).map(([id, info]) => (
      `<option value="${id}">${escapeHtml(info.label)}</option>`
    )).join('');

    return `
      <article class="widget-admin-card" data-widget-key="${chave}">
        <h4>${escapeHtml(meta.label)}</h4>
        <div class="mb-2">
          <label class="form-label">Titulo</label>
          <input type="text" class="form-control" id="${meta.prefix}Titulo" name="${meta.prefix}Titulo">
        </div>
        <div class="mb-2">
          <label class="form-label">Subtitulo</label>
          <input type="text" class="form-control" id="${meta.prefix}Subtitulo" name="${meta.prefix}Subtitulo">
        </div>
        <div class="row g-2">
          <div class="col-6">
            <label class="form-label">Icone</label>
            <select class="form-select" id="${meta.prefix}Icone" name="${meta.prefix}Icone">${icones}</select>
          </div>
          <div class="col-6">
            <label class="form-label">Layout</label>
            <select class="form-select" id="${meta.prefix}Layout" name="${meta.prefix}Layout">${layoutOptions}</select>
          </div>
        </div>
        <div class="widget-admin-preview" id="${meta.prefix}Preview"></div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('select, input').forEach((campo) => {
    campo.addEventListener('change', atualizarPreviewWidgetAdmin);
    campo.addEventListener('input', atualizarPreviewWidgetAdmin);
  });
}

function preencherFormularioWidgetsAdmin(config) {
  const widgets = normalizarWidgetsConfig(config.home || {});
  Object.entries(WIDGETS_ADMIN_MAP).forEach(([chave, meta]) => {
    const cfg = widgets[chave];
    document.getElementById(`${meta.prefix}Titulo`).value = cfg.titulo;
    document.getElementById(`${meta.prefix}Subtitulo`).value = cfg.subtitulo;
    document.getElementById(`${meta.prefix}Icone`).value = cfg.icone;
    document.getElementById(`${meta.prefix}Layout`).value = cfg.layout;
    atualizarPreviewWidgetAdmin({ target: document.getElementById(`${meta.prefix}Icone`) });
  });
}

function atualizarPreviewWidgetAdmin(event) {
  const card = event.target.closest('[data-widget-key]');
  if (!card) return;
  const chave = card.dataset.widgetKey;
  const meta = WIDGETS_ADMIN_MAP[chave];
  const preview = document.getElementById(`${meta.prefix}Preview`);
  const icone = document.getElementById(`${meta.prefix}Icone`).value;
  const layout = document.getElementById(`${meta.prefix}Layout`).value;
  const titulo = document.getElementById(`${meta.prefix}Titulo`).value;
  preview.innerHTML = `
    <div class="widget-card widget-card--layout-${layout}">
      <header class="widget-card__head">
        ${htmlIconeWidget(icone)}
        <div><h2>${escapeHtml(titulo)}</h2></div>
      </header>
    </div>
  `;
}

function limiteCarrosselAtual() {
  return Math.min(Math.max(Number(document.getElementById('limiteCarrossel')?.value) || 5, 1), 5);
}

function ajustarLimiteCarrossel() {
  const limite = limiteCarrosselAtual();
  if (carrosselSelecionados.length > limite) {
    carrosselSelecionados = carrosselSelecionados.slice(0, limite);
  }
  serializarCarrosselIds();
}

function serializarCarrosselIds() {
  const campo = document.getElementById('carrosselIds');
  if (campo) campo.value = JSON.stringify(carrosselSelecionados);
}

async function inicializarSeletorCarrossel() {
  const selecionados = document.getElementById('carrossel-selecionados');
  const disponiveis = document.getElementById('carrossel-disponiveis');
  if (!selecionados || !disponiveis) return;

  selecionados.innerHTML = '<div class="loading-box">Carregando noticias...</div>';
  disponiveis.innerHTML = '';

  try {
    const resposta = await fetch('/api/noticias?admin=true');
    noticiasCarrosselCache = await resposta.json();

    const idsSalvos = configCache?.home?.carrosselIds || [];
    if (idsSalvos.length) {
      carrosselSelecionados = idsSalvos.filter((id) => (
        noticiasCarrosselCache.some((noticia) => String(noticia.id) === String(id))
      ));
    } else {
      carrosselSelecionados = noticiasCarrosselCache
        .filter((noticia) => noticia.destaqueCarousel && noticia.status !== 'rascunho')
        .map((noticia) => String(noticia.id));
    }

    ajustarLimiteCarrossel();
    renderizarSeletorCarrossel();
  } catch {
    selecionados.innerHTML = '<div class="empty-box">Erro ao carregar noticias.</div>';
  }
}

function renderizarSeletorCarrossel() {
  const selecionadosEl = document.getElementById('carrossel-selecionados');
  const disponiveisEl = document.getElementById('carrossel-disponiveis');
  const contadorEl = document.getElementById('carrossel-contador');
  if (!selecionadosEl || !disponiveisEl) return;

  const limite = limiteCarrosselAtual();
  const busca = (document.getElementById('carrossel-busca')?.value || '').trim().toLowerCase();
  const publicadas = noticiasCarrosselCache.filter((noticia) => noticia.status !== 'rascunho');

  if (contadorEl) contadorEl.textContent = `${carrosselSelecionados.length} / ${limite}`;

  if (!carrosselSelecionados.length) {
    selecionadosEl.innerHTML = '<div class="empty-box">Nenhuma noticia selecionada. Adicione itens ao lado.</div>';
  } else {
    selecionadosEl.innerHTML = carrosselSelecionados.map((id, index) => {
      const noticia = noticiasCarrosselCache.find((item) => String(item.id) === String(id));
      if (!noticia) return '';
      return `
        <div class="carousel-picker-item is-selected">
          <span class="carousel-picker-pos">${index + 1}</span>
          <div class="carousel-picker-copy">
            <strong>${escapeHtml(noticia.titulo)}</strong>
            <span>${escapeHtml(noticia.categoria || 'Geral')}</span>
          </div>
          <div class="carousel-picker-actions">
            <button type="button" class="btn btn-outline-secondary btn-sm" data-carousel-action="up" data-id="${noticia.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="btn btn-outline-secondary btn-sm" data-carousel-action="down" data-id="${noticia.id}" ${index === carrosselSelecionados.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="btn btn-outline-danger btn-sm" data-carousel-action="remove" data-id="${noticia.id}">×</button>
          </div>
        </div>
      `;
    }).join('');
  }

  const disponiveis = publicadas
    .filter((noticia) => !carrosselSelecionados.includes(String(noticia.id)))
    .filter((noticia) => {
      if (!busca) return true;
      const texto = `${noticia.titulo} ${noticia.categoria} ${noticia.resumo}`.toLowerCase();
      return texto.includes(busca);
    });

  if (!disponiveis.length) {
    disponiveisEl.innerHTML = '<div class="empty-box">Nenhuma noticia disponivel para adicionar.</div>';
    return;
  }

  const lotado = carrosselSelecionados.length >= limite;
  disponiveisEl.innerHTML = disponiveis.map((noticia) => `
    <div class="carousel-picker-item">
      <div class="carousel-picker-copy">
        <strong>${escapeHtml(noticia.titulo)}</strong>
        <span>${escapeHtml(noticia.categoria || 'Geral')}</span>
      </div>
      <button type="button" class="btn btn-outline-dark btn-sm" data-carousel-action="add" data-id="${noticia.id}" ${lotado ? 'disabled' : ''}>Adicionar</button>
    </div>
  `).join('');

  if (lotado) {
    disponiveisEl.insertAdjacentHTML('afterbegin', `<div class="carousel-picker-alert">Limite de ${limite} slide(s) atingido. Remova um item ou aumente o limite acima.</div>`);
  }

  serializarCarrosselIds();
}

function tratarCliqueCarrossel(event) {
  const botao = event.target.closest('[data-carousel-action]');
  if (!botao) return;

  const acao = botao.dataset.carouselAction;
  const id = String(botao.dataset.id);
  const limite = limiteCarrosselAtual();

  if (acao === 'add') {
    if (carrosselSelecionados.length >= limite) return;
    if (!carrosselSelecionados.includes(id)) carrosselSelecionados.push(id);
  }

  if (acao === 'remove') {
    carrosselSelecionados = carrosselSelecionados.filter((item) => item !== id);
  }

  if (acao === 'up') {
    const index = carrosselSelecionados.indexOf(id);
    if (index > 0) {
      [carrosselSelecionados[index - 1], carrosselSelecionados[index]] = [
        carrosselSelecionados[index],
        carrosselSelecionados[index - 1]
      ];
    }
  }

  if (acao === 'down') {
    const index = carrosselSelecionados.indexOf(id);
    if (index !== -1 && index < carrosselSelecionados.length - 1) {
      [carrosselSelecionados[index + 1], carrosselSelecionados[index]] = [
        carrosselSelecionados[index],
        carrosselSelecionados[index + 1]
      ];
    }
  }

  renderizarSeletorCarrossel();
  renderizarPreviewLayout();
}

function previewArquivo(inputId, previewId, buttonId, removerId) {
  const input = document.getElementById(inputId);
  const arquivo = input.files && input.files[0];
  if (!arquivo) return;
  document.getElementById(removerId).value = 'false';
  mostrarPreviewGenerico(previewId, buttonId, URL.createObjectURL(arquivo), arquivo.name);
}

function mostrarPreviewGenerico(previewId, buttonId, src, alt) {
  const preview = document.getElementById(previewId);
  preview.classList.remove('d-none');
  document.getElementById(buttonId).classList.remove('d-none');
  preview.innerHTML = `<img src="${src}" alt="${escapeHtml(alt)}">`;
}

function removerPreview(inputId, previewId, buttonId, removerId) {
  document.getElementById(inputId).value = '';
  document.getElementById(removerId).value = 'true';
  document.getElementById(previewId).classList.add('d-none');
  document.getElementById(buttonId).classList.add('d-none');
  document.getElementById(previewId).innerHTML = '';
}

async function carregarListaAdmin() {
  lista.innerHTML = '<tr><td colspan="4" class="text-secondary">Carregando...</td></tr>';

  try {
    const resposta = await fetch('/api/noticias?admin=true');
    if (resposta.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    noticiasCache = await resposta.json();
    document.getElementById('admin-count').textContent = `${noticiasCache.length} item(ns)`;

    if (!noticiasCache.length) {
      lista.innerHTML = '<tr><td colspan="4" class="text-secondary">Nenhuma noticia cadastrada.</td></tr>';
      return;
    }

    lista.innerHTML = noticiasCache.map((noticia) => `
      <tr>
        <td>
          <strong>${escapeHtml(noticia.titulo)}</strong>
          <div class="admin-row-meta">
            <span>${escapeHtml(noticia.slug || noticia.id)}</span>
            <span>${noticia.status === 'rascunho' ? 'Rascunho' : 'Publicado'}</span>
          </div>
          ${noticia.destaqueCarousel ? '<span class="badge text-bg-dark mt-1">Destaque</span>' : ''}
        </td>
        <td>${escapeHtml(noticia.categoria || 'Geral')}</td>
        <td>${noticia.visualizacoes || 0}</td>
        <td class="text-end">
          <a class="btn btn-outline-dark btn-sm" href="/noticia/${encodeURIComponent(noticia.slug || noticia.id)}" target="_blank">Abrir</a>
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarNoticia('${noticia.id}')">Editar</button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirNoticia('${noticia.id}')">Excluir</button>
        </td>
      </tr>
    `).join('');
  } catch {
    lista.innerHTML = '<tr><td colspan="4" class="text-danger">Erro ao carregar noticias.</td></tr>';
  }
}

function inicializarEditorTexto() {
  if (!conteudoEditor || !editorToolbar) return;

  editorToolbar.addEventListener('click', (event) => {
    const botao = event.target.closest('[data-cmd]');
    if (!botao) return;
    event.preventDefault();

    conteudoEditor.focus();
    const cmd = botao.dataset.cmd;
    const valor = botao.dataset.value || null;

    if (cmd === 'createLink') {
      const url = prompt('Informe a URL do link:');
      if (url) document.execCommand('createLink', false, url);
      return;
    }

    if (cmd === 'formatBlock' && valor) {
      document.execCommand(cmd, false, valor);
      return;
    }

    document.execCommand(cmd, false, valor);
  });

  conteudoEditor.addEventListener('input', sincronizarConteudoEditor);
}

function sincronizarConteudoEditor() {
  if (!conteudoCampo || !conteudoEditor) return;
  const texto = conteudoEditor.innerText.replace(/\u00a0/g, ' ').trim();
  conteudoCampo.value = texto ? conteudoEditor.innerHTML.trim() : '';
}

function definirConteudoEditor(html = '') {
  if (!conteudoEditor) return;
  conteudoEditor.innerHTML = html || '';
  sincronizarConteudoEditor();
}

function inicializarFonteImagem() {
  document.querySelectorAll('[data-image-source]').forEach((botao) => {
    botao.addEventListener('click', () => alternarFonteImagem(botao.dataset.imageSource));
  });
}

function alternarFonteImagem(fonte = 'upload') {
  fonteImagemAtual = fonte;
  document.querySelectorAll('[data-image-source]').forEach((botao) => {
    botao.classList.toggle('is-active', botao.dataset.imageSource === fonte);
  });
  document.getElementById('painel-imagem-upload')?.classList.toggle('d-none', fonte !== 'upload');
  document.getElementById('painel-imagem-url')?.classList.toggle('d-none', fonte !== 'url');
  if (fonte === 'upload' && inputImagemUrl) inputImagemUrl.value = '';
  if (fonte === 'url' && inputImagem) inputImagem.value = '';
}

function atualizarPreviewUrl() {
  const url = inputImagemUrl?.value.trim();
  if (!url) {
    if (removerImagem.value !== 'true') esconderPreviewImagem();
    return;
  }
  removerImagem.value = 'false';
  mostrarPreviewImagem(url, 'Imagem externa');
}

async function salvarNoticia(event) {
  event.preventDefault();
  sincronizarConteudoEditor();

  if (!conteudoCampo.value.trim()) {
    alert('Preencha o texto da materia.');
    conteudoEditor?.focus();
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Salvando...';

  const id = document.getElementById('noticia-id').value;
  const dados = new FormData(form);
  dados.set('destaque', document.getElementById('destaque').checked ? 'true' : 'false');
  dados.set('removerImagem', removerImagem.value);

  if (fonteImagemAtual === 'url') {
    dados.delete('imagem');
    dados.set('imagemUrl', inputImagemUrl?.value.trim() || '');
  } else {
    dados.delete('imagemUrl');
  }

  try {
    const resposta = await fetch(id ? `/api/noticias/${id}` : '/api/noticias', {
      method: id ? 'PUT' : 'POST',
      body: dados
    });

    if (!resposta.ok) throw new Error('Falha ao salvar');

    limparFormulario();
    await carregarListaAdmin();
    await inicializarSeletorCarrossel();
  } catch {
    alert('Nao foi possivel salvar a noticia.');
  } finally {
    const editando = Boolean(document.getElementById('noticia-id').value);
    btnSubmit.disabled = false;
    btnSubmit.textContent = editando ? 'Atualizar noticia' : 'Publicar noticia';
  }
}

function editarNoticia(id) {
  const noticia = noticiasCache.find((item) => String(item.id) === String(id));
  if (!noticia) return;

  document.getElementById('noticia-id').value = noticia.id;
  document.getElementById('titulo').value = noticia.titulo || '';
  document.getElementById('resumo').value = noticia.resumo || '';
  definirConteudoEditor(noticia.conteudo || noticia.resumo || '');
  document.getElementById('categoria').value = noticia.categoria || 'Geral';
  document.getElementById('autor').value = noticia.autor || 'Redacao';
  document.getElementById('tags').value = Array.isArray(noticia.tags) ? noticia.tags.join(', ') : '';
  document.getElementById('status').value = noticia.status === 'rascunho' ? 'rascunho' : 'publicado';
  document.getElementById('destaque').checked = Boolean(noticia.destaqueCarousel);
  removerImagem.value = 'false';

  if (noticia.imagemUrl) {
    if (/^https?:\/\//i.test(noticia.imagemUrl)) {
      alternarFonteImagem('url');
      if (inputImagemUrl) inputImagemUrl.value = noticia.imagemUrl;
    } else {
      alternarFonteImagem('upload');
    }
    mostrarPreviewImagem(noticia.imagemUrl, noticia.titulo);
  } else {
    alternarFonteImagem('upload');
    esconderPreviewImagem();
  }

  tituloForm.textContent = 'Editar noticia';
  btnSubmit.textContent = 'Atualizar noticia';
  btnCancelar.classList.remove('d-none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirNoticia(id) {
  if (!confirm('Deseja excluir esta noticia?')) return;

  try {
    const resposta = await fetch(`/api/noticias/${id}`, { method: 'DELETE' });
    if (!resposta.ok) throw new Error('Falha ao excluir');
    await carregarListaAdmin();
  } catch {
    alert('Nao foi possivel excluir a noticia.');
  }
}

function atualizarPreviewArquivo() {
  const arquivo = inputImagem.files && inputImagem.files[0];
  if (!arquivo) return;
  alternarFonteImagem('upload');
  removerImagem.value = 'false';
  if (inputImagemUrl) inputImagemUrl.value = '';
  mostrarPreviewImagem(URL.createObjectURL(arquivo), arquivo.name);
}

function mostrarPreviewImagem(src, alt) {
  previewImagem.classList.remove('d-none');
  btnRemoverImagem.classList.remove('d-none');
  previewImagem.innerHTML = `<img src="${src}" alt="${escapeHtml(alt)}">`;
}

function esconderPreviewImagem() {
  previewImagem.classList.add('d-none');
  btnRemoverImagem.classList.add('d-none');
  previewImagem.innerHTML = '';
}

function marcarImagemParaRemocao() {
  inputImagem.value = '';
  if (inputImagemUrl) inputImagemUrl.value = '';
  removerImagem.value = 'true';
  esconderPreviewImagem();
}

function limparFormulario() {
  form.reset();
  document.getElementById('noticia-id').value = '';
  document.getElementById('categoria').value = 'Geral';
  document.getElementById('autor').value = 'Redacao';
  document.getElementById('status').value = 'publicado';
  removerImagem.value = 'false';
  alternarFonteImagem('upload');
  definirConteudoEditor('');
  esconderPreviewImagem();
  tituloForm.textContent = 'Nova noticia';
  btnSubmit.textContent = 'Publicar noticia';
  btnCancelar.classList.add('d-none');
}

async function carregarPlantoesAdmin() {
  const listaPlantoes = document.getElementById('lista-plantoes-admin');
  listaPlantoes.innerHTML = '<div class="loading-box">Carregando plantoes...</div>';

  try {
    const resposta = await fetch('/api/plantoes?admin=true');
    plantoesCache = await resposta.json();
    document.getElementById('plantoes-count').textContent = `${plantoesCache.length} item(ns)`;

    if (!plantoesCache.length) {
      listaPlantoes.innerHTML = '<div class="empty-box">Nenhum plantao cadastrado.</div>';
      return;
    }

    listaPlantoes.innerHTML = plantoesCache.map((plantao) => `
      <div class="admin-game-row">
        <div>
          <strong>${escapeHtml(plantao.texto)}</strong>
          <span>${plantao.ativo === false ? 'Inativo' : 'Ativo'}${plantao.link ? ` - ${escapeHtml(plantao.link)}` : ''}</span>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarPlantao('${plantao.id}')">Editar</button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirPlantao('${plantao.id}')">Excluir</button>
        </div>
      </div>
    `).join('');
  } catch {
    listaPlantoes.innerHTML = '<div class="empty-box">Erro ao carregar plantoes.</div>';
  }
}

async function salvarPlantao(event) {
  event.preventDefault();
  const id = document.getElementById('plantao-id').value;
  const payload = {
    texto: document.getElementById('plantao-texto').value.trim(),
    link: document.getElementById('plantao-link').value.trim(),
    ativo: document.getElementById('plantao-ativo').checked
  };

  const resposta = await fetch(id ? `/api/plantoes/${id}` : '/api/plantoes', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resposta.ok) {
    alert('Nao foi possivel salvar o plantao.');
    return;
  }

  limparFormularioPlantao();
  carregarPlantoesAdmin();
}

function editarPlantao(id) {
  const plantao = plantoesCache.find((item) => String(item.id) === String(id));
  if (!plantao) return;
  document.getElementById('plantao-id').value = plantao.id;
  document.getElementById('plantao-texto').value = plantao.texto || '';
  document.getElementById('plantao-link').value = plantao.link || '';
  document.getElementById('plantao-ativo').checked = plantao.ativo !== false;
  document.getElementById('titulo-form-plantao').textContent = 'Editar plantao';
  document.getElementById('btn-submit-plantao').textContent = 'Atualizar plantao';
  btnCancelarPlantao.classList.remove('d-none');
}

async function excluirPlantao(id) {
  if (!confirm('Deseja excluir este plantao?')) return;
  const resposta = await fetch(`/api/plantoes/${id}`, { method: 'DELETE' });
  if (!resposta.ok) {
    alert('Nao foi possivel excluir o plantao.');
    return;
  }
  carregarPlantoesAdmin();
}

function limparFormularioPlantao() {
  formPlantao.reset();
  document.getElementById('plantao-id').value = '';
  document.getElementById('plantao-ativo').checked = true;
  document.getElementById('titulo-form-plantao').textContent = 'Novo plantao';
  document.getElementById('btn-submit-plantao').textContent = 'Salvar plantao';
  btnCancelarPlantao.classList.add('d-none');
}

async function carregarEnqueteAdmin() {
  try {
    const resposta = await fetch('/api/enquete');
    const enquete = await resposta.json();
    document.getElementById('pergunta-enquete').value = enquete.pergunta || '';
    document.getElementById('opcoes-enquete').value = Object.keys(enquete.opcoes || {}).join(', ');
    renderizarPreviewEnquete(enquete);
  } catch {
    document.getElementById('preview-enquete').innerHTML = '<div class="empty-box">Erro ao carregar enquete.</div>';
  }
}

async function salvarEnquete(event) {
  event.preventDefault();
  const pergunta = document.getElementById('pergunta-enquete').value.trim();
  const opcoes = document.getElementById('opcoes-enquete').value.split(',').map((opcao) => opcao.trim()).filter(Boolean);

  if (opcoes.length < 2) {
    alert('Informe pelo menos duas opcoes.');
    return;
  }

  const resposta = await fetch('/api/enquete/configurar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pergunta, opcoes })
  });

  if (!resposta.ok) {
    alert('Nao foi possivel salvar a enquete.');
    return;
  }

  renderizarPreviewEnquete(await resposta.json());
}

function renderizarPreviewEnquete(enquete) {
  const total = Object.values(enquete.opcoes || {}).reduce((soma, votos) => soma + votos, 0);
  document.getElementById('preview-enquete').innerHTML = `
    <div class="game-box">
      <strong>${escapeHtml(enquete.pergunta || '')}</strong>
      <div class="mt-3">
        ${Object.entries(enquete.opcoes || {}).map(([opcao, votos]) => {
          const pct = total ? Math.round((votos / total) * 100) : 0;
          return `<div class="poll-result"><span>${escapeHtml(opcao)}</span><strong>${pct}%</strong></div>`;
        }).join('')}
      </div>
    </div>
  `;
}

async function carregarJogosAdmin() {
  const listaJogos = document.getElementById('lista-jogos-admin');
  listaJogos.innerHTML = '<div class="loading-box">Carregando jogos...</div>';

  try {
    const resposta = await fetch('/api/jogos');
    jogosCache = await resposta.json();
    document.getElementById('jogos-count').textContent = `${jogosCache.length} item(ns)`;

    if (!jogosCache.length) {
      listaJogos.innerHTML = '<div class="empty-box">Nenhum jogo cadastrado.</div>';
      return;
    }

    listaJogos.innerHTML = jogosCache.map((jogo) => `
      <div class="admin-game-row">
        <div>
          <strong>${escapeHtml(jogo.mandante)} x ${escapeHtml(jogo.visitante)}</strong>
          <span>${escapeHtml(jogo.campeonato)} - ${escapeHtml(formatarDataHoraInput(jogo.dataHora).replace('T', ' '))}</span>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarJogo('${jogo.id}')">Editar</button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirJogo('${jogo.id}')">Excluir</button>
        </div>
      </div>
    `).join('');
  } catch {
    listaJogos.innerHTML = '<div class="empty-box">Erro ao carregar jogos.</div>';
  }
}

async function salvarJogo(event) {
  event.preventDefault();
  const id = document.getElementById('jogo-id').value;
  const payload = {
    campeonato: document.getElementById('campeonato').value.trim(),
    dataHora: document.getElementById('dataHora').value,
    mandante: document.getElementById('mandante').value.trim(),
    visitante: document.getElementById('visitante').value.trim(),
    placarMandante: document.getElementById('placarMandante').value,
    placarVisitante: document.getElementById('placarVisitante').value
  };

  const resposta = await fetch(id ? `/api/jogos/${id}` : '/api/jogos', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resposta.ok) {
    alert('Nao foi possivel salvar o jogo.');
    return;
  }

  limparFormularioJogo();
  carregarJogosAdmin();
}

function editarJogo(id) {
  const jogo = jogosCache.find((item) => String(item.id) === String(id));
  if (!jogo) return;

  document.getElementById('jogo-id').value = jogo.id;
  document.getElementById('campeonato').value = jogo.campeonato || '';
  document.getElementById('dataHora').value = formatarDataHoraInput(jogo.dataHora);
  document.getElementById('mandante').value = jogo.mandante || '';
  document.getElementById('visitante').value = jogo.visitante || '';
  document.getElementById('placarMandante').value = jogo.placarMandante ?? '';
  document.getElementById('placarVisitante').value = jogo.placarVisitante ?? '';
  document.getElementById('titulo-form-jogo').textContent = 'Editar jogo';
  document.getElementById('btn-submit-jogo').textContent = 'Atualizar jogo';
  btnCancelarJogo.classList.remove('d-none');
}

async function excluirJogo(id) {
  if (!confirm('Deseja excluir este jogo?')) return;
  const resposta = await fetch(`/api/jogos/${id}`, { method: 'DELETE' });
  if (!resposta.ok) {
    alert('Nao foi possivel excluir o jogo.');
    return;
  }
  carregarJogosAdmin();
}

function limparFormularioJogo() {
  formJogo.reset();
  document.getElementById('jogo-id').value = '';
  document.getElementById('titulo-form-jogo').textContent = 'Novo jogo';
  document.getElementById('btn-submit-jogo').textContent = 'Salvar jogo';
  btnCancelarJogo.classList.add('d-none');
}

function formatarDataHoraInput(valor) {
  if (!valor) return '';
  return String(valor).slice(0, 16);
}

function escapeHtml(valor = '') {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
