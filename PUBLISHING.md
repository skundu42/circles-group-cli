# Publishing Guide for Circles Groups CLI

This guide walks you through the process of publishing the Circles Groups CLI as an npm package.

## Prerequisites

1. **npm account**: You need an npm account to publish packages
2. **Node.js**: Ensure you have Node.js 18+ installed
3. **Git repository**: Your code should be in a Git repository

## Step-by-Step Publishing Process

### 1. Prepare Your Environment

```bash
# Login to npm (if not already logged in)
npm login

# Verify you're logged in
npm whoami
```

### 2. Build the Project

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Verify the build
ls -la dist/src/
```

### 3. Test the Package Locally

```bash
# Test the package locally before publishing
npm pack

# This creates a .tgz file that you can inspect
# The file will be named something like: circles-groups-cli-1.0.0.tgz
```

### 4. Verify Package Contents

```bash
# Extract and inspect the package contents
tar -tzf circles-groups-cli-*.tgz

# You should see:
# - package/
# - package/dist/
# - package/README.md
# - package/LICENSE.md
# - package/package.json
```

### 5. Test Installation Locally

```bash
# Install the package globally from the local file
npm install -g ./circles-groups-cli-*.tgz

# Test the CLI
cg --help

# Uninstall after testing
npm uninstall -g circles-groups-cli
```

### 6. Update Version (if needed)

```bash
# Update version using npm version
npm version patch  # for bug fixes (1.0.0 -> 1.0.1)
npm version minor  # for new features (1.0.0 -> 1.1.0)
npm version major  # for breaking changes (1.0.0 -> 2.0.0)

# Or manually edit package.json
```

### 7. Publish to npm

```bash
# Publish the package
npm publish

# If this is the first time publishing, you might need to:
npm publish --access public
```

### 8. Verify Publication

```bash
# Check if the package is published
npm view circles-groups-cli

# Test installation from npm
npm install -g circles-groups-cli
cg --help
```

## Package Configuration Details

### Files Included in Package

The package includes:

- `dist/` - Compiled JavaScript files
- `README.md` - Documentation
- `LICENSE.md` - License information
- `package.json` - Package metadata

### Files Excluded from Package

The `.npmignore` file excludes:

- Source TypeScript files (`src/`)
- Test files (`tests/`)
- Development configuration files
- Build artifacts and coverage reports
- IDE and OS-specific files

### CLI Configuration

The package is configured as a CLI tool with:

- **Binary name**: `cg`
- **Entry point**: `dist/index.js`
- **Shebang**: `#!/usr/bin/env node` (already present in source)

## Updating the Package

### For Bug Fixes

```bash
npm version patch
npm publish
```

### For New Features

```bash
npm version minor
npm publish
```

### For Breaking Changes

```bash
npm version major
npm publish
```

## Troubleshooting

### Common Issues

1. **"Package name already exists"**
   - Check if the package name is available: `npm search circles-groups-cli`
   - Consider using a scoped package: `@your-username/circles-groups-cli`

2. **"Permission denied"**
   - Ensure you're logged in: `npm whoami`
   - Check if you have publish permissions for the package name

3. **"Invalid package.json"**
   - Validate your package.json: `npm run lint:check`
   - Check for required fields: name, version, main, bin

4. **"CLI not working after installation"**
   - Verify the shebang is present in the built file
   - Rebuild the project: `npm run build` (automatically sets permissions)

### Pre-publish Checklist

- [ ] All tests pass: `npm run test:run`
- [ ] Linting passes: `npm run lint:check`
- [ ] Type checking passes: `npm run type-check`
- [ ] Build is successful: `npm run build`
- [ ] Package contents are correct: `npm pack`
- [ ] CLI works locally: `npm install -g ./circles-groups-cli-*.tgz`
- [ ] Version is updated appropriately
- [ ] README.md is up to date
- [ ] License is included

## Post-Publication

### Update Documentation

1. Update the README.md with installation instructions
2. Add usage examples
3. Include troubleshooting section

### Monitor Usage

```bash
# Check download statistics
npm stats circles-groups-cli

# View package information
npm view circles-groups-cli
```

### Handle Issues

- Monitor GitHub issues for user feedback
- Respond to npm package reviews
- Update the package as needed

## Security Considerations

- Never include sensitive files (wallet.json, .env, etc.)
- Use `.npmignore` to exclude development files
- Keep dependencies updated
- Use `npm audit` to check for vulnerabilities

## Best Practices

1. **Semantic Versioning**: Follow semver for version updates
2. **Documentation**: Keep README.md comprehensive and up-to-date
3. **Testing**: Ensure all tests pass before publishing
4. **Dependencies**: Keep dependencies minimal and up-to-date
5. **Security**: Regularly audit dependencies and exclude sensitive files
