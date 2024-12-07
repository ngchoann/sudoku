document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('sudoku-board');
    const solveButton = document.getElementById('solve-button');
    const resetButton = document.getElementById('reset-button');

    let boardSize = 9; // Set board size to a fixed value

    // Define a color map for numbers
    const colorMap = {
        1: '#FFB3BA',  // Hồng nhạt
        2: '#BAFFC9',  // Xanh lá nhạt
        3: '#BAE1FF',  // Xanh dương nhạt
        4: '#FFFFBA',  // Vàng nhạt     
        5: '#FFE4BA',  // Cam nhạt
        6: '#E8BAFF',  // Tím nhạt
        7: '#FFB3F7',  // Hồng đậm
        8: '#B3FFE4',  // Ngọc lam
        9: '#FFD700',  // Vàng gold
    };

    const generateCompleteSudoku = () => {
        const sudoku = Array(boardSize * boardSize).fill(0);

        const solve = (index = 0) => {
            if (index === boardSize * boardSize) return true;

            const row = Math.floor(index / boardSize);
            const col = index % boardSize;

            if (sudoku[index] !== 0) return solve(index + 1);

            const numbers = Array.from({ length: boardSize }, (_, i) => i + 1);
            numbers.sort(() => Math.random() - 0.5);

            for (let num of numbers) {
                if (isSafe(sudoku, index, num)) {
                    sudoku[index] = num;
                    if (solve(index + 1)) return true;
                    sudoku[index] = 0;
                }
            }
            return false;
        };

        solve();
        return sudoku;
    };

    const fillPredefinedCells = () => {
        const completeSudoku = generateCompleteSudoku();
        const cells = board.querySelectorAll('td');
        const totalCells = boardSize * boardSize;
        const predefinedCount = Math.floor(totalCells * 0.25);

        let indices = Array.from({ length: totalCells }, (_, i) => i);
        indices = indices.sort(() => Math.random() - 0.5).slice(0, predefinedCount);

        indices.forEach(index => {
            const value = completeSudoku[index];
            const input = cells[index].querySelector('input');
            input.value = value;
            input.readOnly = true; // Đặt thuộc tính readOnly
            cells[index].classList.add('predefined'); // Đánh dấu ô đã được định trước

            // Áp dụng màu dựa trên giá trị
            input.style.backgroundColor = colorMap[value];
        });
    };

    const createBoard = () => {
        board.innerHTML = ''; // Xóa bảng hiện tại

        for (let i = 0; i < boardSize; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < boardSize; j++) {
                const cell = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                cell.appendChild(input);
                row.appendChild(cell);
            }
            board.appendChild(row);
        }

        fillPredefinedCells(); // Điền 25% bảng với các giá trị được định trước
    };

    const getConstraints = (sudoku, index) => {
        const size = Math.sqrt(boardSize);
        const row = Math.floor(index / boardSize);
        const col = index % boardSize;
        const constraints = new Set();

        for (let i = 0; i < boardSize; i++) {
            constraints.add(sudoku[row * boardSize + i]);
            constraints.add(sudoku[i * boardSize + col]);
            constraints.add(sudoku[Math.floor(row / size) * size * boardSize + Math.floor(col / size) * size + Math.floor(i / size) * boardSize + i % size]);
        }

        constraints.delete(0); // Remove empty cells
        return constraints;
    };

    const isSafe = (sudoku, index, num) => {
        const row = Math.floor(index / boardSize);
        const col = index % boardSize;
        const size = Math.sqrt(boardSize);

        // Kiểm tra hàng và cột
        for (let i = 0; i < boardSize; i++) {
            if (sudoku[row * boardSize + i] === num || sudoku[i * boardSize + col] === num) {
                return false;
            }
        }

        // Kiểm tra ô vuông nhỏ
        const startRow = row - (row % size);
        const startCol = col - (col % size);
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (sudoku[(startRow + r) * boardSize + (startCol + c)] === num) {
                    return false;
                }
            }
        }

        return true;
    };

    const colorSudokuGraphAscending = async (sudoku) => {
        const cells = board.querySelectorAll('td');
        const uncolored = new Set();

        // Initialize uncolored set with all indices
        for (let i = 0; i < boardSize * boardSize; i++) {
            if (sudoku[i] === 0) {
                uncolored.add(i);
            }
        }

        while (uncolored.size > 0) {
            let maxConstraints = -1;
            let selectedIndex = -1;

            // Find the uncolored cell with the most constraints
            for (let index of uncolored) {
                const constraints = getConstraints(sudoku, index).size;
                if (constraints > maxConstraints) {
                    maxConstraints = constraints;
                    selectedIndex = index;
                }
            }

            if (selectedIndex === -1) break; // No more cells to color

            const possibleValues = [];
            const constraints = getConstraints(sudoku, selectedIndex);

            // Collect possible values for the selected cell
            for (let num = 1; num <= boardSize; num++) {
                if (!constraints.has(num)) {
                    possibleValues.push(num);
                }
            }

            // Highlight the current cell in orange
            const currentCell = cells[selectedIndex].querySelector('input');
            currentCell.style.backgroundColor = 'orange';

            // Delay to visualize the current cell being highlighted
            await new Promise(resolve => setTimeout(resolve, 400)); // Adjust delay as needed

            // If no possible values, show the modal and exit
            if (possibleValues.length === 0) {
                showUnsolvableModal();
                return false;
            }

            // Color the cell with the smallest possible value
            const value = possibleValues[0];
            sudoku[selectedIndex] = value;
            uncolored.delete(selectedIndex);

                currentCell.value = value;

            // Apply color based on the value only if it's not predefined
            if (!cells[selectedIndex].classList.contains('predefined')) {
                currentCell.style.backgroundColor = colorMap[value];
            }
        }

        return sudoku.every(value => value !== 0); // Check if the board is completely filled
    };

    // Function to show the modal
    const showUnsolvableModal = () => {
        const modal = document.getElementById('unsolvable-modal');
        const overlay = document.getElementById('overlay');
        const closeButton = modal.querySelector('.close-button');

        modal.style.display = 'block';
        overlay.style.display = 'block';

        const hideModal = () => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        };

        closeButton.onclick = hideModal;

        window.onclick = (event) => {
            if (event.target !== modal && event.target !== closeButton) {
                hideModal();
            }
        };
    };

    const resetBoard = () => {
        createBoard(); // Tạo lại bảng và điền các ô ngẫu nhiên
    };

    solveButton.addEventListener('click', () => {
        solveButton.classList.add('disabled');
        resetButton.classList.add('disabled');

        const cells = board.querySelectorAll('td');
        const sudoku = Array.from(cells).map(cell => {
            const input = cell.querySelector('input');
            return parseInt(input.value) || 0;
        });

        colorSudokuGraphAscending(sudoku).then(isSolved => {
            solveButton.classList.remove('disabled');
            resetButton.classList.remove('disabled');
            if (isSolved) {
                cells.forEach((cell, index) => {
                    const input = cell.querySelector('input');
                    input.value = sudoku[index] !== 0 ? sudoku[index] : '';
                });
            } else {
                showUnsolvableModal();
            }
        });
    });

    resetButton.addEventListener('click', resetBoard);

    createBoard();

    const modal = document.getElementById('unsolvable-modal');
    const overlay = document.getElementById('overlay');

    const hideModal = () => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    };

    // Hide modal when clicking anywhere on the screen
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#unsolvable-modal')) {
            hideModal();
        }
    });
});
