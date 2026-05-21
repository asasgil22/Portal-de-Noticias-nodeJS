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
  document.documentElement.style.setProperty('--nav', config.corPrincipal || '#111418');
  document.documentElement.style.setProperty('--nav-dark', config.corPrincipal || '#000000');
  document.documentElement.style.setProperty('--accent', config.corAcento || '#0f766e');
  document.getElementById('brand-link').innerHTML = config.logoUrl
    ? `<img class="brand-logo" src="${config.logoUrl}" alt="${escapeHtml(config.nomePortal)}"><span>${escapeHtml(config.nomePortal)}</span>`
    : escapeHtml(config.nomePortal || 'Portal Noticias');

  aplicarLayoutHome(config);
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
  const alvo = painelInteiro ? el.closest('.side-panel') : el;
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
  return `noticia.html?slug=${encodeURIComponent(noticia.slug || noticia.id)}`;
}

function mediaNoticia(noticia, classe, fallbackClasse) {
  const imagem = noticia.imagemUrl || estadoHome.config?.imagemPadraoUrl;
  return imagem
    ? `<img class="${classe || 'hero-media'}" src="${imagem}" alt="${escapeHtml(noticia.titulo)}">`
    : `<div class="${fallbackClasse}">${iniciais(noticia.titulo)}</div>`;
}

function renderizarCarousel(destaques) {
  const section = document.getElementById('carousel-section');
  if (!destaques.length) {
    section.innerHTML = '';
    return;
  }

  const total = destaques.length;
  const temaClaro = estadoHome.config?.home?.temaCarrossel !== 'escuro';
  const classeTema = temaClaro ? 'hero-carousel--light' : 'hero-carousel--dark';

  section.innerHTML = `
    <section class="hero-carousel ${classeTema}" aria-label="Destaques do portal" data-autoplay="6000">
      <div class="hero-carousel__stage">
        ${destaques.map((noticia, index) => `
          <article class="hero-carousel__slide ${index === 0 ? 'is-active' : ''}" data-index="${index}">
            <a class="hero-carousel__link" href="${urlNoticia(noticia)}">
              <div class="hero-carousel__media">
                ${mediaNoticia(noticia, 'hero-carousel__img', 'hero-carousel__fallback')}
              </div>
              <div class="hero-carousel__overlay">
                <span class="hero-carousel__kicker">${escapeHtml(noticia.categoria || 'Geral')}</span>
                <h2 class="hero-carousel__title">${escapeHtml(noticia.titulo)}</h2>
                <p class="hero-carousel__excerpt">${escapeHtml(noticia.resumo || '')}</p>
                <span class="hero-carousel__cta">Ler materia</span>
              </div>
            </a>
          </article>
        `).join('')}
      </div>

      <div class="hero-carousel__chrome">
        <div class="hero-carousel__toolbar">
          <div class="hero-carousel__progress" aria-hidden="true">
            ${destaques.map((_, index) => `
              <button type="button" class="hero-carousel__dot ${index === 0 ? 'is-active' : ''}" data-go="${index}" aria-label="Ir para destaque ${index + 1}"></button>
            `).join('')}
          </div>
          <div class="hero-carousel__controls">
            <span class="hero-carousel__counter"><strong>01</strong> / ${String(total).padStart(2, '0')}</span>
            <button type="button" class="hero-carousel__btn" data-dir="prev" aria-label="Destaque anterior">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button type="button" class="hero-carousel__btn" data-dir="next" aria-label="Proximo destaque">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div class="hero-carousel__thumbs">
          ${destaques.map((noticia, index) => `
            <button type="button" class="hero-carousel__thumb ${index === 0 ? 'is-active' : ''}" data-go="${index}">
              <span class="hero-carousel__thumb-media">
                ${mediaNoticia(noticia, 'hero-carousel__thumb-img', 'hero-carousel__thumb-fallback')}
              </span>
              <span class="hero-carousel__thumb-copy">
                <span class="hero-carousel__thumb-kicker">${escapeHtml(noticia.categoria || 'Geral')}</span>
                <strong>${escapeHtml(noticia.titulo)}</strong>
              </span>
            </button>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  inicializarCarouselHero(section.querySelector('.hero-carousel'));
}

function inicializarCarouselHero(carousel) {
  if (!carousel || carousel.dataset.ready === 'true') return;

  const slides = [...carousel.querySelectorAll('.hero-carousel__slide')];
  const dots = [...carousel.querySelectorAll('.hero-carousel__dot')];
  const thumbs = [...carousel.querySelectorAll('.hero-carousel__thumb')];
  const counter = carousel.querySelector('.hero-carousel__counter strong');
  const intervalo = Number(carousel.dataset.autoplay) || 6000;
  let indice = 0;
  let timer = null;

  carousel.style.setProperty('--hero-autoplay', `${intervalo}ms`);

  function irPara(novoIndice) {
    indice = (novoIndice + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === indice));
    dots.forEach((dot, i) => {
      const ativo = i === indice;
      dot.classList.toggle('is-active', ativo);
      if (ativo) {
        dot.classList.remove('is-animating');
        void dot.offsetWidth;
        dot.classList.add('is-animating');
      } else {
        dot.classList.remove('is-animating');
      }
    });
    thumbs.forEach((thumb, i) => thumb.classList.toggle('is-active', i === indice));
    if (counter) counter.textContent = String(indice + 1).padStart(2, '0');
    reiniciarTimer();
  }

  function reiniciarTimer() {
    if (timer) clearTimeout(timer);
    carousel.classList.remove('is-paused');
    timer = setTimeout(() => irPara(indice + 1), intervalo);
  }

  carousel.addEventListener('click', (event) => {
    const alvo = event.target.closest('[data-dir], [data-go]');
    if (!alvo || alvo.tagName === 'A') return;

    if (alvo.dataset.dir === 'prev') irPara(indice - 1);
    if (alvo.dataset.dir === 'next') irPara(indice + 1);
    if (alvo.dataset.go !== undefined) irPara(Number(alvo.dataset.go));
  });

  carousel.addEventListener('mouseenter', () => {
    carousel.classList.add('is-paused');
    if (timer) clearTimeout(timer);
  });

  carousel.addEventListener('mouseleave', reiniciarTimer);

  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') irPara(indice - 1);
    if (event.key === 'ArrowRight') irPara(indice + 1);
  });

  carousel.setAttribute('tabindex', '0');
  carousel.dataset.ready = 'true';
  dots[indice]?.classList.add('is-animating');
  reiniciarTimer();
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

    document.getElementById('mais-lidas').innerHTML = maisLidas.length
      ? maisLidas.map((noticia) => (
        `<a class="side-link" href="${urlNoticia(noticia)}">${escapeHtml(noticia.titulo)}</a>`
      )).join('')
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

    alvo.innerHTML = agenda.map((jogo, index) => `
      <div class="game-box ${index > 0 ? 'mt-2' : ''}">
        <div class="small text-secondary text-uppercase fw-bold">${escapeHtml(jogo.campeonato)}</div>
        <div class="teams my-2">
          <span>${escapeHtml(jogo.mandante)}</span>
          <span>${jogo.placarMandante ?? '-'} x ${jogo.placarVisitante ?? '-'}</span>
          <span>${escapeHtml(jogo.visitante)}</span>
        </div>
        <div class="small text-secondary">${formatarData(jogo.dataHora)}</div>
      </div>
    `).join('');
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
    alvo.innerHTML = `
      <p class="fw-bold">${escapeHtml(enquete.pergunta)}</p>
      ${Object.entries(enquete.opcoes || {}).map(([opcao, votos]) => {
        const pct = total ? Math.round((votos / total) * 100) : 0;
        return `
          <button class="poll-option" type="button" onclick="votar('${escapeAttr(opcao)}')">
            ${escapeHtml(opcao)}
            <span class="float-end">${pct}%</span>
          </button>
        `;
      }).join('')}
    `;
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
