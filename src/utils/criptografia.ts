import bcrypt from 'bcrypt';

class CriptografiaService {
    private saltRounds: number;

    constructor() {
        this.saltRounds = 10;
    }

    async criptografarSenha(senha: string): Promise<string> {
        return await bcrypt.hash(senha, this.saltRounds);
    }

    async verificarSenha(senha: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(senha, hash);
    }
}

export default new CriptografiaService();
