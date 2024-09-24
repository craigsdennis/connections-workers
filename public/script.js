document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const submitBtn = document.getElementById('submit-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const resultDiv = document.getElementById('result');
    const categoriesDiv = document.getElementById('categories');
    let selectedTiles = [];
    let tilesData = [];
    let categoriesData = [];

    // Mock function to simulate fetching game data
    async function fetchGameData() {
        const response = await fetch("/api/games/today");
        return response.json();
    }

    // Mock function to simulate submitting an attempt
    async function submitAttempt(selectedValues) {
        // Simulate an API call to /api/games/attempts
        const response = await fetch("/api/games/today/attempt", 
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(selectedValues)
            });
        return response.json();
    }

    // Initialize the game
    async function initGame() {
        const data = await fetchGameData();
        categoriesData = data.categories;
        tilesData = [...categoriesData];

        shuffleTiles();
        createTiles(tilesData);
    }

    // Shuffle the tiles
    function shuffleTiles() {
        tilesData.sort(() => Math.random() - 0.5);
    }

    // Create tiles and add them to the game board
    function createTiles(tiles) {
        gameBoard.innerHTML = '';
        tiles.forEach((category) => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.textContent = category;
            tile.dataset.value = category;
            tile.addEventListener('click', () => selectTile(tile));
            gameBoard.appendChild(tile);
        });
    }

    // Handle tile selection
    function selectTile(tile) {
        if (tile.classList.contains('selected')) {
            tile.classList.remove('selected');
            selectedTiles = selectedTiles.filter(val => val !== tile.dataset.value);
        } else {
            tile.classList.add('selected');
            selectedTiles.push(tile.dataset.value);
        }
        submitBtn.disabled = selectedTiles.length === 0;
    }

    // Handle submit button click
    submitBtn.addEventListener('click', async () => {
        const response = await submitAttempt(selectedTiles);
        if (response.message) {
            resultDiv.textContent = response.message;
        }
        if (response.success) {
            resultDiv.textContent = '';
            displayCategory(response);

            // Remove matched tiles from data
            tilesData = tilesData.filter(tile => !selectedTiles.includes(tile));
            selectedTiles = [];
            submitBtn.disabled = true;

            // Remove the matched category from categoriesData
            categoriesData = categoriesData.filter(category => category.name !== response.category.name);

            // Reshuffle and recreate tiles to fill the grid evenly
            if (tilesData.length > 0) {
                shuffleTiles();
                createTiles(tilesData);
            } else {
                // Game over
                resultDiv.textContent = 'Congratulations! You have found all categories.';
            }
        } else {
            // Deselect tiles
            document.querySelectorAll('.tile.selected').forEach(tile => tile.classList.remove('selected'));
            selectedTiles = [];
            submitBtn.disabled = true;
        }
    });

    // Handle shuffle button click
    shuffleBtn.addEventListener('click', () => {
        shuffleTiles();
        createTiles(tilesData);
    });

    // Display matched category with values and difficulty
    function displayCategory(response) {
        const categoryItem = document.createElement('div');
        categoryItem.classList.add('category-item');

        // Create title with category name and difficulty
        const categoryTitle = document.createElement('div');
        categoryTitle.classList.add('category-title');
        categoryTitle.textContent = `Matched: ${response.category} (Difficulty: ${response.difficulty})`;

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

        categoryItem.dataset.difficulty = response.difficulty;

        if (insertIndex === -1) {
            categoriesDiv.appendChild(categoryItem);
        } else {
            categoriesDiv.insertBefore(categoryItem, existingItems[insertIndex]);
        }
    }

    // Start the game
    initGame();
});
