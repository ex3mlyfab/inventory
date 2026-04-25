<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Role;

foreach(User::all() as $u) {
    echo $u->email . ' roles: ' . implode(',', $u->getRoleNames()->toArray()) . PHP_EOL;
}
