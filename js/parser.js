class SyntaxError {
    constructor(message, token, index, line, column) {
        this.message = message;
        this.token = token;
        this.index = index;
        this.line = line;
        this.column = column;
    }
}

class SQLParser {
    constructor(tokens) {
        this.tokens = tokens.map(t => ({ 
            ...t, 
            token: t.token.toLowerCase() 
        }));
        this.currentTokenIndex = 0;
    }

    peek() {
        return this.tokens[this.currentTokenIndex]?.token;
    }

    consume() {
        return this.tokens[this.currentTokenIndex++]?.token;
    }

    currentTokenInfo() {
        return this.tokens[this.currentTokenIndex];
    }

    expect(expected) {
        const currentToken = this.tokens[this.currentTokenIndex];
        if (!currentToken) {
            throw new SyntaxError(
                `Se esperaba '${expected}' pero no hay más tokens`,
                null,
                this.currentTokenIndex,
                -1,
                -1
            );
        }
        if (currentToken.token !== expected) {
            throw new SyntaxError(
                `Error de sintaxis: Se esperaba '${expected}' pero se encontró '${currentToken.token}'`,
                currentToken.token,
                this.currentTokenIndex,
                currentToken.line,
                currentToken.column
            );
        }
        this.currentTokenIndex++;
    }

    parseStatement() {
        const token = this.peek();
        switch (token) {
            case 'select':
                return this.parseSelect();
            case 'delete':
                return this.parseDelete();
            case 'insert':
                return this.parseInsert();
            case 'update':
                return this.parseUpdate();
            default:
                throw new SyntaxError(
                    `Comando no reconocido: ${token}`,
                    token,
                    this.currentTokenIndex,
                    this.tokens[this.currentTokenIndex]?.line,
                    this.tokens[this.currentTokenIndex]?.column
                );
        }
    }
    // Nueva función para manejar SELECT
    parseSelect() {
        this.expect('select');
        
        const columns = [];
        while (this.peek() !== 'from') {
            const columnToken = this.tokens[this.currentTokenIndex];
            columns.push({
                value: this.consume(),
                line: columnToken.line,
                column: columnToken.column
            });
            
            if (this.peek() === ',') this.expect(',');
        }
        
        this.expect('from');
        
        const tableToken = this.tokens[this.currentTokenIndex];
        const table = this.consume();
        
        let whereClause = null;
        if (this.peek() === 'where') {
            this.expect('where');
            whereClause = this.parseCondition();
        }
        
        this.expect(';');
        
        return { 
            type: 'select', 
            columns,
            table: { value: table, line: tableToken.line, column: tableToken.column },
            whereClause 
        };
    }

    // DELETE corregido (sintaxis estándar SQL)
    parseDelete() {
        this.expect('delete');
        this.expect('from'); // Ahora se espera 'FROM' después de 'DELETE'
        
        const tableToken = this.tokens[this.currentTokenIndex];
        const table = this.consume();
        
        let whereClause = null;
        if (this.peek() === 'where') {
            this.expect('where');
            whereClause = this.parseCondition(); // Soporta cualquier operador
        }
        
        this.expect(';');
        
        return { 
            type: 'delete', 
            table: { value: table, line: tableToken.line, column: tableToken.column },
            whereClause 
        };
    }

    // INSERT (sin cambios desde la versión anterior)
    parseInsert() {
        this.expect('insert');
        this.expect('into');
        
        const tableToken = this.tokens[this.currentTokenIndex];
        const table = this.consume();
        
        this.expect('values');
        this.expect('(');
        
        const values = [];
        while (this.peek() !== ')') {
            const valueToken = this.tokens[this.currentTokenIndex];
            values.push({
                value: this.consume(),
                line: valueToken.line,
                column: valueToken.column
            });
            
            if (this.peek() === ',') this.expect(',');
        }
        
        this.expect(')');
        this.expect(';');
        
        return { 
            type: 'insert', 
            table: { value: table, line: tableToken.line, column: tableToken.column },
            values 
        };
    }

    // UPDATE (mejorado para usar parseCondition)
    parseUpdate() {
        this.expect('update');
        const tableToken = this.tokens[this.currentTokenIndex];
        const table = this.consume();
        
        this.expect('set');
        const assignments = [];
        
        while (this.peek() !== 'where' && this.peek() !== ';') {
            const columnToken = this.tokens[this.currentTokenIndex];
            const column = this.consume();
            
            this.expect('=');
            
            const valueToken = this.tokens[this.currentTokenIndex];
            const value = this.consume();
            
            assignments.push({
                column: { value: column, line: columnToken.line, column: columnToken.column },
                value: { value, line: valueToken.line, column: valueToken.column }
            });
            
            if (this.peek() === ',') this.expect(',');
        }
        
        let whereClause = null;
        if (this.peek() === 'where') {
            this.expect('where');
            whereClause = this.parseCondition(); // Reutilizamos parseCondition
        }
        
        this.expect(';');
        
        return { 
            type: 'update', 
            table: { value: table, line: tableToken.line, column: tableToken.column },
            assignments,
            whereClause 
        };
    }

    // Nueva función para manejar condiciones (ej: id = 1, precio > 5000)
    parseCondition() {
        const columnToken = this.tokens[this.currentTokenIndex];
        const column = this.consume();
        
        const operatorToken = this.tokens[this.currentTokenIndex];
        const operator = this.consume(); // Captura cualquier operador (=, >, <, etc.)
        
        const valueToken = this.tokens[this.currentTokenIndex];
        const value = this.consume();
        
        return {
            column: { value: column, line: columnToken.line, column: columnToken.column },
            operator: { value: operator, line: operatorToken.line, column: operatorToken.column },
            value: { value, line: valueToken.line, column: valueToken.column }
        };
    }

    
}

export function parseSQL(tokens) {
    try {
        const parser = new SQLParser(tokens);
        const statements = parser.parseStatement();
        return { statements, errors: [] };
    } catch (error) {
        return { statements: null, errors: [error] };
    }
}