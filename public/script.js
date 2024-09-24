document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const submitBtn = document.getElementById('submit-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const resultDiv = document.getElementById('result');
    const categoriesDiv = document.getElementById('categories');
    const loadingDiv = document.getElementById('loading');
    const celebrationDiv = document.getElementById('celebration');
    let selectedTiles = [];
    let tilesData = [];

    // Fetch game data from the backend
    async function fetchGameData() {
        try {
            const response = await fetch("/api/games/today");
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.tiles; // Expecting { tiles: ['tile1', 'tile2', ...] }
        } catch (error) {
            console.error('Error fetching game data:', error);
            resultDiv.textContent = 'Error loading game data. Please try again later.';
            return null;
        }
    }

    // Submit an attempt to the backend
    async function submitAttempt(selectedValues) {
        try {
            const response = await fetch("/api/games/today/attempt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ values: selectedValues })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data; // Expecting AttemptResponse
        } catch (error) {
            console.error('Error submitting attempt:', error);
            resultDiv.textContent = 'Error submitting attempt. Please try again.';
            return null;
        }
    }

    // Initialize the game
    async function initGame() {
        const tiles = await fetchGameData();
        if (tiles && tiles.length > 0) {
            tilesData = tiles;
            shuffleTiles();
            createTiles(tilesData);
            loadingDiv.style.display = 'none';
        } else {
            resultDiv.textContent = 'No tiles available. Please try again later.';
            loadingDiv.style.display = 'none';
        }
    }

    // Shuffle the tiles
    function shuffleTiles() {
        tilesData.sort(() => Math.random() - 0.5);
    }

    // Create tiles and add them to the game board
    function createTiles(tiles) {
        gameBoard.innerHTML = '';
        tiles.forEach((value) => {
            const tile = document.createElement('button');
            tile.classList.add('tile');
            tile.textContent = value;
            tile.dataset.value = value;
            tile.setAttribute('aria-pressed', 'false');
            tile.setAttribute('role', 'gridcell');
            tile.addEventListener('click', () => selectTile(tile));
            tile.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    selectTile(tile);
                }
            });
            gameBoard.appendChild(tile);
        });
    }

    // Handle tile selection
    function selectTile(tile) {
        const value = tile.dataset.value;
        if (tile.classList.contains('selected')) {
            tile.classList.remove('selected');
            tile.setAttribute('aria-pressed', 'false');
            selectedTiles = selectedTiles.filter(val => val !== value);
        } else {
            tile.classList.add('selected');
            tile.setAttribute('aria-pressed', 'true');
            selectedTiles.push(value);
        }
        submitBtn.disabled = selectedTiles.length === 0;
    }

    // Handle submit button click
    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        resultDiv.textContent = 'Checking...';

        const response = await submitAttempt(selectedTiles);

        if (response && response.success) {
            // Correct attempt
            resultDiv.textContent = response.message || 'Correct! You found a group.';
            displayCategory(response);
            updateGameState(response.values);
        } else if (response && response.message) {
            // Incorrect attempt with a message
            resultDiv.textContent = response.message;
            deselectAllTiles();
        } else {
            // General error or no message provided
            resultDiv.textContent = 'Incorrect selection. Please try again.';
            deselectAllTiles();
        }
        submitBtn.disabled = true;
    });

    // Handle shuffle button click
    shuffleBtn.addEventListener('click', () => {
        shuffleTiles();
        createTiles(tilesData);
    });

    // Display matched category using data from the response
    function displayCategory(response) {
        const categoryItem = document.createElement('div');
        categoryItem.classList.add('category-item');

        // Apply background color based on difficulty
        const difficultyColors = {
            1: '#FFD700', // Yellow
            2: '#32CD32', // Green
            3: '#1E90FF', // Blue
            4: '#800080'  // Purple
        };
        // Use default color if difficulty is not specified or invalid
        const defaultColor = '#32CD32'; // Light Green as default
        const difficultyColor = difficultyColors[response.difficulty] || defaultColor;
        categoryItem.style.backgroundColor = difficultyColor;

        // Create title with category name and difficulty if available
        const categoryTitle = document.createElement('div');
        categoryTitle.classList.add('category-title');
        categoryTitle.textContent = `Matched: ${response.category || 'Unknown Category'} (Difficulty: ${response.difficulty || 'N/A'})`;

        // Create a list of values
        const categoryValues = document.createElement('div');
        categoryValues.classList.add('category-values');
        categoryValues.textContent = `Values: ${response.values.join(', ')}`;

        // Append to category item
        categoryItem.appendChild(categoryTitle);
        categoryItem.appendChild(categoryValues);

        // Insert category items in order of difficulty
        const existingItems = Array.from(categoriesDiv.children);
        const insertIndex = existingItems.findIndex(item => {
            const itemDifficulty = parseInt(item.dataset.difficulty);
            return itemDifficulty > response.difficulty;
        });

        categoryItem.dataset.difficulty = response.difficulty || 0;

        if (insertIndex === -1) {
            categoriesDiv.appendChild(categoryItem);
        } else {
            categoriesDiv.insertBefore(categoryItem, existingItems[insertIndex]);
        }
    }

    // Update the game state after a successful attempt
    function updateGameState(matchedValues) {
        // Remove matched tiles
        tilesData = tilesData.filter(tile => !matchedValues.includes(tile));
        selectedTiles = [];
        submitBtn.disabled = true;

        // Update the game board
        if (tilesData.length > 0) {
            shuffleTiles();
            createTiles(tilesData);
        } else {
            // Game over - Display celebration emoji
            gameBoard.style.display = 'none';
            shuffleBtn.style.display = 'none';
            submitBtn.style.display = 'none';
            resultDiv.style.display = 'none';
            categoriesDiv.style.display = 'none';
            celebrationDiv.style.display = 'flex';
            celebrationDiv.setAttribute('aria-hidden', 'false');
        }
    }

    // Deselect all tiles
    function deselectAllTiles() {
        document.querySelectorAll('.tile.selected').forEach(tile => {
            tile.classList.remove('selected');
            tile.setAttribute('aria-pressed', 'false');
        });
        selectedTiles = [];
    }

    // Start the game
    initGame();
});
