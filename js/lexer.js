// Definición de tipos de tokens más completa
const TOKEN_TYPES = {
    KEYWORD: 'Palabra Reservada',
    IDENTIFIER: 'Identificador',
    OPERATOR: {
        RELATIONAL: 'Operador Relacional',
        LOGICAL: 'Operador Lógico',
        ARITHMETIC: 'Operador Aritmético',
        BITWISE: 'Operador Bitwise'
    },
    DELIMITER: 'Delimitador',
    LITERAL: {
        NUMBER: 'Literal Numérico',
        STRING: 'Literal Cadena',
        DATE: 'Literal Fecha',
        BOOLEAN: 'Literal Booleano',
        NULL: 'Literal Null'
    },
    FUNCTION: 'Función SQL',
    SPECIAL: 'Carácter Especial',
    COMMENT: 'Comentario',
    UNKNOWN: 'Desconocido'
};

// Definiciones SQL más completas
const SQL_DEFINITIONS = {
    keywords: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'SET',
        'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON',
        'AND', 'OR', 'NOT', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC',
        'LIMIT', 'OFFSET', 'AS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL',
        'CREATE', 'TABLE', 'VIEW', 'INDEX', 'DROP', 'ALTER', 'TRUNCATE',
        'WITH', 'UNION', 'INTERSECT', 'EXCEPT', 'ALL', 'DISTINCT', 'CASE',
        'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS', 'VALUES', 'PRIMARY', 'KEY',
        'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'UNIQUE', 'CHECK', 'DEFAULT'
    ],
    functions: [
        'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'ROUND', 'UPPER', 'LOWER',
        'CONCAT', 'SUBSTRING', 'LENGTH', 'TRIM', 'LTRIM', 'RTRIM',
        'DATE', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
        'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'CAST', 'COALESCE', 'NULLIF',
        'ABS', 'CEIL', 'FLOOR', 'MOD', 'POWER', 'EXP', 'LN', 'LOG'
    ],
    operators: {
        relational: ['=', '>', '<', '>=', '<=', '!=', '<>', '!<', '!>', 'LIKE', 'IN', 'IS'],
        logical: ['AND', 'OR', 'NOT'],
        arithmetic: ['+', '-', '*', '/', '%'],
        bitwise: ['&', '|', '^', '~', '<<', '>>']
    },
    delimiters: ['(', ')', ',', ';', '.', '[', ']'],
    special: ['*', '@', '#']
};

// Cache para palabras clave y funciones en mayúsculas
const KEYWORD_SET = new Set(SQL_DEFINITIONS.keywords.map(k => k.toUpperCase()));
const FUNCTION_SET = new Set(SQL_DEFINITIONS.functions.map(f => f.toUpperCase()));

export function tokenizarSQL(input) {
    const tokens = [];
    let i = 0;
    const length = input.length;

    // Manejo de espacios y saltos de línea
    let lineNumber = 1;
    let column = 1;

    while (i < length) {
        let char = input[i];

        // Saltar espacios en blanco
        if (/\s/.test(char)) {
            if (char === '\n') {
                lineNumber++;
                column = 1;
            } else {
                column++;
            }
            i++;
            continue;
        }

        // Comentarios de una línea
        if (char === '-' && i + 1 < length && input[i + 1] === '-') {
            const commentEnd = input.indexOf('\n', i) || length;
            const token = input.substring(i, commentEnd);
            tokens.push({ token, tipo: TOKEN_TYPES.COMMENT, line: lineNumber, column });
            i = commentEnd;
            lineNumber++;
            column = 1;
            continue;
        }

        // Comentarios multilínea
        if (char === '/' && i + 1 < length && input[i + 1] === '*') {
            const commentEnd = input.indexOf('*/', i + 2);
            if (commentEnd === -1) throw new Error(`Comentario sin cerrar en línea ${lineNumber}`);
            const token = input.substring(i, commentEnd + 2);
            const linesInComment = token.split('\n').length - 1;
            tokens.push({ token, tipo: TOKEN_TYPES.COMMENT, line: lineNumber, column });
            lineNumber += linesInComment;
            i = commentEnd + 2;
            column = 1;
            continue;
        }

        // Strings
        if (char === "'" || char === '"') {
            const quote = char;
            let j = i + 1;
            while (j < length && input[j] !== quote) {
                if (input[j] === '\n') lineNumber++;
                j++;
            }
            if (j >= length) throw new Error(`String sin cerrar en línea ${lineNumber}`);
            const token = input.substring(i, j + 1);
            tokens.push({ 
                token, 
                tipo: determinarTipoLiteral(token), 
                line: lineNumber, 
                column 
            });
            column += token.length;
            i = j + 1;
            continue;
        }

        // Números y palabras
        if (/[A-Za-z0-9_.-]/.test(char)) {
            let j = i + 1;
            while (j < length && /[A-Za-z0-9_.-]/.test(input[j])) j++;
            const token = input.substring(i, j);
            tokens.push({ 
                token, 
                tipo: determinarTipoToken(token), 
                line: lineNumber, 
                column 
            });
            column += token.length;
            i = j;
            continue;
        }

        // Operadores y delimitadores
        let token = char;
        if (i + 1 < length && />|<|=|!/.test(char)) {
            const nextTwo = char + input[i + 1];
            if (SQL_DEFINITIONS.operators.relational.includes(nextTwo)) {
                token = nextTwo;
                i++;
            }
        }

        tokens.push({ 
            token, 
            tipo: determinarTipoToken(token), 
            line: lineNumber, 
            column 
        });
        column++;
        i++;
    }

    return tokens;
}

function determinarTipoLiteral(token) {
    const content = token.slice(1, -1);
    if (/\d{4}-\d{2}-\d{2}/.test(content)) return TOKEN_TYPES.LITERAL.DATE;
    if (/^-?\d+(\.\d+)?$/.test(content)) return TOKEN_TYPES.LITERAL.NUMBER;
    return TOKEN_TYPES.LITERAL.STRING;
}

function determinarTipoToken(token) {
    // Literales especiales
    const upperToken = token.toUpperCase();
    if (upperToken === 'TRUE' || upperToken === 'FALSE') return TOKEN_TYPES.LITERAL.BOOLEAN;
    if (upperToken === 'NULL') return TOKEN_TYPES.LITERAL.NULL;

    // Funciones y palabras clave
    if (FUNCTION_SET.has(upperToken)) return TOKEN_TYPES.FUNCTION;
    if (KEYWORD_SET.has(upperToken)) return TOKEN_TYPES.KEYWORD;

    // Operadores
    if (SQL_DEFINITIONS.operators.relational.includes(token)) return TOKEN_TYPES.OPERATOR.RELATIONAL;
    if (SQL_DEFINITIONS.operators.logical.includes(upperToken)) return TOKEN_TYPES.OPERATOR.LOGICAL;
    if (SQL_DEFINITIONS.operators.arithmetic.includes(token)) return TOKEN_TYPES.OPERATOR.ARITHMETIC;
    if (SQL_DEFINITIONS.operators.bitwise.includes(token)) return TOKEN_TYPES.OPERATOR.BITWISE;

    // Delimitadores y especiales
    if (SQL_DEFINITIONS.delimiters.includes(token)) return TOKEN_TYPES.DELIMITER;
    if (SQL_DEFINITIONS.special.includes(token)) return TOKEN_TYPES.SPECIAL;

    // Identificadores
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) return TOKEN_TYPES.IDENTIFIER;

    // Números
    if (/^-?\d+(\.\d+)?$/.test(token)) return TOKEN_TYPES.LITERAL.NUMBER;

    return TOKEN_TYPES.UNKNOWN;
}

// Ejemplo de uso
/*
const sql = `
    SELECT nombre, COUNT(*) as total
    FROM usuarios
    WHERE edad > 18 AND fecha_registro >= '2023-01-01'
    GROUP BY nombre
    ORDER BY total DESC
    LIMIT 10;
`;
*/