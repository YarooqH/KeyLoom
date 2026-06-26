#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const clipboardy_1 = __importDefault(require("clipboardy"));
const index_1 = require("./index");
const program = new commander_1.Command();
/**
 * Copy text to clipboard and show success message
 * @param text - Text to copy
 */
async function copyToClipboard(text) {
    try {
        await clipboardy_1.default.write(text);
        console.log('Generated password:', text);
        console.log('✅ Password copied to clipboard!');
    }
    catch (error) {
        console.error('❌ Failed to copy to clipboard:', error.message);
        console.log('Generated password:', text);
    }
}
/**
 * Validate and parse length parameter
 * @param lengthStr - Length as string
 * @returns Parsed length number
 */
function parseLength(lengthStr) {
    const length = parseInt(lengthStr);
    if (isNaN(length) || length < 1) {
        console.error('❌ Length must be a positive number');
        process.exit(1);
    }
    if (length > 256) {
        console.error('❌ Length cannot exceed 256 characters');
        process.exit(1);
    }
    return length;
}
/**
 * Handle password generation and output
 * @param options - Command options
 * @param passwordOptions - Password generation options
 */
async function handlePasswordGeneration(options, passwordOptions) {
    try {
        const length = parseLength(options.length);
        const password = (0, index_1.generatePassword)({
            length,
            includeLowercase: options.lowercase,
            includeUppercase: options.uppercase,
            includeNumbers: options.numbers,
            includeSymbols: options.symbols,
            excludeAmbiguous: options.excludeAmbiguous,
            ...passwordOptions
        });
        if (options.copy) {
            await copyToClipboard(password);
        }
        else {
            console.log('Generated password:', password);
        }
    }
    catch (error) {
        console.error('❌ Error generating password:', error.message);
        process.exit(1);
    }
}
// Configure CLI program
program
    .name('keyloom')
    .description('Generate secure random passwords and copy them to clipboard')
    .version('1.0.0');
// Default command (no subcommand)
program
    .option('-l, --length <number>', 'password length', '16')
    .option('--no-lowercase', 'exclude lowercase letters')
    .option('--no-uppercase', 'exclude uppercase letters')
    .option('--no-numbers', 'exclude numbers')
    .option('--no-symbols', 'exclude symbols')
    .option('-x, --exclude-ambiguous', 'exclude ambiguous characters (il1Lo0O)')
    .option('--no-copy', 'do not copy to clipboard, just display')
    .action(async (options) => {
    await handlePasswordGeneration(options, {});
});
// Preset commands for common use cases
program
    .command('simple')
    .description('Generate a simple password with letters, numbers, and symbols')
    .option('-l, --length <number>', 'password length', '12')
    .option('--no-clipboard', 'do not copy to clipboard, just display')
    .action(async (options) => {
    const commandOptions = {
        length: options.length,
        copy: options.clipboard,
        lowercase: true,
        uppercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: true
    };
    await handlePasswordGeneration(commandOptions, {
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: true
    });
});
program
    .command('strong')
    .description('Generate a strong password with all character types')
    .option('-l, --length <number>', 'password length', '20')
    .option('--no-clipboard', 'do not copy to clipboard, just display')
    .action(async (options) => {
    const commandOptions = {
        length: options.length,
        copy: options.clipboard,
        lowercase: true,
        uppercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: false
    };
    await handlePasswordGeneration(commandOptions, {
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false
    });
});
program
    .command('pin')
    .description('Generate a numeric PIN')
    .option('-l, --length <number>', 'PIN length', '6')
    .option('--no-clipboard', 'do not copy to clipboard, just display')
    .action(async (options) => {
    const commandOptions = {
        length: options.length,
        copy: options.clipboard,
        lowercase: false,
        uppercase: false,
        numbers: true,
        symbols: false,
        excludeAmbiguous: false
    };
    await handlePasswordGeneration(commandOptions, {
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: true,
        includeSymbols: false,
        excludeAmbiguous: false
    });
});
// Parse command line arguments
program.parse();
//# sourceMappingURL=passgen.js.map