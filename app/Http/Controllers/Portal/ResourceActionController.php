<?php

namespace App\Http\Controllers\Portal;

use App\Actions\Application\StopApplication;
use App\Actions\Database\RestartDatabase;
use App\Actions\Database\StartDatabase;
use App\Actions\Database\StopDatabase;
use App\Actions\Service\RestartService;
use App\Actions\Service\StartService;
use App\Actions\Service\StopService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Visus\Cuid2\Cuid2;

class ResourceActionController extends Controller
{
    /**
     * Start a resource.
     */
    public function start(Request $request, string $type, string $uuid)
    {
        $teamId = auth()->user()->currentTeam()->id;
        $resource = getResourceByUuid($uuid, $teamId);

        if (!$resource) {
            return abort(404, 'Resource not found.');
        }

        $this->authorize('deploy', $resource);

        if ($type === 'application') {
            queue_application_deployment(
                application: $resource,
                deployment_uuid: new Cuid2,
                force_rebuild: false,
                is_api: true,
            );
        } elseif ($type === 'service') {
            StartService::dispatch($resource);
        } else {
            // Assume database
            StartDatabase::dispatch($resource);
        }

        return redirect()->back()->with('success', 'Resource starting.');
    }

    /**
     * Stop a resource.
     */
    public function stop(Request $request, string $type, string $uuid)
    {
        $teamId = auth()->user()->currentTeam()->id;
        $resource = getResourceByUuid($uuid, $teamId);

        if (!$resource) {
            return abort(404, 'Resource not found.');
        }

        $this->authorize('deploy', $resource);

        if ($type === 'application') {
            StopApplication::dispatch($resource, false, true);
        } elseif ($type === 'service') {
            StopService::dispatch($resource);
        } else {
            // Assume database
            StopDatabase::dispatch($resource, true);
        }

        return redirect()->back()->with('success', 'Resource stopping.');
    }

    /**
     * Restart a resource.
     */
    public function restart(Request $request, string $type, string $uuid)
    {
        $teamId = auth()->user()->currentTeam()->id;
        $resource = getResourceByUuid($uuid, $teamId);

        if (!$resource) {
            return abort(404, 'Resource not found.');
        }

        $this->authorize('deploy', $resource);

        if ($type === 'application') {
            queue_application_deployment(
                application: $resource,
                deployment_uuid: new Cuid2,
                restart_only: true,
                is_api: true,
            );
        } elseif ($type === 'service') {
            RestartService::dispatch($resource, pullLatest: false);
        } else {
            // Assume database
            RestartDatabase::dispatch($resource);
        }

        return redirect()->back()->with('success', 'Resource restarting.');
    }
}
