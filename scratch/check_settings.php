<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Setting;

echo "App Name: " . Setting::get('app_name') . "\n";
echo "App Logo: " . Setting::get('app_logo') . "\n";
