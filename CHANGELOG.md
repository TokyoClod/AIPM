# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-10

### Added

#### Core Features
- Project management with CRUD operations
- Multi-level task hierarchy (parent-child tasks)
- Task status and progress tracking
- Task assignment and comments
- Three view modes (List/Kanban/Gantt)
- Risk management with level assessment
- Dashboard with statistics and charts

#### AI Features
- AI assistant with OpenAI/Claude/Ollama support
- Quick input with Cmd+K shortcut
- Voice input with Web Speech API
- AI-powered content parsing
- Intelligent task creation from natural language
- AI risk analysis and suggestions
- Automatic report generation (weekly/monthly)

#### User Interface
- Modern responsive design with Tailwind CSS
- Dark theme support
- Smooth animations with Framer Motion
- Mobile-friendly layout
- Real-time notifications

#### Security
- JWT-based authentication
- RBAC permission system (admin/manager/leader/member)
- Password encryption with bcrypt
- API rate limiting

#### Testing
- Backend unit and integration tests (145 test cases)
- Frontend component tests (147 test cases)
- E2E tests with Playwright (76 test cases)
- Test coverage target: 80%

### Technical Details
- Frontend: React 18 + TypeScript + Ant Design 5
- Backend: Node.js 18 + Express + TypeScript
- AI Integration: OpenAI API / Claude API / Ollama
- Data Storage: JSON files (dev) / PostgreSQL (prod)

---

## [0.1.0] - 2026-03-01

### Added
- Initial project setup
- Basic project structure
- Authentication system
- Basic CRUD operations
