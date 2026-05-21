const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

let estadoHome = {
  pagina: 1,
  busca: '',
  categoria: '',
  config: null
};

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('form-filtros').addEventListener('submit', aplicarFiltros);
  await carregarConfig();
  carregarCategorias();
  carregarNoticias(1);
  carregarTickerETrending();
  carregarWidgetJogos();
  carregarWidgetEnquete();
});

async function carregarConfig() {
  try {
    const resposta = await fetch('/api/config');
    estadoHome.config = await resposta.json();
  } catch {
    estadoHome.config = {
      nomePortal: 'Portal Noticias',
      slogan: '',
      corPrincipal: '#2f3a44',
      corAcento: '#0f766e',
      logoUrl: '',
      imagemPadraoUrl: '',
      home: {}
    };
  }

  const config = estadoHome.config;
  document.title = config.nomePortal || 'Portal Noticias';
  aplicarMetaSeo({
    title: config.nomePortal || 'Portal Noticias',
    description: config.slogan || config.seoDescricao || `Noticias em tempo real no ${config.nomePortal || 'portal'}.`,
    canonical: urlAbsoluta('/'),
    image: imagemAbsoluta(config.logoUrl, config.imagemPadraoUrl),
    siteName: config.nomePortal || 'Portal Noticias',
    type: 'website'
  });
  aplicarTemaPortal(config);
  renderizarMarca(config, document.getElementById('brand-link'));
  aplicarConfigWidgets(config);
  aplicarLayoutHome(config);
}

function layoutWidget(chave) {
  return normalizarWidgetsConfig(estadoHome.config?.home || {})[chave]?.layout
    || WIDGET_PADROES[chave]?.layout;
}

function aplicarLayoutHome(config = estadoHome.config) {
  const home = config?.home || {};

  alternarBloco('.ticker-wrap', home.mostrarTicker !== false);
  alternarBloco('.home-toolbar', home.mostrarBusca !== false);
  alternarBloco('#carousel-section', home.mostrarCarrossel !== false);
  alternarBloco('#grid-noticias', home.mostrarUltimas !== false);
  alternarBloco('#paginacao', home.mostrarUltimas !== false);
  alternarBloco('.section-heading', home.mostrarUltimas !== false);
  alternarBloco('#mais-lidas', home.mostrarMaisLidas !== false, true);
  alternarBloco('#widget-jogos', home.mostrarJogos !== false, true);
  alternarBloco('#widget-enquete', home.mostrarEnquete !== false, true);

  const sidebar = document.getElementById('sidebar-home');
  const colNoticias = document.getElementById('col-noticias');
  const mostrarSidebar = home.mostrarMaisLidas !== false
    || home.mostrarJogos !== false
    || home.mostrarEnquete !== false;

  if (sidebar) sidebar.classList.toggle('d-none', !mostrarSidebar);
  if (colNoticias) {
    colNoticias.classList.remove('col-lg-8', 'col-12');
    colNoticias.classList.add(mostrarSidebar ? 'col-lg-8' : 'col-12');
  }
}

function alternarBloco(selector, mostrar, painelInteiro = false) {
  const el = document.querySelector(selector);
  if (!el) return;
  const alvo = painelInteiro
    ? (el.closest('.widget-card') || el.closest('.side-panel'))
    : el;
  if (alvo) alvo.classList.toggle('d-none', !mostrar);
}

async function carregarCategorias() {
  try {
    const resposta = await fetch('/api/categorias');
    const categorias = await resposta.json();
    const select = document.getElementById('filtro-categoria');
    select.innerHTML = '<option value="">Todas as categorias</option>' + categorias.map((categoria) => (
      `<option value="${escapeAttr(categoria)}">${escapeHtml(categoria)}</option>`
    )).join('');
  } catch {
    document.getElementById('filtro-categoria').innerHTML = '<option value="">Todas as categorias</option>';
  }
}

function aplicarFiltros(event) {
  event.preventDefault();
  estadoHome.busca = document.getElementById('busca').value.trim();
  estadoHome.categoria = document.getElementById('filtro-categoria').value;
  carregarNoticias(1);
}

async function carregarNoticias(pagina = 1) {
  estadoHome.pagina = pagina;
  const grid = document.getElementById('grid-noticias');
  const limite = estadoHome.config?.home?.limiteNoticias || 6;

  if (estadoHome.config?.home?.mostrarUltimas === false) {
    document.querySelector('.section-heading').classList.add('d-none');
    grid.innerHTML = '';
    return;
  }

  document.querySelector('.section-heading').classList.remove('d-none');
  grid.innerHTML = '<div class="loading-box">Carregando noticias...</div>';

  const params = new URLSearchParams({
    pagina: String(pagina),
    limite: String(limite)
  });
  if (estadoHome.busca) params.set('q', estadoHome.busca);
  if (estadoHome.categoria) params.set('categoria', estadoHome.categoria);

  try {
    const resposta = await fetch(`/api/noticias?${params.toString()}`);
    const dados = await resposta.json();

    if (estadoHome.config?.home?.mostrarCarrossel !== false) {
      renderizarCarousel(dados.destaques || []);
    } else {
      document.getElementById('carousel-section').innerHTML = '';
    }
    renderizarLista(dados.grid || []);
    renderizarPaginacao(dados.paginaAtual, dados.totalPaginas);

    const total = dados.totalItens ?? (dados.grid || []).length;
    document.getElementById('contador-noticias').textContent = `${total} noticia(s) encontrada(s)`;
  } catch {
    grid.innerHTML = '<div class="empty-box">Nao foi possivel carregar as noticias.</div>';
  }
}

function urlNoticia(noticia) {
  return `/noticia/${encodeURIComponent(noticia.slug || noticia.id)}`;
}

function mediaNoticia(noticia, classe, fallbackClasse) {
  const imagem = noticia.imagemUrl || estadoHome.config?.imagemPadraoUrl;
  return imagem
    ? `<img class="${classe || 'hero-media'}" src="${imagem}" alt="${escapeHtml(noticia.titulo)}">`
    : `<div class="${fallbackClasse}">${iniciais(noticia.titulo)}</div>`;
}

function renderizarCarousel(destaques) {
  renderizarCarrosselPortal(
    document.getElementById('carousel-section'),
    destaques,
    estadoHome.config,
    { escapeHtml, urlNoticia, mediaNoticia }
  );
}

function renderizarLista(noticias) {
  const grid = document.getElementById('grid-noticias');
  if (!noticias.length) {
    grid.innerHTML = '<div class="empty-box">Nenhuma noticia encontrada para este filtro.</div>';
    return;
  }

  grid.innerHTML = noticias.map((noticia) => `
    <a class="news-item" href="${urlNoticia(noticia)}">
      ${mediaNoticia(noticia, 'thumb', 'thumb-fallback')}
      <div>
        <div class="news-meta">
          <span>${escapeHtml(noticia.categoria || 'Geral')}</span>
          <span>${formatarData(noticia.data)}</span>
        </div>
        <h2>${escapeHtml(noticia.titulo)}</h2>
        <p>${escapeHtml(noticia.resumo || '')}</p>
        ${Array.isArray(noticia.tags) && noticia.tags.length
          ? `<div class="tag-row">${noticia.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>`
          : ''}
      </div>
    </a>
  `).join('');
}

function renderizarPaginacao(paginaAtual = 1, totalPaginas = 1) {
  const paginacao = document.getElementById('paginacao');
  if (totalPaginas <= 1) {
    paginacao.innerHTML = '';
    return;
  }

  paginacao.innerHTML = Array.from({ length: totalPaginas }, (_, index) => {
    const pagina = index + 1;
    return `
      <li class="page-item ${pagina === paginaAtual ? 'active' : ''}">
        <button class="page-link" type="button" onclick="carregarNoticias(${pagina})">${pagina}</button>
      </li>
    `;
  }).join('');
}

async function carregarTickerETrending() {
  try {
    const [resPlantoes, resLidas] = await Promise.all([
      fetch('/api/plantoes'),
      fetch('/api/noticias?maisLidas=true')
    ]);
    const plantoes = await resPlantoes.json();
    const maisLidas = await resLidas.json();

    document.getElementById('ticker-noticias').innerHTML = plantoes.length
      ? plantoes.slice(0, 10).map((plantao) => {
        const texto = escapeHtml(plantao.texto);
        return plantao.link ? `<a href="${escapeAttr(plantao.link)}">${texto}</a>` : `<span>${texto}</span>`;
      }).join('')
      : '<span>Nenhum plantao ativo no momento.</span>';

    const layout = layoutWidget('maisLidas');
    document.getElementById('mais-lidas').innerHTML = maisLidas.length
      ? renderizarMaisLidas(maisLidas, layout)
      : '<div class="empty-box">Sem leituras ainda.</div>';
  } catch {
    document.getElementById('mais-lidas').innerHTML = '<div class="empty-box">Erro ao carregar.</div>';
  }
}

async function carregarWidgetJogos() {
  const alvo = document.getElementById('widget-jogos');
  try {
    const resposta = await fetch('/api/jogos');
    const jogos = await resposta.json();
    const limite = estadoHome.config?.home?.limiteJogos || 3;
    const agenda = [...jogos]
      .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
      .slice(0, limite);

    if (!agenda.length) {
      alvo.innerHTML = '<div class="empty-box">Nenhum jogo cadastrado.</div>';
      return;
    }

    alvo.innerHTML = renderizarJogos(agenda, layoutWidget('jogos'));
  } catch {
    alvo.innerHTML = '<div class="empty-box">Erro ao carregar jogos.</div>';
  }
}

async function carregarWidgetEnquete() {
  const alvo = document.getElementById('widget-enquete');
  try {
    const resposta = await fetch('/api/enquete');
    const enquete = await resposta.json();
    const total = Object.values(enquete.opcoes || {}).reduce((soma, votos) => soma + votos, 0);
    alvo.innerHTML = renderizarEnquete(enquete, total, layoutWidget('enquete'));
  } catch {
    alvo.innerHTML = '<div class="empty-box">Erro ao carregar enquete.</div>';
  }
}

async function votar(opcao) {
  await fetch('/api/enquete/votar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ opcao })
  });
  carregarWidgetEnquete();
}

function renderizarMaisLidas(noticias, layout = 'lista') {
  if (layout === 'compacto') {
    return noticias.map((noticia) => (
      `<a class="trending-item trending-item--compact" href="${urlNoticia(noticia)}">
        <strong>${escapeHtml(noticia.titulo)}</strong>
        <small>${noticia.visualizacoes || 0} views</small>
      </a>`
    )).join('');
  }

  if (layout === 'cards') {
    return noticias.map((noticia, index) => (
      `<a class="trending-card" href="${urlNoticia(noticia)}">
        <span class="trending-card__rank">${index + 1}</span>
        <span class="trending-card__title">${escapeHtml(noticia.titulo)}</span>
        <span class="trending-card__meta">${escapeHtml(noticia.categoria || 'Geral')}</span>
      </a>`
    )).join('');
  }

  return noticias.map((noticia, index) => (
    `<a class="trending-item" href="${urlNoticia(noticia)}">
      <span class="trending-rank">${index + 1}</span>
      <span class="trending-copy">
        <strong>${escapeHtml(noticia.titulo)}</strong>
        <small>${escapeHtml(noticia.categoria || 'Geral')} · ${noticia.visualizacoes || 0} views</small>
      </span>
    </a>`
  )).join('');
}

function renderizarJogos(jogos, layout = 'cards') {
  if (layout === 'linha') {
    return jogos.map((jogo) => `
      <article class="game-line">
        <span class="game-line__league">${escapeHtml(jogo.campeonato)}</span>
        <span class="game-line__team">${escapeHtml(jogo.mandante)}</span>
        <span class="game-line__score">${jogo.placarMandante ?? '-'} x ${jogo.placarVisitante ?? '-'}</span>
        <span class="game-line__team">${escapeHtml(jogo.visitante)}</span>
        <time>${formatarData(jogo.dataHora)}</time>
      </article>
    `).join('');
  }

  if (layout === 'tabela') {
    return `
      <table class="game-table">
        <thead><tr><th>Jogo</th><th>Placar</th><th>Data</th></tr></thead>
        <tbody>
          ${jogos.map((jogo) => `
            <tr>
              <td><strong>${escapeHtml(jogo.mandante)} x ${escapeHtml(jogo.visitante)}</strong><br><small>${escapeHtml(jogo.campeonato)}</small></td>
              <td>${jogo.placarMandante ?? '-'} x ${jogo.placarVisitante ?? '-'}</td>
              <td>${formatarData(jogo.dataHora)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  return jogos.map((jogo) => `
    <article class="game-card">
      <div class="game-card__league">${escapeHtml(jogo.campeonato)}</div>
      <div class="game-card__match">
        <span class="game-card__team">${escapeHtml(jogo.mandante)}</span>
        <span class="game-card__score">${jogo.placarMandante ?? '-'}<small>x</small>${jogo.placarVisitante ?? '-'}</span>
        <span class="game-card__team">${escapeHtml(jogo.visitante)}</span>
      </div>
      <time class="game-card__date">${formatarData(jogo.dataHora)}</time>
    </article>
  `).join('');
}

function renderizarEnquete(enquete, total, layout = 'barras') {
  const opcoes = Object.entries(enquete.opcoes || {});
  const botoes = opcoes.map(([opcao, votos]) => {
    const pct = total ? Math.round((votos / total) * 100) : 0;
    if (layout === 'classic') {
      return `<button class="poll-option poll-option--classic" type="button" onclick="votar('${escapeAttr(opcao)}')">${escapeHtml(opcao)}</button>`;
    }
    if (layout === 'minimal') {
      return `
        <button class="poll-option poll-option--minimal" type="button" onclick="votar('${escapeAttr(opcao)}')">
          <span>${escapeHtml(opcao)}</span>
          <strong>${pct}%</strong>
        </button>
      `;
    }
    return `
      <button class="poll-option" type="button" onclick="votar('${escapeAttr(opcao)}')">
        <span class="poll-option__label">${escapeHtml(opcao)}</span>
        <span class="poll-option__bar"><span style="width:${pct}%"></span></span>
        <span class="poll-option__pct">${pct}%</span>
      </button>
    `;
  }).join('');

  return `
    <p class="poll-question">${escapeHtml(enquete.pergunta)}</p>
    <div class="poll-options poll-options--${layout}">${botoes}</div>
    <p class="poll-total">${total} voto(s)</p>
  `;
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

function escapeAttr(valor = '') {
  return escapeHtml(valor).replaceAll('`', '&#096;');
}
