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
        this.tokens = tokens;
        this.current = 0;
        this.errors = [];
    }

    parse() {
        const statements = [];
        while (!this.isAtEnd()) {
            try {
                statements.push(this.statement());
                this.match('Delimitador', ';');
            } catch (error) {
                if (error instanceof SyntaxError) {
                    this.errors.push(error);
                    this.recover();
                } else {
                    throw error;
                }
            }
        }
        return { 
            statements, 
            errors: this.errors 
        };
    }

    statement() {
        if (this.isAtEnd()) throw this.error("Declaración incompleta");

        let statement;
        if (this.match('Palabra Reservada', 'SELECT')) {
            statement = this.selectStatement();
        }
        else if (this.match('Palabra Reservada', 'INSERT')) {
            statement = this.insertStatement();
        }
        else if (this.match('Palabra Reservada', 'UPDATE')) {
            statement = this.updateStatement();
        }
        else if (this.match('Palabra Reservada', 'DELETE')) {
            statement = this.deleteStatement();
        }
        else {
            throw this.error("Se esperaba una declaración SQL válida (SELECT, INSERT, UPDATE, DELETE)");
        }

        this.match('Delimitador', ';');
        return statement;
    }

    selectStatement() {
        const columns = this.validateColumns();
        this.consume('Palabra Reservada', 'FROM', "Se esperaba FROM después de SELECT");
        const table = this.validateTable();
        const where = this.optionalWhereClause();
        return { 
            type: 'SELECT',
            columns,
            from: table,
            where 
        };
    }

    insertStatement() {
        this.consume('Palabra Reservada', 'INTO', "Se esperaba INTO después de INSERT");
        const table = this.validateTable();
        const columns = this.validateColumnList();
        this.consume('Palabra Reservada', 'VALUES', "Se esperaba VALUES después de la lista de columnas");
        const values = this.validateValueList();
        return { 
            type: 'INSERT',
            into: table,
            columns,
            values 
        };
    }

    updateStatement() {
        const table = this.validateTable();
        this.consume('Palabra Reservada', 'SET', "Se esperaba SET después de UPDATE");
        const assignments = this.validateAssignments();
        const where = this.optionalWhereClause();
        return { 
            type: 'UPDATE',
            table,
            set: assignments,
            where 
        };
    }

    deleteStatement() {
        this.consume('Palabra Reservada', 'FROM', "Se esperaba FROM después de DELETE");
        const table = this.validateTable();
        const where = this.optionalWhereClause();
        return { 
            type: 'DELETE',
            from: table,
            where 
        };
    }

    validateColumns() {
        const columns = [];
        if (this.match('Carácter Especial', '*')) {
            columns.push('*');
        } else {
            do {
                columns.push(this.consume('Identificador', null, "Se esperaba nombre de columna").token);
            } while (this.match('Delimitador', ','));
        }
        return columns;
    }

    validateTable() {
        return this.consume('Identificador', null, "Se esperaba nombre de tabla").token;
    }

    validateColumnList() {
        const columns = [];
        if (this.match('Delimitador', '(')) {
            do {
                columns.push(this.consume('Identificador', null, "Se esperaba nombre de columna").token);
            } while (this.match('Delimitador', ','));
            this.consume('Delimitador', ')', "Se esperaba ')' para cerrar la lista de columnas");
        }
        return columns;
    }

    validateValueList() {
        const values = [];
        this.consume('Delimitador', '(', "Se esperaba '(' para iniciar los valores");
        do {
            values.push(this.consumeLiteral().token);
        } while (this.match('Delimitador', ','));
        this.consume('Delimitador', ')', "Se esperaba ')' para cerrar los valores");
        return values;
    }

    validateAssignments() {
        const assignments = [];
        do {
            const column = this.consume('Identificador', null, "Se esperaba nombre de columna").token;
            this.consume('Operador Relacional', '=', "Se esperaba '=' en la asignación");
            const value = this.consumeLiteral().token;
            assignments.push({ column, value });
        } while (this.match('Delimitador', ','));
        return assignments;
    }

    optionalWhereClause() {
        if (this.match('Palabra Reservada', 'WHERE')) {
            return this.validateCondition();
        }
        return null;
    }

    validateCondition() {
        const left = this.consume('Identificador', null, "Se esperaba identificador en la condición").token;
        const operator = this.consumeOperator().token;
        const right = this.consumeLiteralOrIdentifier().token;
        return { left, operator, right };
    }

    consumeLiteral() {
        if (this.check('Literal Numérico') || 
            this.check('Literal Cadena') || 
            this.check('Literal Fecha') || 
            this.check('Literal Booleano')) {
            return this.advance();
        }
        throw this.error("Se esperaba un valor literal");
    }

    consumeLiteralOrIdentifier() {
        try {
            return this.consumeLiteral();
        } catch {
            return this.consume('Identificador', null, "Se esperaba identificador o valor literal");
        }
    }

    consumeOperator() {
        if (this.check('Operador Relacional') || 
            this.check('Operador Lógico')) {
            return this.advance();
        }
        throw this.error("Se esperaba un operador válido (=, >, <, etc.)");
    }

    error(message) {
        const token = this.tokens[this.current] || { token: 'EOF', line: -1, column: -1 };
        return new SyntaxError(
            `${message} en "${token.token}" (línea ${token.line}, posición ${token.column})`,
            token.token,
            this.current,
            token.line,
            token.column
        );
    }

    consume(expectedType, expectedValue = null, errorMessage) {
        if (this.check(expectedType, expectedValue)) {
            return this.advance();
        }
        
        const token = this.tokens[this.current] || { token: 'EOF', line: -1, column: -1 };
        const message = errorMessage || `Se esperaba ${expectedType}${expectedValue ? ` '${expectedValue}'` : ''}`;
        throw new SyntaxError(
            message,
            token.token,
            this.current,
            token.line,
            token.column
        );
    }

    match(expectedType, expectedValue = null) {
        if (this.check(expectedType, expectedValue)) {
            this.current++;
            return true;
        }
        return false;
    }

    check(expectedType, expectedValue = null) {
        if (this.isAtEnd()) return false;
        const token = this.tokens[this.current];
        
        const typeMatches = () => {
            if (expectedType === 'LITERAL') return token.tipo.startsWith('Literal ');
            if (expectedType === 'OPERATOR') return token.tipo.startsWith('Operador ');
            return token.tipo === expectedType;
        };
        
        const valueMatches = () => {
            if (!expectedValue) return true;
            return token.token.toUpperCase() === expectedValue.toUpperCase();
        };
        
        return typeMatches() && valueMatches();
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.tokens[this.current - 1];
    }

    isAtEnd() {
        return this.current >= this.tokens.length;
    }

    recover() {
        while (!this.isAtEnd()) {
            if (this.match('Delimitador', ';')) return;
            this.advance();
        }
    }
}

export function parseSQL(tokens) {
    const parser = new SQLParser(tokens);
    return parser.parse();
}