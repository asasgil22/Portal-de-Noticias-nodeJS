const MODELOS_CARROSSEL = {
  editorial: {
    label: 'Editorial',
    desc: 'Destaque grande com miniaturas na lateral (padrao).'
  },
  fullscreen: {
    label: 'Tela cheia',
    desc: 'Imagem ampla com controles sobrepostos.'
  },
  compacto: {
    label: 'Compacto',
    desc: 'Altura reduzida, ideal para cabecalhos menores.'
  },
  split: {
    label: 'Dividido',
    desc: 'Imagem e texto lado a lado em cada slide.'
  },
  filmstrip: {
    label: 'Filmstrip',
    desc: 'Slide principal com faixa de miniaturas abaixo.'
  },
  magazine: {
    label: 'Magazine',
    desc: 'Titulo centralizado com navegacao discreta.'
  }
};

const ALTURAS_CARROSSEL = {
  baixo: 280,
  medio: 380,
  alto: 480,
  extra: 580
};

function obterOpcoesCarrossel(home = {}) {
  const modelo = MODELOS_CARROSSEL[home.modeloCarrossel] ? home.modeloCarrossel : 'editorial';
  const alturaChave = ALTURAS_CARROSSEL[home.alturaCarrossel] ? home.alturaCarrossel : 'medio';
  const temaClaro = home.temaCarrossel !== 'escuro';
  const autoplay = Math.min(Math.max(Number(home.autoplayCarrossel) || 6, 3), 20) * 1000;

  return {
    modelo,
    temaClaro,
    classeTema: temaClaro ? 'hero-carousel--light' : 'hero-carousel--dark',
    classeAltura: `hero-carousel--h-${alturaChave}`,
    alturaPx: ALTURAS_CARROSSEL[alturaChave],
    autoplay,
    mostrarResumo: home.mostrarResumoCarrossel !== false,
    mostrarMiniaturas: home.mostrarMiniaturasCarrossel !== false,
    mostrarContador: home.mostrarContadorCarrossel !== false,
    mostrarSetas: home.mostrarSetasCarrossel !== false,
    mostrarDots: home.mostrarDotsCarrossel !== false
  };
}

function slideBase(noticia, index, opcoes, helpers) {
  const { escapeHtml, urlNoticia, mediaNoticia } = helpers;
  const resumo = opcoes.mostrarResumo
    ? `<p class="hero-carousel__excerpt">${escapeHtml(noticia.resumo || '')}</p>`
    : '';

  return `
    <article class="hero-carousel__slide ${index === 0 ? 'is-active' : ''}" data-index="${index}">
      <a class="hero-carousel__link" href="${urlNoticia(noticia)}">
        <div class="hero-carousel__media">
          ${mediaNoticia(noticia, 'hero-carousel__img', 'hero-carousel__fallback')}
        </div>
        <div class="hero-carousel__overlay">
          <span class="hero-carousel__kicker">${escapeHtml(noticia.categoria || 'Geral')}</span>
          <h2 class="hero-carousel__title">${escapeHtml(noticia.titulo)}</h2>
          ${resumo}
          <span class="hero-carousel__cta">Ler materia</span>
        </div>
      </a>
    </article>
  `;
}

function slideSplit(noticia, index, opcoes, helpers) {
  const { escapeHtml, urlNoticia, mediaNoticia } = helpers;
  const resumo = opcoes.mostrarResumo
    ? `<p class="hero-carousel__excerpt">${escapeHtml(noticia.resumo || '')}</p>`
    : '';

  return `
    <article class="hero-carousel__slide hero-carousel__slide--split ${index === 0 ? 'is-active' : ''}" data-index="${index}">
      <a class="hero-carousel__split-link" href="${urlNoticia(noticia)}">
        <div class="hero-carousel__split-media">
          ${mediaNoticia(noticia, 'hero-carousel__img', 'hero-carousel__fallback')}
        </div>
        <div class="hero-carousel__split-copy">
          <span class="hero-carousel__kicker">${escapeHtml(noticia.categoria || 'Geral')}</span>
          <h2 class="hero-carousel__title">${escapeHtml(noticia.titulo)}</h2>
          ${resumo}
          <span class="hero-carousel__cta">Ler materia</span>
        </div>
      </a>
    </article>
  `;
}

function toolbarDots(destaques, total, opcoes = {}) {
  const progresso = opcoes.mostrarDots
    ? `<div class="hero-carousel__progress" aria-hidden="true">
        ${destaques.map((_, index) => `
          <button type="button" class="hero-carousel__dot ${index === 0 ? 'is-active' : ''}" data-go="${index}" aria-label="Ir para destaque ${index + 1}"></button>
        `).join('')}
      </div>`
    : '';

  const contador = opcoes.mostrarContador
    ? `<span class="hero-carousel__counter"><strong>01</strong> / ${String(total).padStart(2, '0')}</span>`
    : '';

  const setas = opcoes.mostrarSetas
    ? `<button type="button" class="hero-carousel__btn" data-dir="prev" aria-label="Destaque anterior">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button type="button" class="hero-carousel__btn" data-dir="next" aria-label="Proximo destaque">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`
    : '';

  if (!progresso && !contador && !setas) return '';

  const classesToolbar = [
    'hero-carousel__toolbar',
    !opcoes.mostrarSetas ? 'hero-carousel__toolbar--no-arrows' : '',
    !opcoes.mostrarContador ? 'hero-carousel__toolbar--no-counter' : '',
    !opcoes.mostrarDots ? 'hero-carousel__toolbar--no-dots' : ''
  ].filter(Boolean).join(' ');

  const classesControls = [
    'hero-carousel__controls',
    !contador ? 'hero-carousel__controls--no-counter' : '',
    !setas ? 'hero-carousel__controls--no-arrows' : ''
  ].filter(Boolean).join(' ');

  return `
    <div class="${classesToolbar}">
      ${progresso}
      <div class="${classesControls}">
        ${contador}
        ${setas ? `<span class="hero-carousel__nav">${setas}</span>` : ''}
      </div>
    </div>
  `;
}

function thumbsHtml(destaques, helpers, classeExtra = '') {
  const { escapeHtml, mediaNoticia } = helpers;
  return `
    <div class="hero-carousel__thumbs ${classeExtra}">
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
  `;
}

function montarCarrossel(modelo, destaques, opcoes, helpers) {
  const total = destaques.length;
  const slides = destaques.map((noticia, index) => {
    if (modelo === 'split') return slideSplit(noticia, index, opcoes, helpers);
    return slideBase(noticia, index, opcoes, helpers);
  }).join('');

  const stage = `<div class="hero-carousel__stage">${slides}</div>`;

  if (modelo === 'editorial') {
    const chrome = opcoes.mostrarMiniaturas
      ? `<div class="hero-carousel__chrome">${toolbarDots(destaques, total, opcoes)}${thumbsHtml(destaques, helpers)}</div>`
      : `<div class="hero-carousel__chrome hero-carousel__chrome--toolbar-only">${toolbarDots(destaques, total, opcoes)}</div>`;
    return `${stage}${chrome}`;
  }

  if (modelo === 'fullscreen') {
    return `${stage}<div class="hero-carousel__overlay-ui">${toolbarDots(destaques, total, opcoes)}</div>`;
  }

  if (modelo === 'compacto') {
    return `${stage}<div class="hero-carousel__footer-compact">${toolbarDots(destaques, total, opcoes)}</div>`;
  }

  if (modelo === 'split') {
    return `${stage}<div class="hero-carousel__footer-compact">${toolbarDots(destaques, total, opcoes)}</div>`;
  }

  if (modelo === 'filmstrip') {
    const faixa = opcoes.mostrarMiniaturas
      ? thumbsHtml(destaques, helpers, 'hero-carousel__thumbs--strip')
      : '';
    return `${stage}<div class="hero-carousel__filmstrip-bar">${toolbarDots(destaques, total, opcoes)}${faixa}</div>`;
  }

  if (modelo === 'magazine') {
    return `${stage}<div class="hero-carousel__magazine-ui">${toolbarDots(destaques, total, opcoes)}</div>`;
  }

  return `${stage}${toolbarDots(destaques, total, opcoes)}`;
}

function renderizarCarrosselPortal(section, destaques, config, helpers) {
  if (!section || !destaques.length) {
    if (section) section.innerHTML = '';
    return;
  }

  const opcoes = obterOpcoesCarrossel(config?.home || {});
  section.style.setProperty('--carousel-stage-min', `${opcoes.alturaPx}px`);
  const classesExtras = [
    !opcoes.mostrarSetas ? 'hero-carousel--no-arrows' : '',
    !opcoes.mostrarContador ? 'hero-carousel--no-counter' : '',
    !opcoes.mostrarDots ? 'hero-carousel--no-dots' : ''
  ].filter(Boolean).join(' ');

  section.innerHTML = `
    <section
      class="hero-carousel hero-carousel--${opcoes.modelo} ${opcoes.classeTema} ${opcoes.classeAltura} ${classesExtras}"
      aria-label="Destaques do portal"
      data-autoplay="${opcoes.autoplay}"
      data-modelo="${opcoes.modelo}"
    >
      ${montarCarrossel(opcoes.modelo, destaques, opcoes, helpers)}
    </section>
  `;

  inicializarCarrosselPortal(section.querySelector('.hero-carousel'));
}

function inicializarCarrosselPortal(carousel) {
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
