# Testing and Code Quality Setup

This document describes the comprehensive testing and linting setup for the Circles Groups CLI application.

## Overview

The project includes:

- **Comprehensive Smoke Tests**: End-to-end CLI testing
- **Unit Tests**: Individual component testing
- **ESLint**: Code quality and style checking
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit linting
- **Vitest**: Modern testing framework with coverage

## Testing Framework

### Vitest Configuration

The project uses Vitest for testing with the following features:

- TypeScript support out of the box
- Coverage reporting with c8
- Node.js environment simulation
- 30-second timeout for CLI operations

**Configuration file:** `vitest.config.ts`

### Test Structure

```
tests/
├── smoke/           # End-to-end CLI smoke tests
│   ├── cli.test.ts         # Basic CLI functionality
│   ├── commands.test.ts    # Individual command testing
│   └── integration.test.ts # Full integration tests
└── unit/            # Unit tests
    └── utils.test.ts       # Utility function tests
```

## Smoke Tests

### CLI Application Tests (`tests/smoke/cli.test.ts`)

- ✅ Help display functionality
- ✅ Version information
- ✅ Error handling for unknown commands
- ✅ Command listing validation
- ✅ Binary existence and executability

### Command Tests (`tests/smoke/commands.test.ts`)

Tests all CLI commands:

- `setup` - Wallet configuration
- `deploy-group` - Standard group deployment
- `deploy-base-group` - Base group deployment
- `add-member` / `remove-member` - Member management
- `group-info` / `list-members` / `list-groups` - Information retrieval
- `balance` / `transfer` - Token operations
- `set-condition` / `list-conditions` - Base group conditions
- `trust-batch` - Batch trust operations
- `set-owner` / `set-service` / `set-fee-collection` - Group administration
- `register-name` - Name registration

### Integration Tests (`tests/smoke/integration.test.ts`)

- ✅ Package integrity validation
- ✅ Build artifact verification
- ✅ CLI execution environment testing
- ✅ Configuration handling
- ✅ Command completeness validation

## Code Quality

### ESLint Configuration

**File:** `eslint.config.js`

Features:

- TypeScript support with `@typescript-eslint`
- Prettier integration
- Node.js globals configuration
- Security rules (no-eval, no-script-url, etc.)
- Code quality rules (complexity, max-lines, etc.)
- Relaxed rules for CLI applications

**Key Rules:**

- No unused variables (with underscore exception)
- Prefer const over let
- Security-focused restrictions
- Complexity limits (max 15)
- Function length limits (max 80 lines)
- Test file rule exemptions

### Prettier Configuration

**File:** `.prettierrc`

Settings:

- Single quotes
- Semicolons enabled
- 120 character line width
- 2-space indentation
- Trailing commas (ES5 compatible)

### Pre-commit Hooks

**Husky Configuration:** `.husky/pre-commit`
**Lint-staged Configuration:** `.lintstagedrc.json`

Automatically runs on commit:

- ESLint with auto-fix
- Prettier formatting
- TypeScript files (.ts, .tsx)
- JSON/Markdown formatting

## Available Scripts

### Testing Scripts

```bash
npm run test              # Run all tests in watch mode
npm run test:ui           # Run tests with UI interface
npm run test:run          # Run all tests once
npm run test:smoke        # Run only smoke tests
npm run test:unit         # Run only unit tests
npm run test:coverage     # Run tests with coverage report
```

### Linting Scripts

```bash
npm run lint              # Run ESLint with auto-fix
npm run lint:check        # Run ESLint without fixing
npm run format            # Format code with Prettier
npm run format:check      # Check code formatting
npm run type-check        # Run TypeScript type checking
```

### CI Script

```bash
npm run ci                # Full CI pipeline: lint, format, type-check, test
```

## Coverage Requirements

The Vitest configuration includes coverage thresholds:

- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%
- **Statements:** 80%

Coverage excludes:

- `node_modules/`
- `dist/`
- `tests/`
- Declaration files (`.d.ts`)
- Configuration files
- Entry point (`index.ts`)

## Usage Examples

### Running Smoke Tests

```bash
# Run all smoke tests
npm run test:smoke

# Run specific test file
npx vitest tests/smoke/cli.test.ts

# Run with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Fix linting issues automatically
npm run lint

# Check code formatting
npm run format:check

# Run full code quality check
npm run ci
```

### Git Workflow

The pre-commit hook automatically runs when committing:

```bash
git add .
git commit -m "feature: add new command"
# -> Automatically runs lint-staged
# -> Formats and lints staged files
# -> Commits only if all checks pass
```

## Test Coverage Areas

### ✅ Currently Tested

- CLI help and version display
- Command existence and help text
- Required option validation
- Error handling for missing parameters
- Package integrity
- Build artifact validation
- Basic command structure

### 🔄 Areas for Expansion

- Configuration file handling
- Network operation mocking
- Blockchain interaction simulation
- Complex command workflows
- Error recovery scenarios

## Configuration Files Summary

| File                 | Purpose                          |
| -------------------- | -------------------------------- |
| `vitest.config.ts`   | Test runner configuration        |
| `eslint.config.js`   | Code linting rules               |
| `.prettierrc`        | Code formatting rules            |
| `.prettierignore`    | Prettier ignore patterns         |
| `.lintstagedrc.json` | Pre-commit linting configuration |
| `.husky/pre-commit`  | Git pre-commit hook              |

## Troubleshooting

### Common Issues

**ESLint errors with TypeScript:**

- Ensure `tsconfig.json` is properly configured
- Check that all TypeScript rules are compatible

**Tests failing with CLI execution:**

- Verify the CLI is built: `npm run build`
- Check file permissions on the CLI binary
- Ensure Node.js version compatibility

**Pre-commit hooks not running:**

- Reinstall Husky: `npx husky install`
- Check git hooks: `ls -la .git/hooks/`

### Performance Tips

- Use `npm run test:smoke` for quick validation
- Use `--reporter=dot` for minimal test output
- Run `npm run lint:check` before committing large changes

## Next Steps

1. **Expand Unit Tests**: Add comprehensive unit tests for utility functions
2. **Mock Network Calls**: Implement proper mocking for blockchain interactions
3. **End-to-End Workflows**: Create tests for complete user workflows
4. **Performance Testing**: Add tests for CLI performance and response times
5. **Integration with CI/CD**: Configure automated testing in deployment pipeline
