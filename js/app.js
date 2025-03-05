import { tokenizarSQL } from './lexer.js';
import { parseSQL } from './parser.js';

// Mensajes para el Easter egg (rotarán cada vez)
let messageIndex = 0;
const validEmailMessages = [
    "¡Ups! Esto es un analizador SQL, no un cliente de email. ¿Buscabas enviar un mensaje a tu crush? 💌",
    "Interesante dirección de correo... ¿Sabías que los analizadores léxicos detectan patrones como este? 🔍",
    "¡Email detectado! Nuestro lexer está más interesado en palabras clave como SELECT o JOIN 😉"
];

const invalidEmailMessages = [
    "¿Eso es un email? Hasta el parser sintáctico se rió de tu intento 😂",
    "Error de formato: Falta el dominio (y probablemente otras cosas). ¿Necesitas un analizador léxico para emails?",
    "¡Alerta! Patrón email detectado... pero mal implementado. ¿Quieres que te enseñemos expresiones regulares?"
];

// Mensajes educativos para el proceso de análisis
const processMessages = [
    "🔍 Iniciando análisis: ¿Será un SELECT o un DROP TABLE? 🤔",
    "📧 Paso 1: Verificando que no sea un email (no somos Outlook) ✅",
    "🔨 Tokenizando: Dividiendo tu consulta en piezas comprensibles",
    "🧐 Analizando sintaxis: Buscando errores como un profesor estricto",
    "🌳 Construyendo árbol sintáctico: La estructura lógica de tu consulta",
    "✅ Proceso completado: Mostrando resultados finales 🔬"
];

let currentProcessStep = 0;

function actualizarMensajeProceso(paso) {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.textContent = processMessages[paso];
    currentProcessStep = paso;
}

async function analizarSQL() {
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

    // Easter Egg: Detección de correos electrónicos
    actualizarMensajeProceso(1); // Mostrar paso de verificación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(sqlInput)) {
        alert(validEmailMessages[messageIndex % validEmailMessages.length]);
        messageIndex++;
        return;
    } else if (sqlInput.includes('@')) {
        alert(invalidEmailMessages[messageIndex % invalidEmailMessages.length]);
        messageIndex++;
        return;
    }

    // Mostrar el indicador de carga
    loadingIndicator.style.display = 'block';
    actualizarMensajeProceso(0);

    try {
        // Fase 1: Tokenización
        await new Promise(resolve => setTimeout(resolve, 800));
        actualizarMensajeProceso(2);
        const tokens = tokenizarSQL(sqlInput);
        mostrarTokens(tokens, tokensTableBody);

        // Fase 2: Análisis sintáctico
        await new Promise(resolve => setTimeout(resolve, 800));
        actualizarMensajeProceso(3);
        const { statements, errors } = parseSQL(tokens);

        // Fase 3: Resultados finales
        await new Promise(resolve => setTimeout(resolve, 800));
        actualizarMensajeProceso(5);
        
        loadingIndicator.style.display = 'none';
        resultsContainer.style.display = 'block';

        if (errors.length > 0) {
            mostrarErrores(errors);
            showErrorsButton.style.display = 'block';
            mostrarSeccion('errorSection');
        } else {
            actualizarMensajeProceso(4);
            await new Promise(resolve => setTimeout(resolve, 400));
            mostrarArbolSintactico(statements);
            showTreeButton.style.display = 'block';
            mostrarSeccion('treeSection');
        }
    } catch (error) {
        console.error('Error en el análisis:', error);
        loadingIndicator.style.display = 'none';
        alert("¡Oops! Algo salió mal en el análisis. ¿Probaste con un SELECT básico?");
    }
}

function mostrarTokens(tokens, tableBody) {
    if (tokens.length === 0) return;
    console.log(tokens);

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