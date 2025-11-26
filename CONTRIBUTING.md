# Contributing to AllyLab

Thank you for your interest in contributing to AllyLab! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**
```bash
   git clone https://github.com/YOUR_USERNAME/allylab.git
   cd allylab
```

3. **Install dependencies**
```bash
   npm install
   npx playwright install chromium
```

4. **Start development servers**
```bash
   npm run dev
```

## 📁 Project Structure
```
packages/
├── api/          # Backend (Fastify + Playwright)
└── dashboard/    # Frontend (React + TypeScript)
```

## 🔧 Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring

Example: `feature/add-pdf-export`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add PDF export for executive dashboard
fix: resolve scanning timeout on slow sites
docs: update API documentation
refactor: extract findings table components
```

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Run `npm run lint` before committing
- **Formatting** - Consistent indentation (2 spaces)

## 🧪 Testing
```bash
# Lint all packages
npm run lint

# Type check
npm run typecheck

# Build
npm run build
```

## 📝 Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** with clear commits
3. **Update documentation** if needed
4. **Run linting** and fix any issues
5. **Open a PR** with a clear description

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring

## Testing
How did you test these changes?

## Screenshots (if applicable)
```

## 🐛 Reporting Issues

### Bug Reports

Include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment (OS, Node version, browser)

### Feature Requests

Include:
- Clear description of the feature
- Use case / problem it solves
- Possible implementation approach

## 💡 Areas for Contribution

### Good First Issues
- Documentation improvements
- UI polish and accessibility
- Additional WCAG rule coverage
- Test coverage

### Feature Ideas
- Additional CI/CD platform support
- Email notifications for scheduled scans
- Team collaboration features
- Additional export formats

## 📜 Code of Conduct

Be respectful and inclusive. We're all here to make the web more accessible.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Questions? Open an issue or reach out to the maintainers.