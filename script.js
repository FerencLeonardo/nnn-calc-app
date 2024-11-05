const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nnnMemoR = new Map();

// Main function to calculate nim values starting from all piles
function nnnCalc(piles, adjMatrix) {
    nnnMemoR.clear();
    let maxNimValue = 0;
    for (let i = 0; i < piles.length; i++) {
        maxNimValue = Math.max(maxNimValue, nnnCalcR(piles, adjMatrix, i));
    }
    return maxNimValue;
}

// Function to calculate nim values for a specific game
function nnnCalcR(piles, adjMatrix, lastPile) {
    const key = alpha[lastPile] + JSON.stringify(piles);

    // Check if the mex value is already in the dictionary
    if (nnnMemoR.has(key)) {
        return nnnMemoR.get(key);
    }

    // Base case: If all connected piles are empty, the game ends
    let endGame = true;
    for (let neighborPile = 0; neighborPile < piles.length; neighborPile++) {
        if (adjMatrix[lastPile][neighborPile] === 1 && piles[neighborPile] > 0) {
            endGame = false;
            break;
        }
    }
    if (endGame) {
        nnnMemoR.set(key, 0);
        return 0;
    }

    // Set to store calculated nim values for possible moves
    const optionsValSet = new Set();

    // Explore moves from the last pile and its connected piles
    for (let neighborPile = 0; neighborPile < piles.length; neighborPile++) {
        if (adjMatrix[lastPile][neighborPile] === 1 && piles[neighborPile] > 0) {
            for (let stonesToRemove = 1; stonesToRemove <= piles[neighborPile]; stonesToRemove++) {
                const newPiles = [...piles];
                newPiles[neighborPile] -= stonesToRemove;

                optionsValSet.add(nnnCalcR(newPiles, adjMatrix, neighborPile));
            }
        }
    }

    // Calculate the mex value for the current game state
    const mexValue = calcMex(optionsValSet);
    nnnMemoR.set(key, mexValue);

    return mexValue;
}

// Function to calculate the mex value
function calcMex(optionsValSet) {
    let mex = 0;
    while (optionsValSet.has(mex)) {
        mex++;
    }
    return mex;
}

// Function to display the dictionary of starting positions
function printDict(nnnMemoR, initialPiles) {
    const startingPositions = [];

    // Iterate through the memoization map to find matching positions
    for (const [key, value] of nnnMemoR.entries()) {
        const pileSizes = JSON.parse(key.slice(1)); // Extract pile sizes from key
        if (JSON.stringify(pileSizes) === JSON.stringify(initialPiles)) {
            startingPositions.push(`${key} = ${value}`);
        }
    }

    // Sort the starting positions in descending order based on their values
    startingPositions.sort((a, b) => {
        const valueA = parseInt(a.split('=')[1].trim());
        const valueB = parseInt(b.split('=')[1].trim());
        return valueB - valueA;
    });

    // Display the results
    const resultContainer = document.getElementById('result');
    const positionsDisplay = document.createElement('div');
    positionsDisplay.className = 'positions-display';
    positionsDisplay.innerHTML = startingPositions.length > 0 
        ? `<h3>Starting Positions:</h3><p>${startingPositions.join('<br>')}</p>` 
        : '<h3>Starting Positions:</h3><p>No matching starting positions found.</p>';

    // Remove any previous positions display
    const existingDisplay = document.querySelector('.positions-display');
    if (existingDisplay) {
        resultContainer.removeChild(existingDisplay);
    }
    
    resultContainer.appendChild(positionsDisplay);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('numPiles').addEventListener('input', function () {
        const numPiles = parseInt(this.value);
        const pileInputsContainer = document.getElementById('pileInputs');
        const adjacencyMatrixContainer = document.getElementById('adjacencyMatrix');

        // Clear previous inputs
        pileInputsContainer.innerHTML = '';
        adjacencyMatrixContainer.innerHTML = '';

        // Create inputs for pile sizes
        for (let i = 0; i < numPiles; i++) {
            const pileInput = document.createElement('div');
            pileInput.className = 'pile-input';
            pileInput.innerHTML = `
                <label for="pile_${i}">Pile ${i + 1} size:</label>
                <input type="number" id="pile_${i}" min="0" max="20" required>
            `;
            pileInputsContainer.appendChild(pileInput);
        }

        // Create adjacency matrix inputs
        if (numPiles > 0) {
            const matrixTable = document.createElement('table');
            // Create header row
            const headerRow = document.createElement('tr');
            headerRow.appendChild(document.createElement('td')); // Empty top-left cell
            for (let j = 0; j < numPiles; j++) {
                const headerCell = document.createElement('td');
                headerCell.innerText = `Pile ${j + 1}`;
                headerRow.appendChild(headerCell);
            }
            matrixTable.appendChild(headerRow);

            // Create each row of the adjacency matrix
            for (let i = 0; i < numPiles; i++) {
                const row = document.createElement('tr');
                const rowLabel = document.createElement('td');
                rowLabel.innerText = `Pile ${i + 1}`;
                row.appendChild(rowLabel);
                for (let j = 0; j < numPiles; j++) {
                    const cell = document.createElement('td');
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    input.max = '1';
                    input.value = '0';
                    input.addEventListener('input', function () {
                        // Restrict input to only 0 or 1
                        this.value = this.value.replace(/[^01]/g, '');
                    });
                    cell.appendChild(input);
                    row.appendChild(cell);
                }
                matrixTable.appendChild(row);
            }
            adjacencyMatrixContainer.appendChild(matrixTable);
        }
    });

    document.getElementById('calculateButton').addEventListener('click', function () {
        const numPiles = parseInt(document.getElementById('numPiles').value);
        const piles = [];

        // Collect pile sizes
        for (let i = 0; i < numPiles; i++) {
            piles.push(Math.min(parseInt(document.getElementById(`pile_${i}`).value) || 0, 20)); // Cap pile size at 20
        }

        // Collect adjacency matrix
        const adjacencyMatrix = [];
        const matrixRows = document.querySelectorAll('#adjacencyMatrix table tr');
        for (let i = 1; i < matrixRows.length; i++) {
            const row = [];
            const inputs = matrixRows[i].getElementsByTagName('input');
            for (let j = 0; j < inputs.length; j++) {
                row.push(parseInt(inputs[j].value) || 0);
            }
            adjacencyMatrix.push(row);
        }

        // Calculate Nim value
        const result = nnnCalc(piles, adjacencyMatrix);
        document.getElementById('result').innerText = `Nim Value: ${result}`;
        
        // Display the starting positions
        printDict(nnnMemoR, piles); // Pass the initial pile sizes directly
    });

    // Additional validation for pile sizes to enforce max value
    const pileInputsContainer = document.getElementById('pileInputs');
    pileInputsContainer.addEventListener('input', function (e) {
        if (e.target.tagName === 'INPUT' && e.target.type === 'number') {
            const inputValue = parseInt(e.target.value);
            if (inputValue > 20) {
                e.target.value = 20; // Enforce max value for pile sizes
            }
        }
    });

    // Validation for numPiles input to enforce max value
    document.getElementById('numPiles').addEventListener('input', function () {
        const numPiles = parseInt(this.value);
        if (numPiles > 10) {
            this.value = 10; // Enforce max value for number of piles
        }
    });
});
