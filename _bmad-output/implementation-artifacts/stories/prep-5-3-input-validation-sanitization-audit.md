# Story Prep-5.3: Input Validation & Sanitization Audit

Status: backlog

## Story

As a Security Engineer,
I want comprehensive input validation across all API endpoints,
So that injection attacks (SQL/XSS/NoSQL) are prevented.

## Context

**Sprint Context:** Prep Sprint 5 - Security Hardening & Compliance Review
**Architecture:** NestJS with class-validator, Supabase PostgreSQL with RLS
**Threat Model:** SQL injection, XSS, NoSQL injection, path traversal
**NFR Coverage:** NFR4 (Security), NFR8 (Data Integrity)

## Acceptance Criteria

1. **Given** user inputs in DTOs
   **When** validation fails
   **Then** descriptive errors should be returned (no stack traces in production)

2. **Given** file uploads (future CSV import)
   **When** validating
   **Then** MIME type, size, and content should be checked

3. **Given** API responses
   **When** rendering user-generated content
   **Then** XSS payloads should be sanitized

## Tasks / Subtasks

- [ ] **Task 1: Audit Existing DTOs**
  - [ ] List all DTOs in `packages/api-types/src/`:
    - `CreatePortfolioDto`
    - `CreateTransactionDto`
    - `CreateConnectionDto`
    - `UpdateUserPreferencesDto`
  - [ ] Verify each field has validation decorators
  - [ ] Document missing validations

- [ ] **Task 2: Add Missing Validations**
  - [ ] Install `class-validator` and `class-sanitizer` (if not present)
  - [ ] Add decorators to all DTO fields:

    ```typescript
    import {
      IsNotEmpty,
      IsEmail,
      IsNumber,
      IsString,
      MaxLength,
      Min,
      Max,
    } from "class-validator";

    export class CreateTransactionDto {
      @IsNotEmpty()
      @IsString()
      @MaxLength(50)
      symbol: string;

      @IsNumber()
      @Min(0.00000001)
      quantity: number;

      @IsNumber()
      @Min(0)
      price: number;
    }
    ```

  - [ ] Test validation errors returned correctly

- [ ] **Task 3: Enable Global Validation Pipe**
  - [ ] Edit `services/api/src/main.ts`:

    ```typescript
    import { ValidationPipe } from "@nestjs/common";

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip unknown properties
        forbidNonWhitelisted: true, // Reject unknown properties
        transform: true, // Auto-transform payloads to DTO instances
        disableErrorMessages: process.env.NODE_ENV === "production", // Hide details in prod
      }),
    );
    ```

  - [ ] Test with malicious payloads (extra fields, wrong types)

- [ ] **Task 4: Sanitize User-Generated Content**
  - [ ] Install `class-sanitizer`
  - [ ] Add sanitization decorators:

    ```typescript
    import { Trim } from "class-sanitizer";

    export class UpdatePortfolioDto {
      @IsString()
      @MaxLength(100)
      @Trim()
      name: string;
    }
    ```

  - [ ] Create custom decorator for HTML stripping:

    ```typescript
    import { Transform } from "class-transformer";
    import sanitizeHtml from "sanitize-html";

    export function StripHTML() {
      return Transform(({ value }) =>
        sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }),
      );
    }
    ```

- [ ] **Task 5: File Upload Validation (Future-Proof)**
  - [ ] Create `FileValidationPipe`:

    ```typescript
    @Injectable()
    export class FileValidationPipe implements PipeTransform {
      async transform(value: Express.Multer.File) {
        const allowedMimeTypes = ["text/csv", "application/json"];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedMimeTypes.includes(value.mimetype)) {
          throw new BadRequestException("Invalid file type");
        }

        if (value.size > maxSize) {
          throw new BadRequestException("File too large");
        }

        return value;
      }
    }
    ```

  - [ ] Test with various file types

- [ ] **Task 6: SQL Injection Protection Audit**
  - [ ] Review all database queries in services
  - [ ] Verify parameterized queries used (Supabase client handles this)
  - [ ] Test with SQL injection payloads:
    - `' OR '1'='1`
    - `'; DROP TABLE users;--`
  - [ ] Verify RLS policies block unauthorized access

- [ ] **Task 7: Review Supabase RLS Policies**
  - [ ] Audit `user_connections` table RLS:

    ```sql
    -- Read: Users can only read their own connections
    CREATE POLICY "Users can view own connections"
    ON user_connections FOR SELECT
    USING (auth.uid() = user_id);

    -- Write: Users can only insert/update their own connections
    CREATE POLICY "Users can manage own connections"
    ON user_connections FOR ALL
    USING (auth.uid() = user_id);
    ```

  - [ ] Test with different user IDs
  - [ ] Verify no policy bypass via service role key

- [ ] **Task 8: Integration Tests**
  - [ ] Create `services/api/test/security/injection.spec.ts`:
    - Test SQL injection in query params
    - Test XSS in transaction descriptions
    - Test NoSQL injection in filters
    - Test path traversal in file paths
  - [ ] Use OWASP ZAP or Burp Suite for automated scanning
  - [ ] Document test results

- [ ] **Task 9: Create Security Documentation**
  - [ ] Create `SECURITY.md` in project root:
    - Input validation patterns
    - Allowed/blocked characters by field type
    - File upload restrictions
    - XSS prevention strategies
  - [ ] Add security testing checklist for new endpoints

## Technical Guidelines

- **Whitelisting over Blacklisting:** Define allowed inputs, reject everything else
- **Defense in Depth:** Validate at DTO, service, and database layers
- **Error Messages:** Generic in production ("Invalid input"), specific in development

## Dev Agent Record

**Date:** 2025-12-29

**Files to Create:**

- `services/api/src/common/pipes/file-validation.pipe.ts`
- `services/api/src/common/decorators/strip-html.decorator.ts`
- `services/api/test/security/injection.spec.ts`
- `SECURITY.md`

**Files to Modify:**

- All DTOs in `packages/api-types/src/` - add validation decorators
- `services/api/src/main.ts` - enable global validation pipe
- Supabase RLS policies (migrations)

## References

- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [class-validator Decorators](https://github.com/typestack/class-validator#validation-decorators)
