const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.resolve(__dirname, 'data');
const PUBLIC_DIR = path.resolve(__dirname, 'public');
const UPLOADS_DIR = path.resolve(PUBLIC_DIR, 'uploads');
const PATH_NOTICIAS = path.join(DATA_DIR, 'noticias.json');
const PATH_ENQUETE = path.join(DATA_DIR, 'enquete.json');
const PATH_JOGOS = path.join(DATA_DIR, 'jogos.json');
const PATH_CONFIG = path.join(DATA_DIR, 'config.json');
const PATH_PLANTOES = path.join(DATA_DIR, 'plantoes.json');

const USUARIO_ADMIN = process.env.ADMIN_USER || 'admin';
const SENHA_ADMIN = process.env.ADMIN_PASSWORD || '12345';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'portal-noticias-chave-secreta-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000
  }
}));

async function garantirEstrutura() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await garantirArquivo(PATH_NOTICIAS, []);
  await garantirArquivo(PATH_ENQUETE, {
    pergunta: 'Qual tema voce quer ver mais no portal?',
    opcoes: {
      Esportes: 4,
      Politica: 2,
      Tecnologia: 5,
      Cultura: 1
    }
  });
  await garantirArquivo(PATH_JOGOS, [
    {
      id: '1',
      campeonato: 'Campeonato Brasileiro',
      dataHora: '2026-05-24T16:00',
      mandante: 'BOT',
      visitante: 'SAO',
      placarMandante: null,
      placarVisitante: null
    }
  ]);
  await garantirArquivo(PATH_CONFIG, {
    nomePortal: 'Portal Noticias',
    slogan: 'Informacao clara, direta e em tempo real',
    corPrincipal: '#2f3a44',
    corAcento: '#0f766e',
    logoUrl: '',
    imagemPadraoUrl: '',
    home: {
      mostrarTicker: true,
      mostrarBusca: true,
      mostrarCarrossel: true,
      mostrarUltimas: true,
      mostrarMaisLidas: true,
      mostrarJogos: true,
      mostrarEnquete: true,
      limiteNoticias: 6,
      limiteJogos: 3,
      limiteCarrossel: 5,
      temaCarrossel: 'claro',
      carrosselIds: []
    }
  });
  await garantirArquivo(PATH_PLANTOES, [
    {
      id: '1',
      texto: 'Portal em evolucao: novas areas dinamicas ja podem ser controladas pelo admin.',
      link: '',
      ativo: true,
      data: new Date().toISOString()
    }
  ]);
}

async function garantirArquivo(caminho, valorPadrao) {
  try {
    await fs.access(caminho);
  } catch {
    await salvarJSON(caminho, valorPadrao);
  }
}

async function lerJSON(caminho, valorPadrao = []) {
  try {
    const data = await fs.readFile(caminho, 'utf8');
    if (!data.trim()) return valorPadrao;
    return JSON.parse(data);
  } catch {
    return valorPadrao;
  }
}

async function salvarJSON(caminho, dados) {
  await fs.mkdir(path.dirname(caminho), { recursive: true });
  await fs.writeFile(caminho, JSON.stringify(dados, null, 2), 'utf8');
}

function estaLogado(req) {
  return Boolean(req.session && req.session.logado);
}

function exigirLoginPagina(req, res, next) {
  if (req.path === '/admin.html' && !estaLogado(req)) {
    return res.redirect('/login.html');
  }
  next();
}

function exigirLoginAPI(req, res, next) {
  if (!estaLogado(req)) {
    return res.status(401).json({ erro: 'Nao autorizado.' });
  }
  next();
}

function normalizarBoolean(valor) {
  return valor === true || valor === 'true' || valor === 'on' || valor === '1';
}

function lerBooleanConfig(valor, padrao = true) {
  if (valor === undefined || valor === null || valor === '') return padrao;
  return normalizarBoolean(valor);
}

function slugify(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || Date.now().toString();
}

function garantirSlugUnico(noticias, titulo, idAtual) {
  const base = slugify(titulo);
  let slug = base;
  let contador = 2;
  while (noticias.some((item) => item.slug === slug && String(item.id) !== String(idAtual))) {
    slug = `${base}-${contador}`;
    contador += 1;
  }
  return slug;
}

function normalizarNoticia(noticia, noticias = []) {
  const titulo = noticia.titulo || 'Sem titulo';
  const tags = Array.isArray(noticia.tags)
    ? noticia.tags
    : String(noticia.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);

  return {
    ...noticia,
    titulo,
    resumo: noticia.resumo || '',
    conteudo: noticia.conteudo || noticia.resumo || '',
    categoria: noticia.categoria || 'Geral',
    autor: noticia.autor || 'Redacao',
    tags,
    slug: noticia.slug || garantirSlugUnico(noticias, titulo, noticia.id),
    status: noticia.status === 'rascunho' ? 'rascunho' : 'publicado'
  };
}

function noticiaPublicavel(noticia) {
  return noticia.status !== 'rascunho';
}

function normalizarConfig(config = {}) {
  return {
    nomePortal: config.nomePortal || 'Portal Noticias',
    slogan: config.slogan || 'Informacao clara, direta e em tempo real',
    corPrincipal: config.corPrincipal || '#2f3a44',
    corAcento: config.corAcento || '#0f766e',
    logoUrl: config.logoUrl || '',
    imagemPadraoUrl: config.imagemPadraoUrl || '',
    home: {
      mostrarTicker: config.home?.mostrarTicker !== false,
      mostrarBusca: config.home?.mostrarBusca !== false,
      mostrarCarrossel: config.home?.mostrarCarrossel !== false,
      mostrarUltimas: config.home?.mostrarUltimas !== false,
      mostrarMaisLidas: config.home?.mostrarMaisLidas !== false,
      mostrarJogos: config.home?.mostrarJogos !== false,
      mostrarEnquete: config.home?.mostrarEnquete !== false,
      limiteNoticias: Math.max(Number(config.home?.limiteNoticias) || 6, 1),
      limiteJogos: Math.max(Number(config.home?.limiteJogos) || 3, 1),
      limiteCarrossel: Math.min(Math.max(Number(config.home?.limiteCarrossel) || 5, 1), 5),
      temaCarrossel: config.home?.temaCarrossel === 'escuro' ? 'escuro' : 'claro',
      carrosselIds: Array.isArray(config.home?.carrosselIds)
        ? config.home.carrosselIds.map(String).filter(Boolean)
        : []
    }
  };
}

function parseCarrosselIds(valor) {
  if (Array.isArray(valor)) return valor.map(String).filter(Boolean);
  try {
    const parsed = JSON.parse(valor || '[]');
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function obterDestaquesCarrossel(noticias) {
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const limite = config.home.limiteCarrossel;
  const ids = config.home.carrosselIds;
  let destaques = [];

  if (ids.length) {
    destaques = ids
      .map((id) => noticias.find((noticia) => String(noticia.id) === String(id)))
      .filter(Boolean);
  }

  if (!destaques.length) {
    destaques = noticias.filter((noticia) => noticia.destaqueCarousel);
  }

  return destaques.slice(0, limite);
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      cb(null, UPLOADS_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Envie apenas arquivos de imagem.'));
    }
    cb(null, true);
  }
});

app.use(exigirLoginPagina);
app.use(express.static(PUBLIC_DIR));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: PUBLIC_DIR }, (err) => {
    if (err) {
      res.status(404).json({ erro: 'Pagina inicial nao encontrada.' });
    }
  });
});

app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario === USUARIO_ADMIN && senha === SENHA_ADMIN) {
    req.session.logado = true;
    return res.sendStatus(200);
  }
  res.status(401).json({ erro: 'Usuario ou senha incorretos.' });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

app.get('/api/status', (req, res) => {
  res.json({ logado: estaLogado(req) });
});

app.get('/api/config', async (req, res) => {
  res.json(normalizarConfig(await lerJSON(PATH_CONFIG, {})));
});

app.put('/api/config', exigirLoginAPI, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'imagemPadrao', maxCount: 1 }
]), async (req, res) => {
  const atual = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const config = {
    ...atual,
    nomePortal: req.body.nomePortal || atual.nomePortal,
    slogan: req.body.slogan || '',
    corPrincipal: req.body.corPrincipal || atual.corPrincipal,
    corAcento: req.body.corAcento || atual.corAcento,
    logoUrl: req.files?.logo?.[0] ? `/uploads/${req.files.logo[0].filename}` : atual.logoUrl,
    imagemPadraoUrl: req.files?.imagemPadrao?.[0] ? `/uploads/${req.files.imagemPadrao[0].filename}` : atual.imagemPadraoUrl,
    home: {
      mostrarTicker: lerBooleanConfig(req.body.mostrarTicker, atual.home.mostrarTicker),
      mostrarBusca: lerBooleanConfig(req.body.mostrarBusca, atual.home.mostrarBusca),
      mostrarCarrossel: lerBooleanConfig(req.body.mostrarCarrossel, atual.home.mostrarCarrossel),
      mostrarUltimas: lerBooleanConfig(req.body.mostrarUltimas, atual.home.mostrarUltimas),
      mostrarMaisLidas: lerBooleanConfig(req.body.mostrarMaisLidas, atual.home.mostrarMaisLidas),
      mostrarJogos: lerBooleanConfig(req.body.mostrarJogos, atual.home.mostrarJogos),
      mostrarEnquete: lerBooleanConfig(req.body.mostrarEnquete, atual.home.mostrarEnquete),
      limiteNoticias: Math.max(Number(req.body.limiteNoticias) || atual.home.limiteNoticias, 1),
      limiteJogos: Math.max(Number(req.body.limiteJogos) || atual.home.limiteJogos, 1),
      limiteCarrossel: Math.min(Math.max(Number(req.body.limiteCarrossel) || atual.home.limiteCarrossel, 1), 5),
      temaCarrossel: req.body.temaCarrossel === 'escuro' ? 'escuro' : 'claro',
      carrosselIds: req.body.carrosselIds !== undefined && String(req.body.carrosselIds).trim() !== ''
        ? parseCarrosselIds(req.body.carrosselIds).slice(0, 5)
        : atual.home.carrosselIds
    }
  };

  if (normalizarBoolean(req.body.removerLogo)) config.logoUrl = '';
  if (normalizarBoolean(req.body.removerImagemPadrao)) config.imagemPadraoUrl = '';

  await salvarJSON(PATH_CONFIG, config);
  res.json(normalizarConfig(config));
});

app.put('/api/config/carrossel', exigirLoginAPI, async (req, res) => {
  const atual = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const limite = Math.min(Math.max(Number(req.body.limite) || atual.home.limiteCarrossel, 1), 5);
  atual.home.carrosselIds = parseCarrosselIds(req.body.ids ?? req.body.carrosselIds).slice(0, limite);
  await salvarJSON(PATH_CONFIG, atual);
  res.json({
    carrosselIds: atual.home.carrosselIds,
    home: atual.home
  });
});

app.get('/api/plantoes', async (req, res) => {
  const plantoes = await lerJSON(PATH_PLANTOES, []);
  const base = req.query.admin === 'true' ? plantoes : plantoes.filter((plantao) => plantao.ativo !== false);
  res.json([...base].sort((a, b) => new Date(b.data) - new Date(a.data)));
});

app.post('/api/plantoes', exigirLoginAPI, async (req, res) => {
  const plantoes = await lerJSON(PATH_PLANTOES, []);
  const novoPlantao = {
    id: Date.now().toString(),
    texto: req.body.texto || 'Novo plantao',
    link: req.body.link || '',
    ativo: req.body.ativo !== false,
    data: new Date().toISOString()
  };
  plantoes.unshift(novoPlantao);
  await salvarJSON(PATH_PLANTOES, plantoes);
  res.status(201).json(novoPlantao);
});

app.put('/api/plantoes/:id', exigirLoginAPI, async (req, res) => {
  const plantoes = await lerJSON(PATH_PLANTOES, []);
  const idx = plantoes.findIndex((plantao) => String(plantao.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Plantao nao encontrado.' });
  plantoes[idx] = {
    ...plantoes[idx],
    texto: req.body.texto || plantoes[idx].texto,
    link: req.body.link ?? plantoes[idx].link ?? '',
    ativo: req.body.ativo === undefined
      ? plantoes[idx].ativo !== false
      : normalizarBoolean(req.body.ativo)
  };
  await salvarJSON(PATH_PLANTOES, plantoes);
  res.json(plantoes[idx]);
});

app.delete('/api/plantoes/:id', exigirLoginAPI, async (req, res) => {
  const plantoes = await lerJSON(PATH_PLANTOES, []);
  await salvarJSON(PATH_PLANTOES, plantoes.filter((plantao) => String(plantao.id) !== String(req.params.id)));
  res.json({ mensagem: 'Plantao excluido.' });
});

app.get('/api/noticias', async (req, res) => {
  try {
    const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) => normalizarNoticia(noticia));
    const termo = String(req.query.q || '').trim().toLowerCase();
    const categoria = String(req.query.categoria || '').trim().toLowerCase();
    const base = req.query.admin === 'true' ? noticias : noticias.filter(noticiaPublicavel);
    const filtradas = base.filter((noticia) => {
      const texto = `${noticia.titulo} ${noticia.resumo} ${noticia.conteudo} ${noticia.categoria} ${(noticia.tags || []).join(' ')}`.toLowerCase();
      const bateBusca = !termo || texto.includes(termo);
      const bateCategoria = !categoria || String(noticia.categoria || '').toLowerCase() === categoria;
      return bateBusca && bateCategoria;
    });
    const ordenadas = [...filtradas].sort((a, b) => new Date(b.data) - new Date(a.data));

    if (req.query.admin === 'true') {
      return res.json(ordenadas);
    }

    if (req.query.maisLidas === 'true') {
      return res.json([...ordenadas]
        .sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0))
        .slice(0, 5));
    }

    const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
    const limite = Math.max(parseInt(req.query.limite, 10) || 6, 1);
    const startIndex = (pagina - 1) * limite;
    const grid = ordenadas.slice(startIndex, startIndex + limite);
    const totalPaginas = Math.max(Math.ceil(ordenadas.length / limite), 1);
    const destaques = await obterDestaquesCarrossel(ordenadas);

    res.json({ destaques, grid, paginaAtual: pagina, totalPaginas, totalItens: ordenadas.length });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar noticias.' });
  }
});

app.get('/api/categorias', async (req, res) => {
  const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) => normalizarNoticia(noticia));
  const publicadas = noticias.filter(noticiaPublicavel);
  const categorias = [...new Set(publicadas.map((noticia) => noticia.categoria || 'Geral'))].sort();
  res.json(categorias);
});

app.get('/api/noticias/:identificador', async (req, res) => {
  const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) => normalizarNoticia(noticia));
  const noticia = noticias.find((item) => (
    String(item.id) === String(req.params.identificador) || String(item.slug) === String(req.params.identificador)
  ));
  if (!noticia) return res.status(404).json({ erro: 'Noticia nao encontrada.' });
  if (!noticiaPublicavel(noticia) && !estaLogado(req)) {
    return res.status(404).json({ erro: 'Noticia nao encontrada.' });
  }
  res.json(noticia);
});

app.post('/api/noticias', exigirLoginAPI, upload.single('imagem'), async (req, res) => {
  try {
    const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) => normalizarNoticia(noticia));
    const titulo = req.body.titulo || 'Sem titulo';
    const novaNoticia = {
      id: Date.now().toString(),
      slug: garantirSlugUnico(noticias, titulo),
      titulo,
      resumo: req.body.resumo || '',
      conteudo: req.body.conteudo || req.body.resumo || '',
      categoria: req.body.categoria || 'Geral',
      autor: req.body.autor || 'Redacao',
      tags: String(req.body.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
      status: req.body.status === 'rascunho' ? 'rascunho' : 'publicado',
      destaqueCarousel: normalizarBoolean(req.body.destaque),
      data: new Date().toISOString(),
      imagemUrl: req.file ? `/uploads/${req.file.filename}` : '',
      visualizacoes: 0
    };

    noticias.unshift(novaNoticia);
    await salvarJSON(PATH_NOTICIAS, noticias);
    res.status(201).json(novaNoticia);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar noticia.' });
  }
});

app.put('/api/noticias/:id', exigirLoginAPI, upload.single('imagem'), async (req, res) => {
  try {
    const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) => normalizarNoticia(noticia));
    const idx = noticias.findIndex((item) => String(item.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ erro: 'Noticia nao encontrada.' });
    const titulo = req.body.titulo || noticias[idx].titulo;
    const removerImagem = normalizarBoolean(req.body.removerImagem);

    noticias[idx] = {
      ...noticias[idx],
      titulo,
      slug: garantirSlugUnico(noticias, titulo, noticias[idx].id),
      resumo: req.body.resumo || '',
      conteudo: req.body.conteudo || req.body.resumo || '',
      categoria: req.body.categoria || 'Geral',
      autor: req.body.autor || 'Redacao',
      tags: String(req.body.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
      status: req.body.status === 'rascunho' ? 'rascunho' : 'publicado',
      destaqueCarousel: normalizarBoolean(req.body.destaque),
      imagemUrl: req.file ? `/uploads/${req.file.filename}` : (removerImagem ? '' : noticias[idx].imagemUrl)
    };

    await salvarJSON(PATH_NOTICIAS, noticias);
    res.json(noticias[idx]);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar noticia.' });
  }
});

app.delete('/api/noticias/:id', exigirLoginAPI, async (req, res) => {
  try {
    const noticias = await lerJSON(PATH_NOTICIAS, []);
    const filtradas = noticias.filter((item) => String(item.id) !== String(req.params.id));
    await salvarJSON(PATH_NOTICIAS, filtradas);

    const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
    config.home.carrosselIds = config.home.carrosselIds.filter((itemId) => (
      String(itemId) !== String(req.params.id)
    ));
    await salvarJSON(PATH_CONFIG, config);

    res.json({ mensagem: 'Noticia excluida.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao excluir noticia.' });
  }
});

app.post('/api/noticias/:identificador/view', async (req, res) => {
  try {
    const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) => normalizarNoticia(noticia));
    const idx = noticias.findIndex((item) => (
      String(item.id) === String(req.params.identificador) || String(item.slug) === String(req.params.identificador)
    ));
    if (idx !== -1) {
      noticias[idx].visualizacoes = (noticias[idx].visualizacoes || 0) + 1;
      await salvarJSON(PATH_NOTICIAS, noticias);
    }
    res.sendStatus(200);
  } catch {
    res.sendStatus(500);
  }
});

app.get('/api/enquete', async (req, res) => {
  res.json(await lerJSON(PATH_ENQUETE, { pergunta: 'Sua opiniao?', opcoes: {} }));
});

app.post('/api/enquete/votar', async (req, res) => {
  try {
    const { opcao } = req.body;
    const enquete = await lerJSON(PATH_ENQUETE, { pergunta: '', opcoes: {} });
    if (!enquete.opcoes || enquete.opcoes[opcao] === undefined) {
      return res.status(400).json({ erro: 'Opcao invalida.' });
    }
    enquete.opcoes[opcao] += 1;
    await salvarJSON(PATH_ENQUETE, enquete);
    res.json(enquete);
  } catch {
    res.sendStatus(500);
  }
});

app.post('/api/enquete/configurar', exigirLoginAPI, async (req, res) => {
  const opcoes = Array.isArray(req.body.opcoes) ? req.body.opcoes : String(req.body.opcoes || '').split(',');
  const novaEnquete = { pergunta: req.body.pergunta || 'Nova enquete', opcoes: {} };
  opcoes.forEach((opcao) => {
    const nome = String(opcao).trim();
    if (nome) novaEnquete.opcoes[nome] = 0;
  });
  await salvarJSON(PATH_ENQUETE, novaEnquete);
  res.json(novaEnquete);
});

app.get('/api/jogos', async (req, res) => {
  res.json(await lerJSON(PATH_JOGOS, []));
});

app.post('/api/jogos', exigirLoginAPI, async (req, res) => {
  const jogos = await lerJSON(PATH_JOGOS, []);
  const novoJogo = {
    id: Date.now().toString(),
    campeonato: req.body.campeonato || 'Campeonato',
    dataHora: req.body.dataHora,
    mandante: req.body.mandante || 'MAND',
    visitante: req.body.visitante || 'VIS',
    placarMandante: null,
    placarVisitante: null
  };
  jogos.push(novoJogo);
  await salvarJSON(PATH_JOGOS, jogos);
  res.status(201).json(novoJogo);
});

app.post('/api/jogos/:id/placar', exigirLoginAPI, async (req, res) => {
  const jogos = await lerJSON(PATH_JOGOS, []);
  const idx = jogos.findIndex((jogo) => String(jogo.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Jogo nao encontrado.' });
  jogos[idx].placarMandante = req.body.placarMandante === '' ? null : Number(req.body.placarMandante);
  jogos[idx].placarVisitante = req.body.placarVisitante === '' ? null : Number(req.body.placarVisitante);
  await salvarJSON(PATH_JOGOS, jogos);
  res.json(jogos[idx]);
});

app.put('/api/jogos/:id', exigirLoginAPI, async (req, res) => {
  const jogos = await lerJSON(PATH_JOGOS, []);
  const idx = jogos.findIndex((jogo) => String(jogo.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Jogo nao encontrado.' });
  jogos[idx] = {
    ...jogos[idx],
    campeonato: req.body.campeonato || jogos[idx].campeonato,
    dataHora: req.body.dataHora || jogos[idx].dataHora,
    mandante: req.body.mandante || jogos[idx].mandante,
    visitante: req.body.visitante || jogos[idx].visitante,
    placarMandante: req.body.placarMandante === '' ? null : Number(req.body.placarMandante ?? jogos[idx].placarMandante),
    placarVisitante: req.body.placarVisitante === '' ? null : Number(req.body.placarVisitante ?? jogos[idx].placarVisitante)
  };
  await salvarJSON(PATH_JOGOS, jogos);
  res.json(jogos[idx]);
});

app.delete('/api/jogos/:id', exigirLoginAPI, async (req, res) => {
  const jogos = await lerJSON(PATH_JOGOS, []);
  await salvarJSON(PATH_JOGOS, jogos.filter((jogo) => String(jogo.id) !== String(req.params.id)));
  res.json({ mensagem: 'Jogo excluido.' });
});

app.use((err, req, res, next) => {
  if (!err) return next();
  if (err.code === 'ENOENT') {
    return res.status(404).json({ erro: 'Arquivo nao encontrado.' });
  }
  if (err instanceof multer.MulterError || /imagem|upload/i.test(err.message || '')) {
    return res.status(400).json({ erro: err.message || 'Erro no upload.' });
  }
  next(err);
});

garantirEstrutura().then(async () => {
  const noticias = await lerJSON(PATH_NOTICIAS, []);
  if (!noticias.length) {
    await salvarJSON(PATH_NOTICIAS, require('./data/noticias.seed.json'));
  }

  app.listen(PORT, () => {
    console.log(`Portal rodando em http://localhost:${PORT}`);
    console.log(`Painel admin: http://localhost:${PORT}/admin.html`);
    console.log(`Login padrao: ${USUARIO_ADMIN} / ${SENHA_ADMIN}`);
  });
}).catch((error) => {
  console.error('Erro ao iniciar o servidor:', error);
  process.exit(1);
});
