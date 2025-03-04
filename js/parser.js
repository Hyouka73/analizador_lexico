class SyntaxError {
    constructor(message, token, index, line) {
        this.message = message;
        this.token = token;
        this.index = index;
        this.line = line; // Agregar la línea
    }
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0; // Índice del token actual
        this.errors = []; // Almacena los errores encontrados
    }

    parse() {
        const statements = [];
        while (this.current < this.tokens.length) {
            try {
                statements.push(this.statement());
            } catch (error) {
                if (error instanceof SyntaxError) {
                    this.errors.push(error);
                    this.recover(); // Recuperar del error
                } else {
                    throw error; // Lanzar otros errores
                }
            }
        }
        return { statements, errors: this.errors };
    }

    statement() {
        if (this.match('KEYWORD', 'SELECT')) {
            return this.selectStatement();
        }
        throw new SyntaxError(
            "Se esperaba una declaración SQL válida.",
            this.tokens[this.current].token,
            this.current,
            this.tokens[this.current].line // Pasar la línea
        );
    }

    selectStatement() {
        const columns = this.consume('IDENTIFIER', "Se esperaba un identificador de columna.");
        this.consume('KEYWORD', 'FROM');
        const table = this.consume('IDENTIFIER', "Se esperaba un identificador de tabla.");

        let whereClause = null;
        if (this.match('KEYWORD', 'WHERE')) {
            whereClause = this.consume('IDENTIFIER', "Se esperaba una condición.");
        }

        return {
            type: 'SELECT',
            columns,
            table,
            where: whereClause
        };
    }

    consume(type, message) {
        if (this.check(type)) {
            return this.tokens[this.current++].token;
        }
        throw new SyntaxError(message, this.tokens[this.current], this.current);
    }

    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.current++;
                return true;
            }
        }
        return false;
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.tokens[this.current].tipo === type;
    }

    isAtEnd() {
        return this.current >= this.tokens.length;
    }

    recover() {
        while (!this.isAtEnd()) {
            if (this.match('KEYWORD', 'SELECT')) return;
            this.current++;
        }
    }
}

export function parse(tokens) {
    const parser = new Parser(tokens);
    return parser.parse();
}