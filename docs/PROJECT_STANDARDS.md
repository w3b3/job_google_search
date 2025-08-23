# 📋 Project Standards & Guidelines

This document outlines the standards, patterns, and best practices for the Job Search Analyzer application. These guidelines ensure consistency, maintainability, and excellent user experience across the entire Next.js application.

## 🏗️ Application Structure

### Directory Organization
```
job_google_search/                 # Next.js Application Root
├── src/                          # Application source code
│   ├── app/                     # Next.js 13+ app directory
│   │   ├── api/                # API routes (backend functionality)
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # Dashboard pages
│   │   └── search/             # Search-related pages
│   ├── components/             # React components
│   │   ├── SavedResults/       # Job collection components
│   │   ├── SearchConfiguration.tsx
│   │   └── SearchResults.tsx
│   └── lib/                    # Utilities and services
│       ├── auth.ts             # Authentication logic
│       ├── database/           # Database operations
│       ├── queue/              # Redis queue management
│       ├── search/             # Google search & scraping
│       └── worker.ts           # Background job processor
├── data/                       # Persistent data storage
│   ├── sqlite/                # SQLite database files
│   └── redis/                 # Redis persistence
├── docs/                       # Documentation
├── docker-compose.yml          # Docker services configuration
├── Dockerfile                  # Development container
└── package.json               # Dependencies and scripts
```

### Application Architecture
- **Frontend**: React components with Next.js 15 App Router
- **Backend**: API routes handling job search, authentication, and data management
- **Background Processing**: Worker processes for automated job searching with Puppeteer
- **Data Layer**: SQLite database with Redis queue management
- **Container-First**: Designed to run exclusively in Docker containers

## 🎨 UI/UX Design Principles

### Core Philosophy
- **User-First Design**: Every interface should be intuitive and accessible to users of all technical levels
- **Progressive Disclosure**: Complex features should be hidden by default, revealed when needed
- **Contextual Help**: Provide inline guidance and examples without overwhelming the interface
- **Responsive & Accessible**: All components must work across devices and assistive technologies

### Visual Design System

#### Color Palette
- **Primary**: Blue tones for actions and focus states
- **Secondary**: Gray tones for supporting elements
- **Success**: Green for positive actions and confirmations
- **Warning**: Yellow/Orange for cautions
- **Error**: Red for errors and destructive actions

#### Typography
- **Headings**: Clear hierarchy with semantic HTML (h1-h6)
- **Body Text**: Readable font sizes with proper line height
- **Code**: Monospace font for technical content and examples

#### Spacing & Layout
- **Consistent Spacing**: Use Tailwind's spacing scale (4px increments)
- **Card-Based Layout**: Group related content in cards with proper padding
- **Grid Systems**: Responsive grids that adapt to screen sizes

## 🧩 Component Architecture

### Form Components

#### Enhanced Input Fields
```tsx
// Standard input with proper accessibility
<input
  id="unique-id"
  type="text"
  className="input-field"
  aria-describedby="help-text-id"
  placeholder="Clear, helpful placeholder"
/>
<p id="help-text-id" className="text-xs text-gray-500 mt-1">
  Contextual help text
</p>
```

#### Autocomplete Components
- **Debounced Search**: Implement 200ms delay for API calls
- **Keyboard Navigation**: Support arrow keys, Enter, and Escape
- **Accessibility**: Proper ARIA labels and live regions
- **Visual Feedback**: Clear hover and focus states

#### Collapsible Sections
```tsx
// Progressive disclosure pattern
<button
  type="button"
  onClick={() => setExpanded(!expanded)}
  aria-expanded={expanded}
  aria-controls="section-id"
  className="flex items-center justify-between w-full"
>
  <span>Section Title</span>
  <span>{expanded ? '▼' : '▶'}</span>
</button>
{expanded && (
  <div id="section-id">
    {/* Content */}
  </div>
)}
```

### Query Builder Pattern

#### Simple Mode
- **Visual Components**: Separate inputs for role, location, company type
- **Autocomplete**: Suggestions based on common job search terms
- **Real-time Preview**: Show generated query as user types
- **Exclude Terms**: Visual tags for terms to exclude from search

#### Advanced Mode
- **Raw Query Input**: Textarea for complex Google search operators
- **Syntax Help**: Inline documentation with examples
- **Validation**: Real-time feedback on query syntax

### State Management Patterns

#### Form State
```tsx
// Use react-hook-form for complex forms
const {
  register,
  handleSubmit,
  watch,
  setValue,
  formState: { errors }
} = useForm<FormType>({
  resolver: zodResolver(ValidationSchema),
  defaultValues: {
    // Sensible defaults
  }
});
```

#### UI State
```tsx
// Separate UI state from form data
const [showAdvanced, setShowAdvanced] = useState(false);
const [suggestions, setSuggestions] = useState<string[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);
```

## ♿ Accessibility Standards (AAA Compliance)

### WCAG AAA Requirements
This application follows **WCAG 2.1 AAA** accessibility standards for maximum inclusivity.

#### Color Contrast Requirements
- **Normal Text**: Minimum 7:1 contrast ratio
- **Large Text** (18pt+ or 14pt+ bold): Minimum 4.5:1 contrast ratio
- **Interactive Elements**: Minimum 7:1 contrast ratio for text and icons

#### AAA-Compliant Dark Theme Color Palette
```javascript
// Tailwind config colors for AAA compliance
colors: {
  // Dark theme backgrounds
  background: {
    dark: '#0a0a0a'  // Near black for maximum contrast (21:1 with white text)
  },
  surface: {
    dark: '#1a1a1a'  // Dark gray surface (15.3:1 with white text)
  },
  border: {
    dark: '#404040'  // Medium gray for visible borders (7.1:1 with white text)
  },
  
  // AAA Text Colors
  text: {
    primary: {
      dark: '#ffffff'  // Pure white (21:1 contrast on #0a0a0a)
    },
    secondary: {
      dark: '#d4d4d8'  // Light gray (7.5:1 contrast on #0a0a0a)
    },
    tertiary: {
      dark: '#a1a1aa'  // Medium gray (7:1 contrast on #0a0a0a)
    }
  },
  
  // Interactive elements
  interactive: {
    primary: {
      dark: '#60a5fa'  // Light blue for better dark theme contrast
    },
    hover: {
      dark: '#3b82f6'  // Slightly darker for hover states
    }
  }
}
```

#### CSS Classes for AAA Compliance
```css
/* AAA-compliant themed classes */
.text-themed {
  @apply text-text-primary-light dark:text-text-primary-dark;
}

.text-secondary-themed {
  @apply text-text-secondary-light dark:text-text-secondary-dark;
}

.text-tertiary-themed {
  @apply text-gray-500 dark:text-text-tertiary-dark;
}

.surface-themed {
  @apply bg-gray-50 dark:bg-background-dark;
}

.card-themed {
  @apply bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark;
}

/* Enhanced high contrast mode support */
@media (prefers-contrast: high) {
  .text-themed {
    @apply text-black dark:text-white;
  }
  
  .card {
    @apply border-2 border-gray-400 dark:border-white;
  }
}
```

### Required Practices
1. **Semantic HTML**: Use proper HTML elements (button, input, label, etc.)
2. **ARIA Labels**: Provide context for screen readers
3. **Focus Management**: Logical tab order and visible focus indicators
4. **Color Contrast**: **AAA standard 7:1 ratio for normal text, 4.5:1 for large text**
5. **Keyboard Navigation**: All interactive elements accessible via keyboard
6. **Motion Preferences**: Respect `prefers-reduced-motion` settings
7. **High Contrast Mode**: Enhanced visibility when `prefers-contrast: high`

### Implementation Examples

#### Form Labels
```tsx
<label htmlFor="input-id" className="block text-sm font-medium text-gray-700 mb-2">
  Field Label *
</label>
<input
  id="input-id"
  required
  aria-describedby="help-text-id error-id"
  className="input-field"
/>
<p id="help-text-id" className="text-xs text-gray-500 mt-1">
  Help text
</p>
{error && (
  <p id="error-id" className="text-red-600 text-sm mt-1" role="alert">
    {error.message}
  </p>
)}
```

#### Interactive Elements
```tsx
<button
  type="button"
  onClick={handleAction}
  aria-label="Descriptive action name"
  className="btn-primary"
>
  Button Text
</button>
```

### Accessibility Testing & Validation

#### Automated Testing Tools
```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/react axe-playwright

# Run accessibility audits
npm run test:a11y
```

#### Manual Testing Checklist
- [ ] **Keyboard Navigation**: Tab through all interactive elements
- [ ] **Screen Reader**: Test with NVDA, JAWS, or VoiceOver
- [ ] **Color Contrast**: Verify 7:1 ratio using WebAIM Contrast Checker
- [ ] **High Contrast Mode**: Test in Windows High Contrast mode
- [ ] **Zoom Testing**: Ensure usability at 200% zoom level
- [ ] **Motion Preferences**: Test with `prefers-reduced-motion: reduce`

#### Contrast Validation
```javascript
// Use these tools to validate color combinations:
// - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
// - Colour Contrast Analyser: https://www.tpgi.com/color-contrast-checker/

// Example validation for our dark theme:
// Background: #0a0a0a, Text: #ffffff = 21:1 ratio ✅ (exceeds 7:1 AAA requirement)
// Background: #1a1a1a, Text: #d4d4d8 = 7.5:1 ratio ✅ (exceeds 7:1 AAA requirement)
// Background: #0a0a0a, Text: #a1a1aa = 7:1 ratio ✅ (meets 7:1 AAA requirement)
```

## 🎯 User Experience Patterns

### Progressive Disclosure
- **Default State**: Show only essential fields
- **Advanced Options**: Collapse complex settings behind expandable sections
- **Context-Sensitive**: Reveal options based on user selections

### Feedback & Guidance
- **Inline Help**: Contextual tips and examples
- **Real-time Validation**: Immediate feedback on form inputs
- **Loading States**: Clear indicators during async operations
- **Error Handling**: Helpful error messages with recovery suggestions

### Search & Discovery
- **Autocomplete**: Suggest common terms and phrases
- **Templates**: Pre-built configurations for common use cases
- **Recent Searches**: Quick access to previous queries
- **Query Preview**: Show how inputs translate to search queries

## 🔧 Technical Implementation

### CSS Classes & Utilities

#### Standard Components
```css
/* Button variants */
.btn-primary {
  @apply bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors;
}

/* Form inputs */
.input-field {
  @apply block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 sm:text-sm;
}

/* Card layout */
.card {
  @apply bg-white rounded-lg shadow border border-gray-200 p-6;
}
```

### Performance Considerations
- **Debounced Inputs**: Prevent excessive API calls
- **Lazy Loading**: Load suggestions only when needed
- **Memoization**: Cache expensive computations
- **Bundle Optimization**: Code splitting for large components

### Error Handling
```tsx
// Graceful error handling with user feedback
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  setError('A helpful error message for the user');
}
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (single column, stacked elements)
- **Tablet**: 768px - 1024px (2-column grids)
- **Desktop**: > 1024px (multi-column layouts)

### Mobile-First Approach
```tsx
// Start with mobile styles, enhance for larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content adapts to screen size */}
</div>
```

## 🧪 Testing Standards

### Component Testing
- **Unit Tests**: Test individual component logic
- **Integration Tests**: Test component interactions
- **Accessibility Tests**: Automated a11y testing
- **Visual Regression**: Catch unintended UI changes

### User Testing
- **Usability Testing**: Regular user feedback sessions
- **A/B Testing**: Compare different UX approaches
- **Performance Testing**: Ensure fast load times
- **Cross-browser Testing**: Compatibility across browsers

## 📚 Documentation Requirements

### Code Documentation
- **Component Props**: Document all props with TypeScript
- **Complex Logic**: Inline comments for business logic
- **API Interfaces**: Clear type definitions
- **Usage Examples**: Show how to use components

### User Documentation
- **Feature Guides**: Step-by-step instructions
- **Configuration Help**: Explain all options
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: Recommended usage patterns

## 🚀 Deployment & Maintenance

### Docker-First Development
- **Container-Only**: All development runs in Docker containers with live reload
- **Multi-Service**: Web app, background worker, and Redis orchestrated with single docker-compose
- **Development-Focused**: Single configuration optimized for development workflow
- **Live Reload**: Automatic code reloading with volume mounts for fast iteration

### Code Quality
- **Linting**: ESLint + Prettier for consistent formatting across all apps
- **Type Safety**: TypeScript for all components and services
- **Performance**: Regular performance audits for both CLI and web applications
- **Security**: Regular dependency updates and vulnerability scanning

### Container Strategy
- **Production**: Optimized multi-stage builds for minimal image size
- **Development**: Live reload and debugging support
- **Services**: Redis for queue management, SQLite for data persistence
- **Networking**: Isolated Docker networks for service communication

## 🐳 CRITICAL: Docker-First Development Policy

### ⚠️ ABSOLUTE REQUIREMENTS

**🚨 ALL DEVELOPMENT MUST HAPPEN IN CONTAINERS - NO EXCEPTIONS**

#### ❌ FORBIDDEN LOCAL OPERATIONS
```bash
# NEVER run these commands on the host system:
npm install                    # ❌ Install dependencies locally
npm run dev                    # ❌ Run development server locally  
npm run db:migrate            # ❌ Run database migrations locally
node script.js                # ❌ Execute Node.js scripts locally
sqlite3 data/jobsearch.db     # ❌ Access database directly
```

#### ✅ REQUIRED CONTAINER OPERATIONS
```bash
# ALWAYS use containers for all development:
docker-compose up --build                           # ✅ Start development environment
docker-compose exec web npm run db:migrate          # ✅ Database migrations
docker-compose exec web node -e "console.log('ok')" # ✅ Execute scripts in container
docker-compose exec web npm install new-package     # ✅ Install new dependencies
```

#### 🎯 WHY THIS MATTERS
1. **Database Isolation**: Local and container databases are COMPLETELY SEPARATE
2. **Environment Consistency**: Ensures identical development environment
3. **Dependency Management**: Prevents version conflicts and missing dependencies
4. **Data Integrity**: Prevents data inconsistencies between environments

#### 🔍 DATABASE ACCESS EXAMPLES
```bash
# ✅ CORRECT: Check user in container database
docker-compose exec web node -e "
const Database = require('better-sqlite3');
const db = new Database('/app/data/jobsearch.db');
const user = db.prepare('SELECT * FROM users WHERE email = ?').get('user@example.com');
console.log(user);
db.close();
"

# ❌ WRONG: Check user in local database (will be different/empty)
node -e "const db = require('better-sqlite3')('data/jobsearch.db'); console.log(db.prepare('SELECT * FROM users').all());"
```

#### 🛠️ TROUBLESHOOTING CONTAINER ISSUES
```bash
# View container logs
docker-compose logs web

# Rebuild containers after changes
docker-compose down && docker-compose up --build

# Access container shell for debugging
docker-compose exec web bash

# Reset all containers and data
docker-compose down -v && docker-compose up --build
```

### Monitoring
- **Error Tracking**: Monitor and fix runtime errors across all services
- **Performance Metrics**: Track page load times and CLI execution performance
- **User Analytics**: Understand usage patterns in web application
- **Accessibility Audits**: Regular a11y compliance checks
- **Health Checks**: Container health monitoring and automatic restarts

---

## 🎨 Enhanced UX Patterns (Updated 2025)

### Search Results Component
The SearchResults component demonstrates our enhanced UX patterns:

#### Loading States
```tsx
// Skeleton loading with accessibility
<div className="space-y-6 animate-pulse" role="status" aria-label="Loading search results">
  {/* Realistic content placeholders */}
</div>
```

#### Progress Indicators
```tsx
// Live progress with ARIA support
<div 
  role="progressbar"
  aria-valuenow={progressPercentage}
  aria-label={`Search progress: ${progressPercentage}% complete`}
>
  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out">
    <div className="animate-pulse opacity-30"></div>
  </div>
</div>
```

#### Enhanced Animations
```css
/* Staggered animations for list items */
.animate-slideUp {
  animation: slideUp 0.4s ease-out;
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  .animate-slideUp { animation: none; }
}
```

#### Accessibility-First Design
- **ARIA Labels**: Every interactive element properly labeled
- **Semantic HTML**: Use `article`, `section`, `header` appropriately
- **Focus Management**: Logical tab order with visible indicators
- **Live Regions**: Dynamic updates announced to screen readers
- **High Contrast**: Enhanced visibility in high contrast mode

### Navigation Layout Pattern

#### SearchLayout Component
A shared layout component that provides consistent navigation and user controls across all search-related pages.

```tsx
import SearchLayout from '@/components/SearchLayout';

export default function SearchPage() {
  return (
    <SearchLayout 
      title="Search Results"
      showBackButton={true}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page content */}
      </div>
    </SearchLayout>
  );
}
```

#### Features
- **Consistent Header**: Logo, navigation, and user controls
- **Smart Back Button**: Uses browser history or fallback to dashboard
- **Responsive Design**: Desktop navigation with mobile bottom bar
- **Theme Integration**: Seamless dark/light mode support
- **Authentication Aware**: Shows appropriate controls based on user state

#### Usage Guidelines
1. **Search Pages**: Use for all search-related pages (`/search/*`, `/searches`)
2. **Title Prop**: Provide descriptive page titles for context
3. **Back Button**: Enable for pages that benefit from navigation history
4. **Content Wrapper**: Always wrap page content in responsive container

#### Mobile Navigation
- **Bottom Bar**: Fixed navigation for mobile devices
- **Touch Targets**: 44px minimum for accessibility
- **Visual Hierarchy**: Clear icons with labels
- **Safe Areas**: Respects device safe areas and notches

## 🔄 Continuous Improvement

This document should be updated as the application evolves. When implementing new patterns or components:

1. **Document the Pattern**: Add to this guide with examples
2. **Update Components**: Ensure consistency across the codebase
3. **Test Thoroughly**: Verify accessibility and usability
4. **Gather Feedback**: Collect user input on new features
5. **Iterate**: Continuously improve based on data and feedback

### Recent Enhancements (2025)
- **SearchResults Component**: World-class UX with animations and accessibility
- **Progress Tracking**: Live updates with backend integration
- **Error Handling**: Enhanced error states with recovery actions
- **Mobile Optimization**: Touch-friendly interactions and responsive design
- **Navigation Layout**: Shared layout component for consistent navigation across search pages

For detailed implementation guidance, see: [Search Results UX Enhancement](./SEARCH_RESULTS_UX_ENHANCEMENT.md)

Remember: **The user experience is paramount**. Every technical decision should consider its impact on the people using our application.

## 🚀 Search Optimization System

### Intelligent Search Caching & Deduplication
The application includes an advanced search optimization system that provides up to 90% time savings through intelligent caching and query deduplication.

#### Key Features
- **Query-Level Granularity**: Optimizes individual ATS platform queries rather than entire searches
- **Smart Cache Keys**: Consistent fingerprinting of search parameters regardless of input order
- **Automatic Expiry**: 6-hour default cache expiry balancing freshness with performance
- **Mixed Results**: Seamlessly combines cached and fresh results in single searches
- **Performance Metrics**: Detailed optimization statistics and time savings reporting

#### Implementation Standards
```typescript
// Always check cache eligibility before search execution
if (shouldUseCache(config)) {
  const optimization = await findRecentSimilarSearches(config, queries, 6, userId);
  // Process optimization results
}

// Include optimization metrics in search statistics
interface SearchStats {
  // ... existing fields ...
  cacheOptimization?: {
    totalQueries: number;
    cachedQueries: number;
    optimizationPercentage: number;
    timeSaved: number;
  };
}
```

#### Cache Disable Conditions
- **Debug Mode**: `debugMode: true` disables caching for development
- **Fresh Searches**: `timeFilterDays < 1` disables caching for sub-daily searches  
- **Error Fallback**: Automatic fallback to fresh searches if cache operations fail

#### Performance Benefits
- **Time Savings**: 60-90% reduction in search execution time for repeated queries
- **API Efficiency**: Significant reduction in Google Custom Search API usage
- **Resource Optimization**: Lower CPU and network consumption
- **Cost Reduction**: Reduced API costs through intelligent query deduplication

### Optimization Best Practices
1. **Enable Verbose Logging**: Use `verboseLogging: true` to monitor optimization effectiveness
2. **Monitor Cache Hit Rates**: Track optimization percentages in search statistics
3. **User-Specific Caching**: Leverage userId parameter for personalized optimization
4. **Graceful Degradation**: Always fallback to fresh searches if optimization fails

For detailed implementation guidance, see: [Search Optimization System](./SEARCH_OPTIMIZATION_SYSTEM.md)

## 🗄️ Database Schema Management

### Search Types Architecture
The application supports two distinct search types with different database schemas:

#### Legacy Search Type
- **Fields**: `job_query` (TEXT), `keywords` (JSON array as TEXT)
- **Usage**: Traditional keyword-based job searches
- **Constraints**: Both `job_query` and `keywords` must be NOT NULL when `search_type = 'legacy'`

#### Strict Search Type  
- **Fields**: `position` (JSON array), `location` (JSON array), `technology` (JSON array), `domain` (JSON array)
- **Usage**: Structured searches with specific criteria
- **Constraints**: `position` and `location` must be NOT NULL when `search_type = 'strict'`

### Database Schema Constraints
```sql
-- Critical constraint ensuring proper data based on search type
CHECK (
    (search_type = 'legacy' AND job_query IS NOT NULL AND keywords IS NOT NULL) OR
    (search_type = 'strict' AND position IS NOT NULL AND location IS NOT NULL)
)
```

### Schema Migration Best Practices
1. **Column Nullability**: Legacy fields (`job_query`, `keywords`) must be nullable to support strict searches
2. **Constraint Validation**: Use CHECK constraints to enforce data integrity per search type
3. **Index Management**: Recreate indexes after table structure changes
4. **Data Preservation**: Always backup data before schema modifications

### Common Schema Issues & Solutions

#### Issue: "NOT NULL constraint failed: searches.job_query"
**Cause**: Attempting to create strict searches when legacy fields have NOT NULL constraints

**Solution**: 
```sql
-- Recreate table with proper nullable columns
DROP TABLE searches;
CREATE TABLE searches (
    -- ... other fields ...
    job_query TEXT,     -- NULLABLE for strict searches
    keywords TEXT,      -- NULLABLE for strict searches
    search_type TEXT DEFAULT 'legacy' CHECK (search_type IN ('legacy', 'strict')),
    -- ... constraint checks ...
);
```

#### Issue: "table searches has no column named search_type"
**Cause**: Database schema not updated after adding new search type support

**Solution**:
```bash
# Run migration inside container
docker-compose exec web npm run db:migrate

# Or add columns manually
docker-compose exec web sqlite3 /app/data/jobsearch.db "
ALTER TABLE searches ADD COLUMN search_type TEXT DEFAULT 'legacy';
ALTER TABLE searches ADD COLUMN position TEXT;
ALTER TABLE searches ADD COLUMN location TEXT;
ALTER TABLE searches ADD COLUMN technology TEXT;
ALTER TABLE searches ADD COLUMN domain TEXT;
"
```

### Migration Checklist
- [ ] Backup existing data before schema changes
- [ ] Test both legacy and strict search creation after migration
- [ ] Verify all required indexes are recreated
- [ ] Update application code to handle new schema
- [ ] Document any breaking changes in this file
