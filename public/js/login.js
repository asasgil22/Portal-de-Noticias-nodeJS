document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault();

  const erroBox = document.getElementById('erro-mensagem');
  erroBox.classList.add('d-none');

  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;

  try {
    const resposta = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });

    if (resposta.ok) {
      window.location.href = 'admin.html';
      return;
    }

    const dados = await resposta.json();
    erroBox.textContent = dados.erro || 'Credenciais invalidas.';
    erroBox.classList.remove('d-none');
  } catch {
    erroBox.textContent = 'Erro ao conectar com o servidor.';
    erroBox.classList.remove('d-none');
  }
});
