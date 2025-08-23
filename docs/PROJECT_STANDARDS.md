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

## ♿ Accessibility Standards

### Required Practices
1. **Semantic HTML**: Use proper HTML elements (button, input, label, etc.)
2. **ARIA Labels**: Provide context for screen readers
3. **Focus Management**: Logical tab order and visible focus indicators
4. **Color Contrast**: Minimum 4.5:1 ratio for normal text
5. **Keyboard Navigation**: All interactive elements accessible via keyboard

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

For detailed implementation guidance, see: [Search Results UX Enhancement](./SEARCH_RESULTS_UX_ENHANCEMENT.md)

Remember: **The user experience is paramount**. Every technical decision should consider its impact on the people using our application.
