# JSDoc Style Guide

This guide establishes standards for documenting JavaScript functions in the DevTools Dashboard codebase.

## Core Principle: Document the WHY, Not Just the WHAT

**Bad documentation** tells you what the code does:
```javascript
/**
 * Fetches data from the database.
 */
export function getData() { ... }
```

**Good documentation** explains why it exists and what problem it solves:
```javascript
/**
 * Fetches user portfolio data with lazy-loaded modules.
 *
 * WHY: Portfolio data is stored across multiple tables (users, modules,
 * artifacts) and can be large. This function uses lazy loading to fetch
 * only the user metadata initially, deferring module details until needed.
 * This prevents timeouts when users have 50+ modules and enables faster
 * initial page loads.
 */
export function getData() { ... }
```

---

## Required Documentation Elements

### 1. Module-Level Comment (File Header)

Every file with exports must have a module-level comment explaining its purpose:

```javascript
/**
 * GitHub repository discovery and module metadata extraction.
 *
 * WHY: E-portfolios are scattered across GitHub without a central catalog.
 * This module automates discovery by scanning repositories for standardized
 * structures (READMEs, outcomes.yaml, rubrics) and building a unified index.
 * This eliminates manual catalog maintenance and enables organic organization.
 */
```

### 2. Function Documentation

Every **exported** function must document:

#### Required Fields:

- **Description** - One-sentence summary
- **WHY section** - Explains the problem this function solves and why it exists
- **@param** - Every parameter with type and description
- **@returns** - Return value with type and structure details
- **@throws** - All possible error conditions
- **@example** - At least one realistic usage example

#### Template:

```javascript
/**
 * [One-sentence description of what the function does]
 *
 * WHY: [Paragraph explaining why this function exists, what problem it solves,
 * and what would happen without it. Focus on business logic, not implementation.]
 *
 * @param {Type} paramName - Description including valid values/ranges
 * @param {Type} [optionalParam] - Optional parameters marked with []
 * @param {Type} [paramWithDefault=value] - Show defaults
 *
 * @returns {Type} Description of return value
 * @returns {SubType} return.property - Describe object properties
 *
 * @throws {ErrorType} When this specific error occurs
 * @throws {ErrorType} Another possible error condition
 *
 * @example
 * // Realistic usage example with context
 * const result = await functionName(param1, param2);
 * // Expected output: [description]
 *
 * @example
 * // Edge case or alternate usage
 * const result = await functionName({ advanced: true });
 */
export async function functionName(param1, optionalParam = default) {
  // Implementation
}
```

---

## Type Annotations

Use JSDoc type annotations for static analysis:

### Primitive Types
```javascript
/**
 * @param {string} name - User's full name
 * @param {number} age - Age in years (must be positive)
 * @param {boolean} active - Whether account is active
 */
```

### Arrays
```javascript
/**
 * @param {string[]} tags - Array of tag strings
 * @param {Array<Object>} users - Array of user objects
 * @param {Array<{id: number, name: string}>} items - Typed array
 */
```

### Objects
```javascript
/**
 * @param {Object} config - Configuration object
 * @param {string} config.apiKey - API key for authentication
 * @param {number} [config.timeout=5000] - Request timeout in ms
 * @param {boolean} [config.retry=false] - Enable automatic retries
 */
```

### Complex Types
```javascript
/**
 * @typedef {Object} Module
 * @property {string} slug - URL-safe identifier
 * @property {string} name - Display name
 * @property {Array<Outcome>} outcomes - Learning outcomes
 *
 * @typedef {Object} Outcome
 * @property {string} id - Outcome identifier (e.g., 'LO1')
 * @property {string} description - What the student should achieve
 * @property {string[]} evidence - URLs to supporting artifacts
 */

/**
 * Processes module data with typed objects.
 *
 * @param {Module} module - Module to process
 * @returns {Promise<Module>} Processed module
 */
export async function processModule(module) { ... }
```

### Promises
```javascript
/**
 * @returns {Promise<string>} Resolves to user ID
 * @returns {Promise<Array<Object>>} Resolves to array of results
 * @returns {Promise<void>} Resolves when operation completes
 */
```

### Union Types
```javascript
/**
 * @param {string|number} id - User ID (string UUID or numeric)
 * @param {Object|null} data - Data object or null for reset
 */
```

---

## Error Documentation

Document **every** error condition, not just throws:

```javascript
/**
 * Fetches articles from GDELT API.
 *
 * @throws {Error} If GDELT API is unreachable (network error, DNS failure)
 * @throws {Error} If API returns 429 (rate limit exceeded, retry after 60s)
 * @throws {Error} If API returns 400 (invalid query syntax)
 * @throws {Error} If response cannot be parsed as JSON (malformed response)
 * @throws {Error} If keyword exceeds 500 characters (API limitation)
 */
```

---

## The WHY Section: Key Questions to Answer

When writing the WHY section, answer:

1. **What problem does this solve?**
   - Bad: "This function gets user data"
   - Good: "Users need fast access to portfolio metadata without loading 50+ modules"

2. **Why not use an alternative approach?**
   - "We use lazy loading instead of eager loading because portfolios can have 100+ artifacts"
   - "We query GDELT instead of NewsAPI because GDELT is free and covers 100+ languages"

3. **What business/user need drove this?**
   - "E-portfolios scattered across repos need automated indexing"
   - "Misinformation research requires access to global news in real-time"

4. **What would break without this?**
   - "Without this, services would crash on missing database tables"
   - "Without this, users would manually catalog every module"

---

## Examples Section

Provide realistic, **copy-pasteable** examples:

### Bad Example
```javascript
/**
 * @example
 * getData()
 */
```

### Good Example
```javascript
/**
 * @example
 * // Fetch user's portfolio with all modules
 * const portfolio = await getPortfolio('user-123');
 * console.log(`Found ${portfolio.modules.length} modules`);
 * // Output: "Found 12 modules"
 *
 * @example
 * // Handle missing user gracefully
 * try {
 *   const portfolio = await getPortfolio('invalid-id');
 * } catch (error) {
 *   if (error.code === 'USER_NOT_FOUND') {
 *     console.log('User does not exist');
 *   }
 * }
 */
```

---

## Special Cases

### Database Functions

Always document:
- What tables are accessed
- Whether it's read-only or writes
- Transaction behavior

```javascript
/**
 * Inserts a new learning outcome into the database.
 *
 * WHY: Outcomes are tracked separately from modules to enable many-to-many
 * relationships (one outcome can span multiple modules). This function
 * ensures atomic insertion with proper foreign key constraints.
 *
 * Database Impact:
 * - Writes to: `outcomes` table
 * - Reads from: `modules` table (FK validation)
 * - Transaction: Yes (rolled back on constraint violation)
 *
 * @param {Object} outcome - Outcome data
 * @returns {Promise<number>} Inserted row ID
 * @throws {Error} If module_id doesn't exist (foreign key constraint)
 */
```

### API Connectors

Always document:
- External API limitations (rate limits, quotas)
- Required credentials
- Retry behavior

```javascript
/**
 * Fetches news from NewsAPI.
 *
 * WHY: Researchers need recent news articles for analysis. NewsAPI provides
 * a simple REST interface to 80,000+ sources, but has strict rate limits
 * (100 requests/day on free tier). This function handles rate limiting and
 * provides caching to avoid quota exhaustion.
 *
 * API Limitations:
 * - Rate limit: 100 requests/day (free tier)
 * - Max results: 100 per request
 * - Historical data: 30 days only
 * - Requires: API key in NEWS_API_KEY env var
 *
 * Retry Behavior:
 * - Rate limited (429): Returns cached results, logs warning
 * - Server error (5xx): Retries 3 times with exponential backoff
 * - Client error (4xx): Throws immediately (no retry)
 *
 * @throws {Error} If NEWS_API_KEY not set
 */
```

### Async Functions

Always document:
- What operations are async (network, disk I/O, etc.)
- Performance characteristics
- Cancellation behavior

```javascript
/**
 * Discovers modules across all organization repositories.
 *
 * WHY: Scanning an entire GitHub organization (possibly 100+ repos) requires
 * fetching metadata for each repo, then scanning directories in each. This
 * is inherently slow (GitHub API has rate limits) so we make it async and
 * provide progress callbacks.
 *
 * Performance:
 * - ~2-3 seconds per repository (GitHub API calls)
 * - Organization with 50 repos: ~2 minutes total
 * - Uses concurrent requests (max 5) to speed up
 * - GitHub rate limit: 5000 requests/hour (authenticated)
 *
 * @param {Object} config
 * @param {Function} [config.onProgress] - Called with (current, total) after each repo
 * @returns {Promise<Module[]>} Discovered modules
 */
```

---

## Documentation Anti-Patterns

### Don't: Repeat Function Name
```javascript
/**
 * Get database.
 * @returns {Database} The database
 */
export function getDatabase() { ... }
```

### Do: Explain Purpose
```javascript
/**
 * Returns a new connection to the Misinformation Lab database.
 *
 * WHY: Each API request needs an isolated database connection to prevent
 * state leakage between requests. Better-sqlite3 connections are lightweight
 * and thread-safe when isolated per-request.
 *
 * @returns {Database} New SQLite connection to misinfo.db
 */
export function getDatabase() { ... }
```

### Don't: Document Internal Implementation
```javascript
/**
 * Uses Array.map to transform items.
 */
```

### Do: Document Business Logic
```javascript
/**
 * WHY: GDELT returns raw article metadata without cleaning. URLs often
 * contain tracking parameters and titles have HTML entities. This transform
 * normalizes data for consistent storage and presentation.
 */
```

---

## Checking Documentation Quality

Good documentation should enable a developer to:

1. ✅ Understand **why** the function exists
2. ✅ Know **when** to use it (and when not to)
3. ✅ Predict **what** will happen in edge cases
4. ✅ Handle **errors** appropriately
5. ✅ Use it **correctly** without reading implementation

Ask yourself:
- Can I use this function without reading the code?
- Do I understand why it exists?
- Do I know what will break if I misuse it?
- Are error cases clear?

---

## Tools and Validation

### Generate Documentation
```bash
# Install JSDoc
npm install --save-dev jsdoc

# Generate HTML docs
npx jsdoc src/**/*.js -d docs/api

# Or use a better theme
npm install --save-dev better-docs
npx jsdoc -c jsdoc.json
```

### Lint JSDoc
```bash
# Install ESLint JSDoc plugin
npm install --save-dev eslint-plugin-jsdoc

# Add to .eslintrc.json
{
  "plugins": ["jsdoc"],
  "rules": {
    "jsdoc/require-jsdoc": "error",
    "jsdoc/require-param": "error",
    "jsdoc/require-returns": "error",
    "jsdoc/require-description": "error"
  }
}
```

### Type Checking with TypeScript
```bash
# Use JSDoc types for TypeScript checking without converting to .ts
npx tsc --allowJs --checkJs --noEmit src/**/*.js
```

---

## Summary Checklist

For every exported function:

- [ ] Module-level comment explaining file purpose
- [ ] One-sentence description
- [ ] WHY section (3-5 sentences)
- [ ] All parameters documented with types
- [ ] Return value documented with structure
- [ ] All error conditions listed
- [ ] At least one realistic example
- [ ] Performance notes (if relevant)
- [ ] API limitations (if calling external service)
- [ ] Database impact (if querying/writing)

**Remember: Future you (and your teammates) will thank you for explaining WHY, not just WHAT.**
