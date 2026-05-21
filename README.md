# Portal de Noticias (Node.js)

Portal de noticias com painel admin, carrossel configuravel e identidade visual editavel.

## Rodar localmente

```bash
npm install
npm start
```

Acesse `http://localhost:3000` (painel em `/admin.html`, login em `/login.html`).

## SEO e compartilhamento

O servidor injeta meta tags no HTML (titulo, description, Open Graph, Twitter Card e JSON-LD) para crawlers e previews no WhatsApp/redes.

| Recurso | URL |
|--------|-----|
| Home | `/` |
| Materia | `/noticia/:slug` |
| Categoria | `/categoria/:slug` |
| Sitemap | `/sitemap.xml` |
| Robots | `/robots.txt` |

URLs antigas `noticia.html?slug=...` redirecionam com 301 para `/noticia/:slug`.

### URL publica em producao

Defina a URL absoluta do site para imagens e links de compartilhamento:

```bash
cp .env.example .env
# Edite SITE_URL=https://seu-dominio.com.br
```

Tambem pode gravar `siteUrl` em `data/config.json` (prioridade sobre o host da requisicao).

Variaveis uteis: `PORT`, `SITE_URL`, `SESSION_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`.
