
# Stock Screener MVP Module - Architecture & Using with Claude Code

## 1. Architecture Explanation (Feature Subset)

This feature is a **modular subset of your main website** (e.g., as `/screener` or an integrated dashboard tab). It enables users to build quick custom stock queries and rapidly filter by key financial ratios.

### High-Level Architecture

```
User (Frontend: /screener page)
    |
    v
Next.js UI (React forms/tables, filter builder)
    |
    v
API Route (Next.js API or `/api/screener`, Node.js/TS)
    |
    v
Query Parser (TypeScript utils → Prisma where object)
    |
    v
Prisma ORM (safe, typed query generation)
    |
    v
PostgreSQL (Docker, local dev)
    ^
    |
Data Ingest Script (Node/TS, periodic fetch from external API)
```

#### Details for Each Layer

- **Frontend (UI):** Filter form and results table using React + Next.js. Simple and extendable.
- **API (Backend):** Handles filter requests, hands off to query parser, returns results as JSON.
- **Query Parser:** Converts UI input into validated/sanitized filter object (maps to Prisma). Prevents injection.
- **Prisma ORM:** Models DB, handles all queries with typesafety. DB schema versioned by migrations.
- **PostgreSQL:** Stores latest financials for all companies. Local; Docker orchestrated.
- **Data Ingest Script:** Pulls company financials from your chosen company info API and upserts into DB (manual/periodic for MVP stage).

**Why this setup?**
- Faster dev using existing website stack (Next.js)
- No need for full microservices for MVP
- Type safety and speed
- Can grow into larger microservice

---

## 2. Using with Claude Code in Depth

To get maximum value from Claude (Anthropic’s code LLM) as you build this feature:

### Step-By-Step Workflow for Claude Code

#### A. Architecture & Planning
- Paste in the above architecture block, ask Claude to spot flaws or suggest optimizations ("How might you reduce latency for 10k users?").
- Ask for pros/cons of using Prisma + Postgres vs alternatives given MVP scale.
- Use Claude to brainstorm API input/output contracts and error-handling strategies.

#### B. Data Modeling
- Give Claude your desired fields (e.g. name, symbol, PE, ROCE, etc.) and request a recommended Prisma schema.
- Use Claude to generate sample migrations, `prisma.schema` file, and basic seed scripts.

#### C. UI/UX & API Design
- Paste or describe the UI form spec (e.g., user can filter stocks by PE and ROCE…).
- Ask Claude to:
  - Generate a React component for the screener form/table
  - Suggest easy-to-use query filter UX designs
  - Scaffold Next.js API handlers (with typing and validation)

#### D. Query Parsing & Security
- Provide a sample user filter (e.g. PE < 20 AND ROCE > 15), ask for TS parser/validator code that maps to a Prisma where object.
- Ask Claude to:
  - Review code for SQL injection risk
  - Suggest ways to sanitize incoming filters

#### E. Integration & Debugging
- When building, paste error logs or failing queries; ask Claude to debug stacktraces, infer root causes, or refactor code.
- Use Claude for code documentation or boilerplate ("Generate jsdocs/comments for this function").

#### F. Testing & Next Steps
- Ask Claude to design test cases for filter edge cases & API inputs ("Write jest tests for the screener parser").
- Use Claude to plan how to evolve MVP to support live data, batch updates, or more powerful queries later.

---

## 3. Efficient Claude Usage Tips
- **Be iterative:** Ask atomic questions, review output, then build up complexity.
- **Leverage context:** Paste this .md in chunks as context before high-effort prompts.
- **Request reviews:** Ask Claude not just to code, but to review, refactor, test, or document.
- **Save key prompts:** Build a library of prompts for repetitive code patterns (API handler generation, Prisma query checks, etc.)

---

## 4. Example Prompts for Claude
- “Given this Prisma schema and a query filter, generate an API route that fetches companies filtered by PE and ROCE.”
- “Review this TypeScript utility for security issues. Make it safer.”
- “Suggest UX improvements for a minimal stock screener form.”

---

## 5. MVP Implementation Plan

### Phase 1: Foundation (Core Infrastructure)
1. **Database Setup**
   - Install Prisma ORM and Zod validation (`npm install prisma @prisma/client zod`)
   - Create Prisma schema for stock data (Company, FinancialMetrics tables)
   - Set up Docker Compose for PostgreSQL
   - Initialize database with migrations

2. **Core API Layer**
   - Build `/api/screener` endpoint with Zod input validation
   - Implement query parser (UI filters → Prisma where clauses)
   - Add basic error handling and response formatting

### Phase 2: User Interface
3. **Screener UI Components**
   - Create filter form component (PE, ROCE, Market Cap filters)
   - Build results table with sorting and basic pagination
   - Add loading states and skeleton UI
   - Implement error boundaries for graceful failure handling

### Phase 3: Data & Features
4. **Data Management**
   - Create basic data ingest script for financial data
   - Implement CSV export functionality for results
   - Add saved searches feature (localStorage for MVP)

### Phase 4: Polish & Testing
5. **Quality Assurance**
   - Add comprehensive Jest tests for query parser
   - Test API endpoints with edge cases
   - Validate UI responsiveness and error states

### MVP Exclusions (Post-MVP)
- Redis caching layer
- Performance monitoring
- Advanced pagination (cursor-based)
- Real-time data updates
- User authentication
- Advanced filtering (technical indicators)

### Success Metrics for MVP
- Users can filter stocks by 3+ financial ratios
- Results load within 2 seconds for <1000 stocks
- Export functionality works reliably
- Zero SQL injection vulnerabilities

## 6. Next Steps
- Use this updated plan as implementation roadmap
- Follow the phase-by-phase approach to ensure MVP delivery
- Update this document as requirements evolve

