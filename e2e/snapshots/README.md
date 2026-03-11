# Visual Regression Testing Snapshots

This directory contains baseline snapshots for visual regression testing.

## Directory Structure

```
snapshots/
├── homepage/       # Homepage snapshots
├── login/          # Login page snapshots
├── dashboard/      # Dashboard snapshots
├── chromium/       # Chromium browser specific snapshots
├── firefox/        # Firefox browser specific snapshots
└── webkit/         # WebKit browser specific snapshots
```

## Usage

- Snapshots are automatically generated when running visual tests
- Update snapshots with: `npm run test:visual:update`
- Review changes before committing new snapshots
