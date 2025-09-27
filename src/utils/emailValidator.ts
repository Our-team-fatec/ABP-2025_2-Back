class EmailValidator {
    private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    public validar(email: string): boolean {
        return this.emailRegex.test(email);
    }
}

export default new EmailValidator();
