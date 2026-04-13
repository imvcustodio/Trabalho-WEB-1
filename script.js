/* =============================================
   LFI CARS — script.js
   Conceitos: sessionStorage, fetch assíncrono, CRUD com localStorage
============================================= */

// Array de veículos em memória (espelhado no localStorage)
let veiculos = [];

// Guarda o ID sendo editado (null = novo cadastro)
let idEditando = null;

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  const ehLoginPage = document.getElementById('login-form') !== null;

  if (ehLoginPage) {
    iniciarLogin();
  } else {
    iniciarApp();
  }
});

// =============================================
// LOGIN
// =============================================
function iniciarLogin() {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const senha   = document.getElementById('senha').value.trim();
    let valido    = true;

    // Validação simples
    if (!usuario) {
      document.getElementById('erro-usuario').textContent = 'Informe o usuário.';
      valido = false;
    } else {
      document.getElementById('erro-usuario').textContent = '';
    }

    if (!senha) {
      document.getElementById('erro-senha').textContent = 'Informe a senha.';
      valido = false;
    } else {
      document.getElementById('erro-senha').textContent = '';
    }

    if (!valido) return;

    // Salva o usuário no sessionStorage e redireciona
    sessionStorage.setItem('usuario_logado', usuario);
    window.location.href = 'index.html';
  });
}

// =============================================
// APP PRINCIPAL
// =============================================
async function iniciarApp() {
  // Verifica se há usuário logado no sessionStorage
  const usuario = sessionStorage.getItem('usuario_logado');
  if (!usuario) {
    window.location.href = 'login.html';
    return;
  }

  // Carrega header e footer via fetch assíncrono
  await carregarComponente('header-container', 'header.html');
  await carregarComponente('footer-container', 'footer.html');

  // Exibe o nome do usuário no header
  const el = document.getElementById('nome-usuario');
  if (el) el.textContent = 'Olá, ' + usuario;

  // Carrega os veículos do localStorage
  const dados = localStorage.getItem('lfi_veiculos');
  if (dados) veiculos = JSON.parse(dados);

  // Registra o submit do formulário
  document.getElementById('form-veiculo').addEventListener('submit', salvarVeiculo);

  // Renderiza a tabela
  renderizarTabela();
}

// =============================================
// FETCH ASSÍNCRONO — carrega HTML externo + CSS independente
// =============================================
async function carregarComponente(idContainer, arquivo) {
  const container = document.getElementById(idContainer);
  if (!container) return;

  // Carrega o HTML do componente
  const resposta = await fetch(arquivo);
  const html     = await resposta.text();
  container.innerHTML = html;

  // Injeta o CSS independente do componente (ex: header.html → header.css)
  const cssArquivo = arquivo.replace('.html', '.css');
  if (!document.querySelector(`link[href="${cssArquivo}"]`)) {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = cssArquivo;
    document.head.appendChild(link);
  }
}

// =============================================
// CRUD
// =============================================

// CREATE / UPDATE
function salvarVeiculo(e) {
  e.preventDefault();

  const modelo = document.getElementById('modelo').value.trim();
  const preco  = document.getElementById('preco').value.trim();
  const ano    = document.getElementById('ano').value.trim();

  if (!modelo || !preco || !ano) {
    alert('Preencha todos os campos.');
    return;
  }

  if (idEditando !== null) {
    // UPDATE — encontra o item e atualiza
    const index = veiculos.findIndex(v => v.id === idEditando);
    veiculos[index] = { id: idEditando, modelo, preco, ano };
    idEditando = null;
    document.getElementById('form-titulo').textContent  = 'Cadastrar Veículo';
    document.getElementById('btn-submit').textContent   = 'Cadastrar';
    document.getElementById('btn-cancelar').style.display = 'none';
  } else {
    // CREATE — adiciona novo item
    const novoVeiculo = { id: Date.now(), modelo, preco, ano };
    veiculos.push(novoVeiculo);
  }

  // Salva no localStorage e atualiza a tabela
  localStorage.setItem('lfi_veiculos', JSON.stringify(veiculos));
  document.getElementById('form-veiculo').reset();
  renderizarTabela();
}

// READ — renderiza todos os veículos na tabela
function renderizarTabela() {
  const tbody = document.getElementById('tabela-body');
  tbody.innerHTML = '';

  if (veiculos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="sem-dados">Nenhum veículo cadastrado.</td></tr>';
    return;
  }

  veiculos.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.modelo}</td>
      <td>R$ ${Number(v.preco).toLocaleString('pt-BR')}</td>
      <td>${v.ano}</td>
      <td>
        <button class="btn-editar"  onclick="editarVeiculo(${v.id})">Editar</button>
        <button class="btn-excluir" onclick="excluirVeiculo(${v.id})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// UPDATE — preenche o formulário com os dados do veículo
function editarVeiculo(id) {
  const v = veiculos.find(v => v.id === id);
  if (!v) return;

  document.getElementById('modelo').value = v.modelo;
  document.getElementById('preco').value  = v.preco;
  document.getElementById('ano').value    = v.ano;

  idEditando = id;
  document.getElementById('form-titulo').textContent  = 'Editar Veículo';
  document.getElementById('btn-submit').textContent   = 'Salvar Alterações';
  document.getElementById('btn-cancelar').style.display = 'inline-block';
}

// DELETE — remove o veículo
function excluirVeiculo(id) {
  if (!confirm('Deseja excluir este veículo?')) return;

  veiculos = veiculos.filter(v => v.id !== id);
  localStorage.setItem('lfi_veiculos', JSON.stringify(veiculos));
  renderizarTabela();
}

// Cancela edição e volta ao modo de cadastro
function cancelarEdicao() {
  idEditando = null;
  document.getElementById('form-veiculo').reset();
  document.getElementById('form-titulo').textContent  = 'Cadastrar Veículo';
  document.getElementById('btn-submit').textContent   = 'Cadastrar';
  document.getElementById('btn-cancelar').style.display = 'none';
}

// =============================================
// LOGOUT
// =============================================
function sair() {
  sessionStorage.removeItem('usuario_logado');
  window.location.href = 'login.html';
}
