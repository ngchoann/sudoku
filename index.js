import { iniciarTimer, pararTimer, resetTimer } from "./timer.js";

let TAM = 0;
let blocoTAM = 0

var urlParams = new URLSearchParams(window.location.search);
var sudokuTAM = parseInt(urlParams.get('sudoku'));

const DIFFICULTY_LEVELS = {
  easy: 0.6,    // 60% 
  medium: 0.4,  // 40% 
  hard: 0.25,   // 25% 
  genius: 0.1   // 10% 
};

var difficulty = urlParams.get('difficulty') || 'medium';
var fillRate = DIFFICULTY_LEVELS[difficulty];

const CELL_COLORS = [
    '#FFB3BA', // Hồng nhạt
    '#BAFFC9', // Xanh lá nhạt
    '#BAE1FF', // Xanh dương nhạt
    '#FFFFBA', // Vàng nhạt
    '#FFE4BA', // Cam nhạt
    '#E8BAFF', // Tím nhạt
    '#FFB3F7', // Hồng đậm
    '#B3FFE4', // Ngọc lam
    '#FFD700', // Vàng gold
    '#98FB98', // Xanh pastel
    '#DDA0DD', // Tím plum
    '#F0E68C', // Khaki
    '#E6E6FA', // Lavender
    '#FFA07A', // Salmon nhạt
    '#B0E0E6', // Xanh biển nhạt
    '#FFC0CB', // Pink
];

const NUMBER_COLORS = {
    1: '#FFB3BA',  // Hồng nhạt
    2: '#BAFFC9',  // Xanh lá nhạt
    3: '#BAE1FF',  // Xanh dương nhạt
    4: '#FFFFBA',  // Vàng nhạt
    5: '#FFE4BA',  // Cam nhạt
    6: '#E8BAFF',  // Tím nhạt
    7: '#FFB3F7',  // Hồng đậm
    8: '#B3FFE4',  // Ngọc lam
    9: '#FFD700',  // Vàng gold
    10: '#98FB98', // Xanh pastel
    11: '#DDA0DD', // Tím plum
    12: '#F0E68C', // Khaki
    13: '#E6E6FA', // Lavender
    14: '#FFA07A', // Salmon nhạt
    15: '#B0E0E6', // Xanh biển nhạt
    16: '#FFC0CB', // Pink
};

function getAvailableColor(row, col, value) {
    const usedColors = new Set();
    
    // Kiểm tra màu đã sử dụng trong hàng
    for (let j = 0; j < TAM; j++) {
        const cell = document.querySelector(`#cell-${row}-${j}`);
        if (cell && cell.style.backgroundColor) {
            usedColors.add(cell.style.backgroundColor);
        }
    }
    
    // Kiểm tra màu đã sử dụng trong cột
    for (let i = 0; i < TAM; i++) {
        const cell = document.querySelector(`#cell-${i}-${col}`);
        if (cell && cell.style.backgroundColor) {
            usedColors.add(cell.style.backgroundColor);
        }
    }
    
    // Tìm màu cho số hiện tại
    for (let i = 0; i < TAM; i++) {
        for (let j = 0; j < TAM; j++) {
            const cell = document.querySelector(`#cell-${i}-${j}`);
            if (cell && cell.value == value && cell.style.backgroundColor) {
                return cell.style.backgroundColor;
            }
        }
    }
    
    // Nếu chưa có màu cho số này, chọn màu mới chưa được sử dụng
    for (const color of CELL_COLORS) {
        if (!usedColors.has(color)) {
            return color;
        }
    }
    
    return ''; // Trả về rỗng nếu không tìm được màu phù hợp
}

class Vertice {
  constructor(cor) {
    this.loc = [-1, -1]; 
    this.cor = cor; 
    this.adj = []; 
  }
  setColor(cor) {
    this.cor = cor;
  }
  setLoc(linha, coluna) {
    this.loc[0] = linha;
    this.loc[1] = coluna;
  }
}
class Grafo {
  constructor() {
    this.vg = []; 
  }
  addVertice(cor) {
    let v = new Vertice(cor);
    this.vg.push(v);
    return v;
  }
  addAresta(vertice1, vertice2) {
    vertice1.adj.push(vertice2);
  }
}

class Tabuleiro {
  constructor() {
    this.grafo = new Grafo();
    this.tabuleiro = [];
  }

  setTamanho(tamanho) {
    this.tamanho = tamanho;
    this.blocoSize = Math.sqrt(tamanho);
    TAM = tamanho;
    blocoTAM = this.blocoSize
  }

  generateInitialBoard() {
    // Giải sudoku trống để có một bảng hợp lệ
    this.backtracking();
    
    // Lưu lại bảng đã giải
    const solvedBoard = this.tabuleiro.map(row => 
      row.map(cell => cell.cor)
    );

    // Số ô cần giữ lại
    const totalCells = this.tamanho * this.tamanho;
    const cellsToKeep = Math.floor(totalCells * fillRate);
    
    // Reset tất cả các ô về 0
    for (let i = 0; i < this.tamanho; i++) {
      for (let j = 0; j < this.tamanho; j++) {
        this.tabuleiro[i][j].cor = 0;
        this.tabuleiro[i][j].isInitial = false;
      }
    }

    // Chọn ngẫu nhiên các ô để giữ lại, ưu tiên các vị trí tạo ra nhiều nhánh quay lui
    let remainingCells = cellsToKeep;
    
    // Tạo danh sách các vị trí ưu tiên (góc và cạnh) cho bảng 16x16
    const priorityPositions = [];
    if (this.tamanho === 16) {
      // Thêm các vị trí góc
      priorityPositions.push(
        [0, 0], [0, 15], [15, 0], [15, 15],
        // Thêm một số vị trí ở giữa để tăng độ phức tạp
        [4, 4], [4, 11], [11, 4], [11, 11],
        [7, 7], [7, 8], [8, 7], [8, 8]
      );
      
      // Giữ lại một số vị trí ưu tiên trước
      for (const [i, j] of priorityPositions) {
        if (remainingCells > 0 && Math.random() < 0.7) { // 70% cơ hội giữ lại vị trí ưu tiên
          this.tabuleiro[i][j].cor = solvedBoard[i][j];
          this.tabuleiro[i][j].isInitial = true;
          remainingCells--;
        }
      }
    }

    // Điền các ô còn lại một cách ngẫu nhiên
    while (remainingCells > 0) {
      const i = Math.floor(Math.random() * this.tamanho);
      const j = Math.floor(Math.random() * this.tamanho);
      
      // Kiểm tra xem ô đã được điền chưa
      if (this.tabuleiro[i][j].cor === 0) {
        // Với bảng 16x16, chỉ có 50% cơ hội điền số vào các ô không ưu tiên
        if (this.tamanho === 16 && Math.random() > 0.5) {
          continue;
        }
        
        this.tabuleiro[i][j].cor = solvedBoard[i][j];
        this.tabuleiro[i][j].isInitial = true;
        remainingCells--;
      }
    }
  }

  carregaTabuleiro() {
    // Tạo cấu trúc bảng
    for (let i = 0; i < this.tamanho; i++) {
      this.tabuleiro.push([]);
      for (let j = 0; j < this.tamanho; j++) {
        let vertice = this.grafo.addVertice(0);
        vertice.setLoc(i, j);
        this.tabuleiro[i].push(vertice);
      }
    }

    // Thiết lập các mối quan hệ kề
    for (let i = 0; i < this.tamanho; i++) {
      for (let j = 0; j < this.tamanho; j++) {
        this.defineAdj(this.tabuleiro[i][j]);
      }
    }

    // Tạo bảng ban đầu với độ khó đã chọn
    this.generateInitialBoard();
  }

  defineAdj(vertice) {
    //define adjacências para um vértice
    var linha_vertice = vertice.loc[0];
    var coluna_vertice = vertice.loc[1];
    var linha_bloco = Math.floor(linha_vertice / this.blocoSize);
    var coluna_bloco = Math.floor(coluna_vertice / this.blocoSize);
    var linha_min = linha_bloco * this.blocoSize;
    var coluna_min = coluna_bloco * this.blocoSize;
    var linha_max = linha_min + this.blocoSize;
    var coluna_max = coluna_min + this.blocoSize;
    for (let i of this.tabuleiro[linha_vertice]) {
      //Adicionando adjacência em linhas
      if (i != vertice) {
        this.grafo.addAresta(vertice, i);
      }
    }
    //Adicionando adjacência em colunas
    for (let i of this.tabuleiro) {
      if (i[coluna_vertice] != vertice) {
        this.grafo.addAresta(vertice, i[coluna_vertice]);
      }
    }
    for (let i = linha_min; i < linha_max; i++) {
      
      for (let j = coluna_min; j < coluna_max; j++) {
        if (i == linha_vertice || j == coluna_vertice) {
          //Não adiciona adjacências já definidas anteriormente
          continue;
        }
        if (this.tabuleiro[i][j] != vertice) {
          this.grafo.addAresta(vertice, this.tabuleiro[i][j]);
        }
      }
    }
  }
  colorIsValid(cor, vertice) {
    //se nenhum dos vertices adjacentes possui a cor, ela é válida
    for (let x of vertice.adj) {
      if (x.cor == cor) {
        return false;
      }
    }
    return true;
  }
  tryToColor(vertice) {
    let cor_atual = vertice.cor;
    
    // Với bảng 16x16, thử các giá trị theo thứ tự ngẫu nhiên
    if (this.tamanho === 16) {
      let possibleValues = [];
      for (let i = 1; i <= this.tamanho; i++) {
        possibleValues.push(i);
      }
      // Xáo trộn mảng các giá trị có thể
      for (let i = possibleValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possibleValues[i], possibleValues[j]] = [possibleValues[j], possibleValues[i]];
      }
      
      // Thử các giá trị theo thứ tự ngẫu nhiên
      for (let cor of possibleValues) {
        if (cor > cor_atual && this.colorIsValid(cor, vertice)) {
          vertice.setColor(cor);
          return true;
        }
      }
    } else {
      // Với bảng 9x9, giữ nguyên logic cũ
      for (let cor = cor_atual + 1; cor < this.tamanho + 1; cor++) {
        if (this.colorIsValid(cor, vertice)) {
          vertice.setColor(cor);
          return true;
        }
      }
    }
    return false;
  }
  encontraCor0() {
    for (let linha = 0; linha < this.tamanho; linha++) {
      for (let coluna = 0; coluna < this.tamanho; coluna++) {
        if (this.tabuleiro[linha][coluna].cor == 0) {
          return this.tabuleiro[linha][coluna]; //retorna o vertice cuja cor é nula
        }
      }
    }
    return null;
  }
  backtracking() {
    var v_livre = this.encontraCor0();
    if (v_livre == null) {
      //Solução completa do tabuleiro, não existem vértices livres
      return true;
    }
    while (this.tryToColor(v_livre)) {
      //tenta colorir um vértice com cor válida
      if (this.backtracking()) {
        //chama recursão
        return true;
      }
    }
    v_livre.setColor(0);
    return false;
  }
  alteraCelula(pos_linha, pos_coluna, nova_cor) {
    //Tenta alterar a estrutura de um tabuleiro já carregado, caso possível
    var vertice = this.tabuleiro[pos_linha][pos_coluna];
    if (this.colorIsValid(nova_cor, vertice)) {
      vertice.setColor(nova_cor);
      return true;
    }
    return false; //Jogador perdeu
  }

  Celula(valor, cor) {
    this.valor = valor;
    this.cor = cor;
    this.alteradoPeloUsuario = false; // novo campo
  }

  checkValue(row, col, value) {
    // Lưu giá trị hiện tại
    const currentValue = this.tabuleiro[row][col].cor;
    
    // Tạm thời đặt giá trị về 0 để kiểm tra
    this.tabuleiro[row][col].cor = 0;
    
    // Kiểm tra giá trị mới có hợp lệ không
    const isValid = this.colorIsValid(value, this.tabuleiro[row][col]);
    
    // Khôi phục giá trị cũ
    this.tabuleiro[row][col].cor = currentValue;
    
    return isValid;
  }
}

// Thêm biến đếm số lần sai
let remainingLives = 5;

// Thêm hàm kiểm tra và hiển thị số mạng còn lại
function updateLivesDisplay() {
  const livesDisplay = document.getElementById("lives-display");
  livesDisplay.textContent = `Còn ${remainingLives} lượt`;
  if (remainingLives <= 2) {
    livesDisplay.style.color = '#ff6b6b';
  } else {
    livesDisplay.style.color = '#fff';
  }
}

// Thêm hàm xử lý game over
function handleGameOver() {
  const gameOverScreen = document.getElementById('game-over');
  gameOverScreen.classList.remove('hide');
}

// Thêm hàm debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function carregarTabuleiro() {
    const grid = document.getElementById("sudoku-grid");
    for (let i = 0; i < TAM; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < TAM; j++) {
            const cell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            input.min = 1;
            input.max = TAM;
            input.maxLength = 2;
            
            const currentCell = tabuleiro.tabuleiro[i][j];
            if (currentCell.cor) {
                input.value = currentCell.cor;
                input.style.backgroundColor = NUMBER_COLORS[currentCell.cor];
            }
            
            if (currentCell.isInitial) {
                input.disabled = true;
                input.classList.add("initial-cell");
            }

            // Tạo hàm xử lý input với debounce
            const debouncedInputHandler = debounce((value) => {
                const newValue = parseInt(value) || 0;
                
                // Reset styles khi xóa giá trị
                if (newValue === 0 || value === '') {
                    input.classList.remove("wrong-answer");
                    input.classList.remove("celula-alterada");
                    input.style.backgroundColor = ''; // Reset background color
                    tabuleiro.tabuleiro[i][j].cor = 0;
                    return;
                }

                if (newValue > TAM) {
                    handleWrongInput(input);
                    return;
                }

                const isValid = tabuleiro.checkValue(i, j, newValue);
                
                if (!isValid) {
                    handleWrongInput(input);
                } else {
                    input.classList.remove("wrong-answer");
                    tabuleiro.alteraCelula(i, j, newValue);
                    tabuleiro.tabuleiro[i][j].alteradoPeloUsuario = true;
                    input.classList.add("celula-alterada");
                    input.style.backgroundColor = NUMBER_COLORS[newValue];
                }
            }, 750); // Đợi 750ms (0.75 giây)

            input.addEventListener("input", (e) => {
                if (input.value.length > 2) {
                    input.value = input.value.slice(0, 2);
                }
                debouncedInputHandler(input.value);
            });

            if (sudokuTAM === 9) {
                input.style.padding = '13px';
                input.style.fontSize = '23px';
            } else {
                input.style.padding = '7px';
                input.style.fontSize = '15px';
            }

            cell.appendChild(input);
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
}

// Thêm event listeners khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
  // Ẩn màn hình game over khi mới vào
  document.getElementById('game-over').classList.add('hide');

  // Xử lý nút chơi lại
  document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over').classList.add('hide');
    remainingLives = 5;
    updateLivesDisplay();
    createNewGame();
  });

  // Xử lý nút trở lại
  document.getElementById('back-to-menu').addEventListener('click', () => {
    window.location.href = './index.html';
  });

  // Xử lý nút Resolver
  document.getElementById('solve-button').addEventListener('click', async () => {
    // Disable nút trong quá trình giải
    const solveButton = document.getElementById('solve-button');
    solveButton.disabled = true;
    
    await visualBacktracking();
    
    // Enable lại nút sau khi giải xong
    solveButton.disabled = false;
  });

  // Xử lý nút Tạo mới
  document.getElementById('new-game-button').addEventListener('click', () => {
    createNewGame();
  });
});

// Khởi tạo game
const tabuleiro = new Tabuleiro();
tabuleiro.setTamanho(sudokuTAM);
iniciarTimer();
tabuleiro.carregaTabuleiro();
carregarTabuleiro();
updateLivesDisplay();

// Thêm hàm updateBoard để cập nhật giao diện sau khi giải
function updateBoard() {
    const grid = document.getElementById("sudoku-grid");
    const inputs = grid.getElementsByTagName("input");
    let index = 0;
    
    for (let i = 0; i < TAM; i++) {
        for (let j = 0; j < TAM; j++) {
            const value = tabuleiro.tabuleiro[i][j].cor;
            inputs[index].value = value;
            inputs[index].style.backgroundColor = NUMBER_COLORS[value];
            inputs[index].classList.add("celula-alterada");
            index++;
        }
    }
}

// Sửa lại hàm createNewGame để tạo bảng mới hoàn toàn
function createNewGame() {
  // Xóa bảng hiện tại
  const grid = document.getElementById("sudoku-grid");
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }

  // Reset bảng
  tabuleiro.tabuleiro = [];
  tabuleiro.grafo = new Grafo();

  // Tạo bảng mới
  tabuleiro.carregaTabuleiro();
  carregarTabuleiro();

  // Reset timer
  pararTimer();
  resetTimer();
  iniciarTimer();

  // Reset số lượt
  remainingLives = 5;
  updateLivesDisplay();

  // Ẩn thông báo game over nếu đang hiển thị
  document.getElementById('game-over').classList.add('hide');
}

// Thêm hàm xử lý input sai
function handleWrongInput(input) {
  input.classList.add("wrong-answer");
  remainingLives--;
  updateLivesDisplay();
  
  // Sau 3 giây, xóa class wrong-answer và giá trị
  setTimeout(() => {
    input.classList.remove("wrong-answer");
    input.value = "";
    // Cập nhật giá trị trong tabuleiro
    const row = input.parentElement.parentElement.rowIndex;
    const col = input.parentElement.cellIndex;
    tabuleiro.tabuleiro[row][col].cor = 0;
  }, 3000);
  
  if (remainingLives <= 0) {
    handleGameOver();
  }
}

// Thêm hàm delay để tạo hiệu ứng animation
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Sửa đổi hàm backtracking để thêm animation
async function visualBacktracking() {
  const grid = document.getElementById("sudoku-grid");
  const inputs = grid.getElementsByTagName("input");

  // Điều chỉnh delay dựa trên kích thước bảng
  const baseDelay = TAM === 16 ? 50 : 100;
  
  async function backtrack() {
    var v_livre = tabuleiro.encontraCor0();
    if (v_livre == null) {
      return true;
    }

    const currentIndex = v_livre.loc[0] * TAM + v_livre.loc[1];
    
    // Hiển thị ô đang xét
    inputs[currentIndex].style.backgroundColor = '#ff6b6b';
    await delay(baseDelay);

    for (let cor = 1; cor <= TAM; cor++) {
      if (tabuleiro.colorIsValid(cor, v_livre)) {
        // Hiển thị giá trị đang thử và màu tương ứng
        v_livre.setColor(cor);
        inputs[currentIndex].value = cor;
        inputs[currentIndex].style.backgroundColor = NUMBER_COLORS[cor];
        await delay(baseDelay);

        if (await backtrack()) {
          return true;
        }

        // Nếu không tìm được giải pháp, quay lui
        inputs[currentIndex].style.backgroundColor = '#ff8c00';
        await delay(baseDelay);
        
        // Reset giá trị
        v_livre.setColor(0);
        inputs[currentIndex].value = '';
        inputs[currentIndex].style.backgroundColor = '#ff6b6b';
        await delay(baseDelay);
      }
    }

    // Khi đã thử hết các giá trị có thể
    v_livre.setColor(0);
    inputs[currentIndex].value = '';
    inputs[currentIndex].style.backgroundColor = '#ffebee';
    
    // Tìm ô trước đó để quay lui
    let prevIndex = -1;
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!inputs[i].classList.contains("initial-cell") && inputs[i].value !== '') {
        prevIndex = i;
        break;
      }
    }
    
    if (prevIndex !== -1) {
      // Hiển thị đường đi quay lui
      await delay(baseDelay);
      inputs[prevIndex].style.backgroundColor = '#ff6b6b';
      await delay(baseDelay);
    }
    
    return false;
  }

  // Disable tất cả input và buttons trong quá trình giải
  const allInputs = document.getElementsByTagName("input");
  const buttons = document.getElementsByTagName("button");
  
  for (let input of allInputs) {
    if (!input.classList.contains("initial-cell")) {
      input.disabled = true;
    }
  }
  
  for (let button of buttons) {
    button.disabled = true;
  }

  try {
    await backtrack();
  } finally {
    // Enable lại input và buttons sau khi giải xong
    for (let input of allInputs) {
      if (!input.classList.contains("initial-cell")) {
        input.disabled = false;
      }
    }
    
    for (let button of buttons) {
      button.disabled = false;
    }

    // Cập nhật lại bảng với kết quả cuối cùng và màu sắc tương ứng
    updateBoard();
  }
}

// Thêm style cho các trạng thái khác nhau
function updateCellStyle(input, status) {
  switch(status) {
    case 'checking':
      input.style.backgroundColor = '#ff6b6b'; // Đỏ - đang kiểm tra
      break;
    case 'trying':
      input.style.backgroundColor = '#ffd700'; // Vàng - đang thử giá trị
      break;
    case 'backtracking':
      input.style.backgroundColor = '#ff8c00'; // Cam - đang quay lui
      break;
    default:
      input.style.backgroundColor = 'white';
  }
}

// Thêm hàm để kiểm tra xem bảng đã được giải xong chưa
function isSolved() {
  for (let i = 0; i < TAM; i++) {
    for (let j = 0; j < TAM; j++) {
      if (tabuleiro.tabuleiro[i][j].cor === 0) {
        return false;
      }
    }
  }
  return true;
}
