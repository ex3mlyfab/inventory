<?php

namespace App\Console\Commands;

use App\Models\Requisition;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillInTransitQuantities extends Command
{
    protected $signature = 'stock:backfill-in-transit {--dry-run}';
    protected $description = 'Populate quantity_in_transit / quantity_received from requisition status';

    public function handle(): int
    {
        $dry = $this->option('dry-run');

        // Open requisitions: everything issued is still in transit.
        Requisition::query()
            ->whereIn('status', ['issued', 'partially_issued', 'in_transit'])
            ->with('items')
            ->chunkById(100, function ($requisitions) use ($dry) {
                foreach ($requisitions as $req) {
                    DB::transaction(function () use ($req, $dry) {
                        foreach ($req->items()->lockForUpdate()->get() as $item) {
                            if ($item->quantity_in_transit === 0 && $item->quantity_issued > 0) {
                                $this->line("REQ {$req->reference} item {$item->id}: in_transit = {$item->quantity_issued}");
                                if (! $dry) {
                                    $item->update(['quantity_in_transit' => $item->quantity_issued]);
                                }
                            }
                        }
                    });
                }
            });

        // Completed requisitions: everything issued was received.
        Requisition::query()
            ->where('status', 'completed')
            ->chunkById(100, function ($requisitions) use ($dry) {
                foreach ($requisitions as $req) {
                    if (! $dry) {
                        $req->items()
                            ->where('quantity_received', 0)
                            ->where('quantity_issued', '>', 0)
                            ->update(['quantity_received' => DB::raw('quantity_issued')]);
                    }
                }
            });

        $this->info($dry ? 'Dry run complete.' : 'Backfill complete.');
        return self::SUCCESS;
    }
}
