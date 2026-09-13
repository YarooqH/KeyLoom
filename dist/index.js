"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAR_SETS = void 0;
exports.generatePassword = generatePassword;
// Character sets for password generation
exports.CHAR_SETS = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    ambiguous: 'il1Lo0O'
};
/**
 * Generate secure random bytes works in Node and Browser
 * @param length number of bytes
 * @returns Uint8Array of random bytes
 */
function getSecureRandomBytes(length) {
    // Check for Node.js environment
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // Hide require from bundlers
        const crypto = eval("require('crypto')");
        return new Uint8Array(crypto.randomBytes(length));
    }
    // Check for Browser environment
    if (typeof window !== 'undefined' && window.crypto) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return array;
    }
    // Fallback or Error
    throw new Error('Secure random number generator not available in this environment');
}
/**
 * Generate a secure random password
 * @param options - Password generation options
 * @returns Generated password
 */
function generatePassword(options) {
    const { length, includeLowercase = true, includeUppercase = true, includeNumbers = true, includeSymbols = false, excludeAmbiguous = false } = options;
    let charset = '';
    if (includeLowercase)
        charset += exports.CHAR_SETS.lowercase;
    if (includeUppercase)
        charset += exports.CHAR_SETS.uppercase;
    if (includeNumbers)
        charset += exports.CHAR_SETS.numbers;
    if (includeSymbols)
        charset += exports.CHAR_SETS.symbols;
    // Note: logic slightly adjusted to be efficient
    if (excludeAmbiguous) {
        // We filter out ambiguous chars from the charset string construction if possible,
        // or just remove them after the fact. The original code did replace.
        // Let's stick to the original logic for consistency.
        for (const char of exports.CHAR_SETS.ambiguous) {
            // split/join is often faster/cleaner than regex for single chars, but regex is fine
            charset = charset.split(char).join('');
        }
    }
    if (charset.length === 0) {
        throw new Error('No character sets selected for password generation');
    }
    let password = '';
    const array = getSecureRandomBytes(length);
    for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length];
    }
    return password;
}
//# sourceMappingURL=index.js.map