# ULID Development Skill

This guide outlines the standard for using Universally Unique Lexicographically Sortable Identifiers (ULID) in the MedStock Pro Inventory System.

## Why ULID?

1. **Security**: Unlike auto-incrementing IDs, ULIDs are non-predictable, preventing attackers from guessing the total number of records or crawling data by incrementing IDs.
2. **Sortability**: ULIDs are lexicographically sortable, meaning records created later will naturally sort after earlier ones, maintaining the benefits of auto-incrementing IDs for indexing and ordering.
3. **Multi-Database Friendliness**: ULIDs can be generated without a centralized database counter, making them ideal for distributed systems or when records are created offline and synced later.
4. **URL Compatibility**: ULIDs are case-insensitive and URL-safe.

## Implementation Guide

### 1. Migrations

When creating new tables or adding foreign keys, use the `ulid` methods provided by Laravel.

#### Primary Keys
```php
Schema::create('example_table', function (Blueprint $table) {
    $table->ulid('id')->primary(); // Use ulid instead of id()
    // ...
});
```

#### Foreign Keys
```php
Schema::table('other_table', function (Blueprint $table) {
    $table->foreignUlid('example_id')->constrained()->cascadeOnDelete();
    // Or for nullable foreign keys
    $table->foreignUlid('optional_id')->nullable()->constrained('example_table');
});
```

### 2. Models

Every model using a ULID primary key must use the `HasUlids` trait.

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Example extends Model
{
    use HasUlids;
    
    // Transparently handles ULID generation on creation
}
```

### 3. Spatie Permission & Activity Log

We use custom models for Spatie Permission to support ULIDs.

**Role Model:** `App\Models\Role`
**Permission Model:** `App\Models\Permission`

In `config/permission.php`, these classes are configured:
```php
'models' => [
    'permission' => App\Models\Permission::class,
    'role' => App\Models\Role::class,
],
```

Ensure the `model_morph_key` is set to ULID in migrations:
```php
$table->ulid($columnNames['model_morph_key']);
```

### 4. Activity Log

The `activity_log` table uses `nullableUlidMorphs()` for both `subject` and `causer`.

```php
$table->nullableUlidMorphs('subject', 'subject');
$table->nullableUlidMorphs('causer', 'causer');
```

### 5. API & Frontend

- All IDs sent to the frontend will be ULID strings (e.g., `01H7XRMZB8S1T0M1K1A5Q7XJ89`).
- Ensure frontend validators and route parameters expect strings, not integers.

## References

- [Laravel Documentation: ULIDs](https://laravel.com/docs/master/eloquent#uuid-and-ulid-keys)
