# ENCG ERP Development Rules

## Database & Eloquent Models

### 1. Optimistic Locking Column Requirement
- Any Eloquent model that uses the `App\Traits\OptimisticLocking` trait **MUST** have a corresponding `version` column defined in its database table schema.
- Always include `$table->unsignedInteger('version')->default(1);` in migrations for these models.

### 2. Assessment Types Schema
- Do not use database `enum` constraints for assessment types in the `assessments` table.
- Keep the `type` column as a standard string/varchar to support custom configurations (such as CC1, CC2, Rattrapage, TP) dynamically.

### 3. Student Group Filtering
- When designing pages for student marks, grades, or registrations, ensure both the frontend query parameters and the backend Eloquent controller queries filter by `group_id` when it is provided.
- Do not default to loading the whole filiere if a specific group context is requested.
