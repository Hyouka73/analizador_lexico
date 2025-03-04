import { tokenizarSQL } from './lexer.js';
import { parse } from './parser.js';

function analizarSQL() {
    const sqlInput = document.getElementById('sqlInput').value.trim();
    const tokensTableBody = document.querySelector('#tokensTable tbody');
    const loadingIndicator = document.getElementById('loading');
    const resultsContainer = document.getElementById('resultsContainer');
    const errorSection = document.getElementById('errorSection');
    const treeSection = document.getElementById('treeSection');
    const tokensSection = document.getElementById('tokensSection');
    const errorMessages = document.getElementById('errorMessages');
    const syntaxTree = document.getElementById('syntaxTree');
    const showErrorsButton = document.getElementById('showErrors');
    const showTreeButton = document.getElementById('showTree');
    const showTokensButton = document.getElementById('showTokens');

    // Reiniciar estados anteriores
    resultsContainer.style.display = 'none';
    tokensTableBody.innerHTML = '';
    errorMessages.innerHTML = '';
    syntaxTree.textContent = '';
    showErrorsButton.style.display = 'none';
    showTreeButton.style.display = 'none';
    showTokensButton.style.display = 'block'; // Mostrar el botón de tokens por defecto

    if (sqlInput === '') {
        alert("Por favor, ingresa una consulta SQL.");
        return;
    }

    // Mostrar el indicador de carga
    loadingIndicator.style.display = 'block';

    setTimeout(() => {
        // Tokenización
        const tokens = tokenizarSQL(sqlInput);
        mostrarTokens(tokens, tokensTableBody);

        setTimeout(() => {
            // Análisis sintáctico
            const { statements, errors } = parse(tokens);
            loadingIndicator.style.display = 'none'; // Ocultar el loader
            resultsContainer.style.display = 'block'; // Mostrar resultados

            if (errors.length > 0) {
                mostrarErrores(errors);
                showErrorsButton.style.display = 'block'; // Mostrar el botón de errores
                showTreeButton.style.display = 'none'; // Ocultar el botón del árbol sintáctico
                mostrarSeccion('errorSection'); // Mostrar la sección de errores
            } else {
                mostrarArbolSintactico(statements);
                showTreeButton.style.display = 'block'; // Mostrar el botón del árbol sintáctico
                showErrorsButton.style.display = 'none'; // Ocultar el botón de errores
                mostrarSeccion('treeSection'); // Mostrar la sección del árbol sintáctico
            }
        }, 1000);
    }, 1000);
}

function mostrarTokens(tokens, tableBody) {
    if (tokens.length === 0) return;

    tokens.forEach(({ token, tipo, line }) => {
        const row = document.createElement('tr');
        const tokenCell = document.createElement('td');
        const tipoCell = document.createElement('td');
        const lineCell = document.createElement('td');

        tokenCell.textContent = token;
        tipoCell.textContent = tipo;
        lineCell.textContent = line;

        // Añadir clases CSS basadas en el tipo de token
        tokenCell.classList.add('token');
        tipoCell.classList.add('tipo');
        lineCell.classList.add('line');
        row.classList.add(tipo.toLowerCase().replace(/\s+/g, '-'));

        row.appendChild(tokenCell);
        row.appendChild(tipoCell);
        row.appendChild(lineCell);
        tableBody.appendChild(row);
    });
}

function mostrarErrores(errors) {
    const errorMessages = document.getElementById('errorMessages');

    errors.forEach(error => {
        const message = document.createElement('div');
        message.textContent = `Error: ${error.message} en "${error.token}" (línea ${error.line}, posición ${error.index + 1})`;
        errorMessages.appendChild(message);
    });
}

function mostrarArbolSintactico(statements) {
    const syntaxTree = document.getElementById('syntaxTree');
    syntaxTree.textContent = JSON.stringify(statements, null, 2);
}

function mostrarSeccion(seccionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.tab-content').forEach(seccion => {
        seccion.style.display = 'none';
    });

    // Mostrar la sección seleccionada
    document.getElementById(seccionId).style.display = 'block';

    // Quitar la clase 'active' de todos los botones
    document.querySelectorAll('.tab-button').forEach(boton => {
        boton.classList.remove('active');
    });

    // Agregar la clase 'active' al botón correspondiente
    switch (seccionId) {
        case 'tokensSection':
            document.getElementById('showTokens').classList.add('active');
            break;
        case 'errorSection':
            document.getElementById('showErrors').classList.add('active');
            break;
        case 'treeSection':
            document.getElementById('showTree').classList.add('active');
            break;
    }
}

document.getElementById('analyzeButton').addEventListener('click', analizarSQL);

// Event listeners para los botones de las secciones
document.getElementById('showTokens').addEventListener('click', () => {
    mostrarSeccion('tokensSection');
});

document.getElementById('showErrors').addEventListener('click', () => {
    mostrarSeccion('errorSection');
});

document.getElementById('showTree').addEventListener('click', () => {
    mostrarSeccion('treeSection');
});

const sqlInput = document.getElementById('sqlInput');
const lineNumbers = document.getElementById('lineNumbers');

function updateLineNumbers() {
    const lines = sqlInput.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join('');
}

sqlInput.addEventListener('input', updateLineNumbers);
sqlInput.addEventListener('scroll', () => {
    lineNumbers.scrollTop = sqlInput.scrollTop;
});

// Inicializar los números de línea
updateLineNumbers();