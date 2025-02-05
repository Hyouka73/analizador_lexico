// Definición mejorada de tipos de tokens
const TOKEN_TYPES = {
    KEYWORD: 'Palabra Reservada',
    IDENTIFIER: 'Identificador',
    OPERATOR: {
        RELATIONAL: 'Operador Relacional',
        LOGICAL: 'Operador Lógico',
        ARITHMETIC: 'Operador Aritmético'
    },
    DELIMITER: 'Delimitador',
    LITERAL: {
        NUMBER: 'Literal Numérico',
        STRING: 'Literal Cadena',
        DATE: 'Literal Fecha'
    },
    FUNCTION: 'Función SQL',
    SPECIAL: 'Carácter Especial',
    UNKNOWN: 'Desconocido'
};

// Definiciones mejoradas de tokens SQL
const SQL_DEFINITIONS = {
    keywords: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE',
        'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR',
        'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT',
        'AS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'NOT'
    ],
    functions: [
        'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'ROUND', 'UPPER', 'LOWER',
        'CONCAT', 'SUBSTRING', 'DATE', 'YEAR', 'MONTH', 'DAY'
    ],
    operators: {
        relational: ['=', '>', '<', '>=', '<=', '!=', '<>', '!<', '!>'],
        logical: ['AND', 'OR', 'NOT'],
        arithmetic: ['+', '-', '*', '/', '%']
    },
    delimiters: ['(', ')', ',', ';', '.'],
    special: ['*']
};

function analizarSQL() {
    const sqlInput = document.getElementById('sqlInput').value;
    const tokensTableBody = document.querySelector('#tokensTable tbody');
    tokensTableBody.innerHTML = '';

    const tokens = tokenizarSQL(sqlInput);
    mostrarTokens(tokens, tokensTableBody);
}

function tokenizarSQL(input) {
    // Expresión regular mejorada para capturar todos los tipos de tokens
    const tokenRegex = /('[^']*')|(-?\d+(\.\d+)?)|([A-Za-z_]\w*)|([<>=!]+)|[()*,;.]|(\S)/g;
    const tokens = [];
    let match;

    while ((match = tokenRegex.exec(input)) !== null) {
        const token = match[0];
        const tipo = determinarTipoToken(token);
        tokens.push({ token, tipo });
    }

    return tokens;
}

function determinarTipoToken(token) {
    // Comprobar si es una cadena (entre comillas)
    if (/^'.*'$/.test(token)) {
        // Verificar si es una fecha
        if (/'\d{4}-\d{2}-\d{2}'/.test(token)) {
            return TOKEN_TYPES.LITERAL.DATE;
        }
        return TOKEN_TYPES.LITERAL.STRING;
    }

    // Comprobar si es un número
    if (/^-?\d+(\.\d+)?$/.test(token)) {
        return TOKEN_TYPES.LITERAL.NUMBER;
    }

    // Comprobar si es una función SQL
    if (SQL_DEFINITIONS.functions.includes(token.toUpperCase())) {
        return TOKEN_TYPES.FUNCTION;
    }

    // Comprobar si es una palabra reservada
    if (SQL_DEFINITIONS.keywords.includes(token.toUpperCase())) {
        return TOKEN_TYPES.KEYWORD;
    }

    // Comprobar si es un operador
    if (SQL_DEFINITIONS.operators.relational.includes(token)) {
        return TOKEN_TYPES.OPERATOR.RELATIONAL;
    }
    if (SQL_DEFINITIONS.operators.logical.includes(token.toUpperCase())) {
        return TOKEN_TYPES.OPERATOR.LOGICAL;
    }
    if (SQL_DEFINITIONS.operators.arithmetic.includes(token)) {
        return TOKEN_TYPES.OPERATOR.ARITHMETIC;
    }

    // Comprobar si es un delimitador
    if (SQL_DEFINITIONS.delimiters.includes(token)) {
        return TOKEN_TYPES.DELIMITER;
    }

    // Comprobar si es un carácter especial
    if (SQL_DEFINITIONS.special.includes(token)) {
        return TOKEN_TYPES.SPECIAL;
    }

    // Comprobar si es un identificador válido
    if (/^[A-Za-z_]\w*$/.test(token)) {
        return TOKEN_TYPES.IDENTIFIER;
    }

    return TOKEN_TYPES.UNKNOWN;
}

function mostrarTokens(tokens, tableBody) {
    tokens.forEach(({token, tipo}) => {
        const row = document.createElement('tr');
        const tokenCell = document.createElement('td');
        const tipoCell = document.createElement('td');
        
        tokenCell.textContent = token;
        tipoCell.textContent = tipo;
        
        // Añadir clases CSS basadas en el tipo de token
        tokenCell.classList.add('token');
        tipoCell.classList.add('tipo');
        row.classList.add(tipo.toLowerCase().replace(/\s+/g, '-'));
        
        row.appendChild(tokenCell);
        row.appendChild(tipoCell);
        tableBody.appendChild(row);
    });
}