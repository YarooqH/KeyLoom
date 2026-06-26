# KeyLoom CLI

A secure, customizable password generator CLI tool that generates random passwords and automatically copies them to your clipboard.

## Features

- 🔐 **Cryptographically secure** password generation using Node.js crypto module
- 📋 **Automatic clipboard copying** for instant use
- ⚙️ **Highly customizable** with various options and presets
- 🚀 **Easy to use** with simple commands and sensible defaults
- 🎯 **Multiple presets** for different use cases (simple, strong, PIN)
- 🔧 **Flexible character sets** with inclusion/exclusion options

## Installation

### Global Installation

```bash
npm install -g keyloom
```

### Using npx (No Installation Required)

```bash
npx keyloom
```

## Usage

### Basic Usage

Generate a default 16-character password and copy to clipboard:

```bash
keyloom
# or
npx keyloom
```

### Command Options

```bash
keyloom [options] [command]
```

#### Options

- `-l, --length <number>` - Password length (default: 16)
- `--no-lowercase` - Exclude lowercase letters
- `--no-uppercase` - Exclude uppercase letters  
- `--no-numbers` - Exclude numbers
- `--no-symbols` - Exclude symbols (!@#$%^&*()_+-=[]{}|;:,.<>?)
- `-x, --exclude-ambiguous` - Exclude ambiguous characters (il1Lo0O)
- `--no-copy` - Don't copy to clipboard, just display
- `-h, --help` - Display help information
- `-V, --version` - Display version number

### Examples

```bash
# Generate a 12-character password (includes symbols by default)
keyloom -l 12

# Generate a password without symbols
keyloom --no-symbols

# Generate a password without ambiguous characters
keyloom -x

# Generate a password and display it (don't copy to clipboard)
keyloom --no-copy

# Generate a password with only lowercase and numbers
keyloom --no-uppercase --no-symbols
```

### Preset Commands

#### Simple Password
Generate a simple password with letters, numbers, and symbols (no ambiguous characters):

```bash
keyloom simple
keyloom simple -l 10  # Custom length
keyloom simple --no-clipboard  # Don't copy to clipboard
```

#### Strong Password
Generate a strong password with all character types (default: 20 characters):

```bash
keyloom strong
keyloom strong -l 24  # Custom length (default: 20)
keyloom strong --no-clipboard  # Don't copy to clipboard
```

#### PIN Generation
Generate a numeric PIN (default: 6 digits):

```bash
keyloom pin
keyloom pin -l 4   # 4-digit PIN
keyloom pin -l 8   # 8-digit PIN
keyloom pin --no-clipboard  # Don't copy to clipboard
```

## Library Usage

You can also use this package as a library in your Node.js or React/Next.js applications.

### Installation

```bash
npm install keyloom
```

### Basic Usage

```typescript
import { generatePassword } from 'keyloom';

// Generate a default password (16 chars, letters/numbers/symbols)
const password = generatePassword({ length: 16 });
console.log(password);
```

### Advanced Usage

```typescript
import { generatePassword } from 'keyloom';

const password = generatePassword({
  length: 24,
  includeLowercase: true,
  includeUppercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: true // Exclude 'i', 'l', '1', 'L', 'o', '0', 'O'
});
```

It uses `crypto.randomBytes` in Node.js and `window.crypto.getRandomValues` in browsers to ensuring cryptographically secure generation in both environments.

## Character Sets

- **Lowercase**: `abcdefghijklmnopqrstuvwxyz`
- **Uppercase**: `ABCDEFGHIJKLMNOPQRSTUVWXYZ`
- **Numbers**: `0123456789`
- **Symbols**: `!@#$%^&*()_+-=[]{}|;:,.<>?`
- **Ambiguous**: `il1Lo0O` (excluded when using `-x` flag)

## Security

This tool uses Node.js's built-in `crypto.getRandomValues()` function to ensure cryptographically secure random number generation. This makes the generated passwords suitable for security-sensitive applications.

## Requirements

- Node.js 14.0.0 or higher

## Development

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Link for local testing: `npm link`
4. Test the CLI: `keyloom --help`

### Project Structure

```
keyloom/
├── bin/
│   └── passgen.js      # Main CLI script
├── package.json        # Package configuration
└── README.md          # Documentation
```

## License

MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### v1.0.0
- Initial release
- Basic password generation with customizable options
- Clipboard integration
- Preset commands (simple, strong, pin)
- Comprehensive CLI interface