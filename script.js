/* =============================================
   LFI CARS — script.js
   Conceitos: sessionStorage, fetch assíncrono, CRUD com localStorage
============================================= */

// Array de veículos em memória (espelhado no localStorage)
let veiculos = [];

// Guarda o ID sendo editado (null = novo cadastro)
let idEditando = null;

// Estado da tabela (ordenação e paginação)
let colunaOrdenacao  = null;   // ex: "preco", "ano", "modelo"...
let direcaoOrdenacao = 'asc';  // "asc" ou "desc"
let paginaAtual      = 1;
let linhasPorPagina  = 5;

// Caminho da página de login (login moderno na subpasta)
const URL_LOGIN = 'Trabalho  WEB/Login/index.html';

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', iniciarApp);

// =============================================
// APP PRINCIPAL
// =============================================
async function iniciarApp() {
  const usuario = sessionStorage.getItem('usuario_logado');
  if (!usuario) {
    window.location.href = URL_LOGIN;
    return;
  }

  await carregarComponente('navbar-container', 'navbar.html');
  await carregarComponente('header-container', 'header.html');
  await carregarComponente('footer-container', 'footer.html');

  const el = document.getElementById('nome-usuario');
  if (el) el.textContent = 'Olá, ' + usuario;

  // Carrega veículos do localStorage
  const dados = localStorage.getItem('lfi_veiculos');
  if (dados) veiculos = JSON.parse(dados);

  // Submit do formulário
  document.getElementById('form-veiculo').addEventListener('submit', salvarVeiculo);

  // Cliques nas colunas para ordenar
  document.querySelectorAll('.data-table th.sortable').forEach(th => {
    th.addEventListener('click', () => ordenarPor(th.dataset.coluna));
  });

  // "Selecionar tudo" no cabeçalho marca/desmarca todas as linhas visíveis
  document.getElementById('check-all').addEventListener('change', (e) => {
    const marcar = e.target.checked;
    document.querySelectorAll('.row-check').forEach(cb => {
      cb.checked = marcar;
      cb.closest('tr').classList.toggle('selected', marcar);
    });
  });

  // Controles de paginação
  document.getElementById('rows-per-page').addEventListener('change', (e) => {
    linhasPorPagina = Number(e.target.value);
    paginaAtual = 1;
    renderizarTabela();
  });

  document.getElementById('btn-prev').addEventListener('click', () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      renderizarTabela();
    }
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    const totalPaginas = Math.ceil(veiculos.length / linhasPorPagina);
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      renderizarTabela();
    }
  });

  renderizarTabela();
}

// =============================================
// FETCH ASSÍNCRONO — carrega HTML + CSS do componente
// =============================================
async function carregarComponente(idContainer, arquivo) {
  const container = document.getElementById(idContainer);
  if (!container) return;

  const resposta = await fetch(arquivo);
  const html     = await resposta.text();
  container.innerHTML = html;

  const cssArquivo = arquivo.replace('.html', '.css');
  if (!document.querySelector(`link[href="${cssArquivo}"]`)) {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = cssArquivo;
    document.head.appendChild(link);
  }
}

// =============================================
// VALIDAÇÕES
// Retorna true se todos os campos forem válidos.
// =============================================
function validarFormulario(modelo, marca, preco, ano, combustivel) {
  // Limpa erros antigos
  document.getElementById('erro-modelo').textContent      = '';
  document.getElementById('erro-marca').textContent       = '';
  document.getElementById('erro-preco').textContent       = '';
  document.getElementById('erro-ano').textContent         = '';
  document.getElementById('erro-combustivel').textContent = '';

  let valido = true;

  // 1) Modelo deve ter no mínimo 3 caracteres
  if (modelo.length < 3) {
    document.getElementById('erro-modelo').textContent =
      'O modelo deve ter pelo menos 3 caracteres.';
    valido = false;
  }

  // Marca obrigatória (validação simples de campo vazio)
  if (!marca) {
    document.getElementById('erro-marca').textContent = 'Informe a marca.';
    valido = false;
  }

  // 2) Preço deve ser maior ou igual a R$ 5.000
  const precoNumero = Number(preco);
  if (!preco || isNaN(precoNumero)) {
    document.getElementById('erro-preco').textContent = 'Informe um preço válido.';
    valido = false;
  } else if (precoNumero < 5000) {
    document.getElementById('erro-preco').textContent =
      'A loja só aceita veículos acima de R$ 5.000,00.';
    valido = false;
  }

  // 3) Ano deve estar entre 1990 e o ano atual
  const anoNumero = Number(ano);
  const anoAtual  = new Date().getFullYear();
  if (!ano || isNaN(anoNumero)) {
    document.getElementById('erro-ano').textContent = 'Informe o ano.';
    valido = false;
  } else if (anoNumero < 1990 || anoNumero > anoAtual) {
    document.getElementById('erro-ano').textContent =
      `O ano deve estar entre 1990 e ${anoAtual}.`;
    valido = false;
  }

  // Combustível obrigatório
  if (!combustivel) {
    document.getElementById('erro-combustivel').textContent =
      'Selecione o tipo de combustível.';
    valido = false;
  }

  return valido;
}

// =============================================
// CRUD
// =============================================

// CREATE / UPDATE
function salvarVeiculo(e) {
  e.preventDefault();

  const modelo      = document.getElementById('modelo').value.trim();
  const marca       = document.getElementById('marca').value.trim();
  const preco       = document.getElementById('preco').value.trim();
  const ano         = document.getElementById('ano').value.trim();
  const combustivel = document.getElementById('combustivel').value;

  // Roda as validações antes de salvar
  if (!validarFormulario(modelo, marca, preco, ano, combustivel)) return;

  if (idEditando !== null) {
    // UPDATE
    const index = veiculos.findIndex(v => v.id === idEditando);
    veiculos[index] = {
      id: idEditando,
      modelo, marca,
      preco: Number(preco),
      ano: Number(ano),
      combustivel
    };
    idEditando = null;
    document.getElementById('form-titulo').textContent    = 'Cadastrar Veículo';
    document.getElementById('btn-submit').textContent     = 'Cadastrar';
    document.getElementById('btn-cancelar').style.display = 'none';
  } else {
    // CREATE
    const novoVeiculo = {
      id: Date.now(),
      modelo, marca,
      preco: Number(preco),
      ano: Number(ano),
      combustivel
    };
    veiculos.push(novoVeiculo);
  }

  localStorage.setItem('lfi_veiculos', JSON.stringify(veiculos));
  document.getElementById('form-veiculo').reset();
  renderizarTabela();
}

// READ — ordena, pagina e renderiza
function renderizarTabela() {
  const tbody = document.getElementById('tabela-body');
  tbody.innerHTML = '';

  // Atualiza setas no cabeçalho
  document.querySelectorAll('.data-table th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.coluna === colunaOrdenacao) {
      th.classList.add(direcaoOrdenacao === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });

  // Copia para não mexer no array original ao ordenar
  let lista = [...veiculos];

  if (colunaOrdenacao) {
    lista.sort((a, b) => {
      const va = a[colunaOrdenacao];
      const vb = b[colunaOrdenacao];
      if (va < vb) return direcaoOrdenacao === 'asc' ? -1 : 1;
      if (va > vb) return direcaoOrdenacao === 'asc' ?  1 : -1;
      return 0;
    });
  }

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="sem-dados">Nenhum veículo cadastrado.</td></tr>';
    document.getElementById('check-all').checked = false;
    atualizarPaginacao(0, 0, 0);
    return;
  }

  // Paginação: pega só o pedaço da página atual
  const totalPaginas = Math.ceil(lista.length / linhasPorPagina);
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

  const inicio = (paginaAtual - 1) * linhasPorPagina;
  const fim    = inicio + linhasPorPagina;
  const pagina = lista.slice(inicio, fim);

  pagina.forEach(v => {
    const tr = document.createElement('tr');
    tr.dataset.id = v.id;
    tr.innerHTML = `
      <td class="col-checkbox">
        <input type="checkbox" class="row-checkbox row-check" data-id="${v.id}" />
      </td>
      <td>${v.modelo}</td>
      <td>${v.marca || ''}</td>
      <td>R$ ${Number(v.preco).toLocaleString('pt-BR')}</td>
      <td>${v.ano}</td>
      <td>${v.combustivel || ''}</td>
      <td>
        <button class="btn-editar"  onclick="editarVeiculo(${v.id})">Editar</button>
        <button class="btn-excluir" onclick="excluirVeiculo(${v.id})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Liga os checkboxes das linhas após renderizar
  ligarCheckboxesDasLinhas();

  // O "selecionar tudo" só fica marcado se TODAS as linhas da página estiverem
  const checks = document.querySelectorAll('.row-check');
  const todos  = checks.length > 0 && [...checks].every(c => c.checked);
  document.getElementById('check-all').checked = todos;

  atualizarPaginacao(inicio + 1, Math.min(fim, lista.length), lista.length);
}

// Liga o evento de marcar/desmarcar em cada checkbox de linha
function ligarCheckboxesDasLinhas() {
  document.querySelectorAll('.row-check').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const tr = e.target.closest('tr');
      tr.classList.toggle('selected', e.target.checked);

      // Reavalia o "selecionar tudo"
      const checks = document.querySelectorAll('.row-check');
      const todos  = [...checks].every(c => c.checked);
      document.getElementById('check-all').checked = todos;
    });
  });
}

// Atualiza o texto "1–5 de 10" e o estado dos botões
function atualizarPaginacao(de, ate, total) {
  document.getElementById('page-info').textContent = `${de}–${ate} de ${total}`;

  const totalPaginas = Math.ceil(total / linhasPorPagina) || 1;
  document.getElementById('btn-prev').disabled = paginaAtual <= 1;
  document.getElementById('btn-next').disabled = paginaAtual >= totalPaginas;
}

// Clique em uma coluna ordenável
function ordenarPor(coluna) {
  if (colunaOrdenacao === coluna) {
    // Mesma coluna: inverte direção
    direcaoOrdenacao = direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
  } else {
    colunaOrdenacao  = coluna;
    direcaoOrdenacao = 'asc';
  }
  renderizarTabela();
}

// UPDATE — preenche o formulário para edição
function editarVeiculo(id) {
  const v = veiculos.find(v => v.id === id);
  if (!v) return;

  document.getElementById('modelo').value      = v.modelo;
  document.getElementById('marca').value       = v.marca || '';
  document.getElementById('preco').value       = v.preco;
  document.getElementById('ano').value         = v.ano;
  document.getElementById('combustivel').value = v.combustivel || '';

  idEditando = id;
  document.getElementById('form-titulo').textContent    = 'Editar Veículo';
  document.getElementById('btn-submit').textContent     = 'Salvar Alterações';
  document.getElementById('btn-cancelar').style.display = 'inline-block';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// DELETE
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
  document.getElementById('form-titulo').textContent    = 'Cadastrar Veículo';
  document.getElementById('btn-submit').textContent     = 'Cadastrar';
  document.getElementById('btn-cancelar').style.display = 'none';
}

// =============================================
// LOGOUT
// =============================================
function sair() {
  sessionStorage.removeItem('usuario_logado');
  window.location.href = URL_LOGIN;
}
