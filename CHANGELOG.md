# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-03-10

### Added

#### Personal Workbench
- Personal workbench page with todo aggregation
- Today's schedule card with task deadlines
- Efficiency statistics (weekly completions, on-time rate, avg response time)
- Quick action shortcuts for common operations

#### Team Collaboration Board
- Real-time team member status display
- Task load visualization with progress bars
- Overload warning indicators (red border for ≥90% load)
- Online status indicators
- Team messaging functionality

#### Smart Reminder System
- Deadline reminders (24 hours before due)
- Priority change notifications
- Task assignment notifications

#### Backend APIs
- GET /api/workbench - Workbench overview
- GET /api/workbench/todos - Todo items list
- GET /api/workbench/schedule - Schedule calendar
- GET /api/workbench/stats - Efficiency statistics
- PUT /api/workbench/todos/:id/complete - Complete todo
- GET /api/team/status - Team status list
- GET /api/team/:userId/workload - Member workload
- GET /api/team/workload-summary - Team load summary
- POST /api/team/messages - Send team message
- GET /api/team/messages - Get messages list

### Tests
- Workbench API tests: 19 test cases (all passed)
- Team API tests: 28 test cases (all passed)
- Total backend tests: 176 (100% pass rate)

---

## [1.2.0] - 2026-03-10

### Added

#### Visual Design Upgrade
- Complete visual design system overhaul for modern aesthetics
- New color palette with indigo-based gradient primary color
- Plus Jakarta Sans typography for modern feel
- Glassmorphism effects on auth pages and modals
- Mesh gradient background with flowing animation
- Enhanced shadow system with depth layers

#### UI/UX Improvements
- Redesigned login/register page with glassmorphism card
- Upgraded sidebar navigation with brand logo and gradient highlights
- Modernized dashboard with animated stat cards
- Enhanced AI assistant with floating animation and glow effects
- Improved chart styling with custom gradients and tooltips
- Added micro-interactions and hover animations throughout

#### Interaction Design
- Smooth page transitions with cubic-bezier easing
- Animated stat cards with icon effects on hover
- Floating animations for AI assistant button
- Enhanced input focus states with glow effects
- Responsive design optimizations

### Changed
- Primary color: #1890ff → #6366f1 (indigo gradient)
- Font family: System fonts → Plus Jakarta Sans
- All UI components: Updated styling for modern aesthetics

---

## [1.1.0] - 2026-03-10

### Added

#### Testing Improvements
- Comprehensive backend API tests (128 test cases, 99.2% pass rate)
- Frontend component tests (132 test cases, 95% pass rate)
- E2E test framework with Playwright
- Test database isolation for reliable testing
- Improved test coverage across all modules

#### Bug Fixes
- Fixed test database isolation issues
- Fixed async operation timeouts in frontend tests
- Fixed Mock API response format inconsistencies
- Fixed permission system edge cases
- Fixed project deletion cascade issues

#### Performance
- Optimized test execution time
- Improved database query performance
- Reduced test flakiness

### Changed
- Updated test framework configurations
- Improved error handling in API responses
- Enhanced test mock data accuracy

---

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
