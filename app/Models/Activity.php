<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Spatie\Activitylog\Models\Activity as SpatieActivity;

class Activity extends SpatieActivity
{
    use HasUlids;

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'id' => 'string',
        'properties' => 'collection',
        'attribute_changes' => 'collection',
    ];
}
