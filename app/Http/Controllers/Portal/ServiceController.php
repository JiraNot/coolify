<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Environment;
use App\Models\Project;
use App\Models\Service;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function show(string $project_uuid, string $environment_uuid, string $service_uuid): \Inertia\Response
    {
        $project = Project::where('uuid', $project_uuid)
            ->where('team_id', currentTeam()->id)
            ->firstOrFail();

        $environment = Environment::where('uuid', $environment_uuid)
            ->where('project_id', $project->id)
            ->firstOrFail();

        $service = Service::where('uuid', $service_uuid)
            ->where('environment_id', $environment->id)
            ->with(['applications', 'databases.scheduledBackups'])
            ->firstOrFail();

        // Get all applications inside the service stack
        $serviceApplications = $service->applications->map(function ($app) {
            return [
                'id' => $app->id,
                'uuid' => $app->uuid,
                'name' => $app->name,
                'status' => $app->status,
                'fqdn' => $app->fqdn,
                'image' => $app->image,
            ];
        });

        // Get all databases inside the service stack
        $serviceDatabases = $service->databases->map(function ($db) {
            return [
                'id' => $db->id,
                'uuid' => $db->uuid,
                'name' => $db->name,
                'status' => $db->status,
                'image' => $db->image,
            ];
        });

        // Collect ALL backups for all databases in this service
        $backups = $service->databases->flatMap(function ($db) {
            return $db->scheduledBackups->map(function ($backup) use ($db) {
                return [
                    'id' => $backup->id,
                    'uuid' => $backup->uuid,
                    'enabled' => $backup->enabled,
                    'frequency' => $backup->frequency,
                    'last_run' => $backup->last_run_at?->diffForHumans(),
                    'next_run' => $backup->next_run_at?->diffForHumans(),
                    'database_name' => $db->name,
                ];
            });
        });

        // Environment variables for the service
        $environmentVariables = $service->environment_variables()->get()->map(function ($envVar) {
            return [
                'id' => $envVar->id,
                'uuid' => $envVar->uuid,
                'key' => $envVar->key,
                'value' => $envVar->value,
                'is_preview' => $envVar->is_preview,
            ];
        });

        return Inertia::render('Project/Service/Show', [
            'project' => [
                'uuid' => $project->uuid,
                'name' => $project->name,
            ],
            'environment' => [
                'uuid' => $environment->uuid,
                'name' => $environment->name,
            ],
            'service' => [
                'id' => $service->id,
                'uuid' => $service->uuid,
                'name' => $service->name,
                'description' => $service->description,
                'status' => $service->status,
                'service_type' => $service->service_type,
                'connect_to_docker_network' => $service->connect_to_docker_network,
                'extra_fields' => $service->extraFields(),
                'created_at' => $service->created_at?->diffForHumans(),
                'updated_at' => $service->updated_at?->diffForHumans(),
                'native_url' => route('project.service.configuration', [
                    'project_uuid' => $project->uuid,
                    'environment_uuid' => $environment->uuid,
                    'service_uuid' => $service->uuid,
                ]),
            ],
            'serviceApplications' => $serviceApplications,
            'serviceDatabases' => $serviceDatabases,
            'backups' => $backups,
            'environmentVariables' => $environmentVariables,
            'user' => auth()->user(),
            'team' => currentTeam(),
        ]);
    }

    /**
     * Get container logs for a specific service component.
     */
    public function logs(string $service_uuid)
    {
        $teamId = currentTeam()->id;
        $service = Service::whereRelation('environment.project.team', 'id', $teamId)
            ->where('uuid', $service_uuid)
            ->firstOrFail();

        $targetUuid = request()->query('target_uuid');
        $target = null;

        if ($targetUuid) {
            $target = $service->applications()->where('uuid', $targetUuid)->first()
                ?? $service->databases()->where('uuid', $targetUuid)->first();
        }

        // Default to first application if no target specified
        if (! $target) {
            $target = $service->applications()->first()
                ?? $service->databases()->first();
        }

        if (! $target) {
            return response()->json(['error' => 'No loggable components found'], 404);
        }

        $server = $service->server;
        $containerName = $target->name.'-'.$service->uuid;

        if (! $server->isFunctional()) {
            return response()->json(['error' => 'Server is not functional'], 500);
        }

        $numberOfLines = request()->query('lines', 100);
        $command = "docker logs -n {$numberOfLines} {$containerName}";

        if ($server->isNonRoot()) {
            $command = parseCommandsByLineForSudo(collect([$command]), $server)[0];
        }

        $sshCommand = \App\Helpers\SshMultiplexingHelper::generateSshCommand($server, $command);

        $logChunks = [];
        \Illuminate\Support\Facades\Process::timeout(config('constants.ssh.command_timeout'))
            ->run($sshCommand, function (string $type, string $output) use (&$logChunks) {
                $logChunks[] = removeAnsiColors($output);
            });

        return response()->json([
            'logs' => implode('', $logChunks),
            'target_name' => $target->name,
            'target_uuid' => $target->uuid,
        ]);
    }

    public function metrics(string $service_uuid)
    {
        $teamId = currentTeam()->id;
        $service = Service::whereRelation('environment.project.team', 'id', $teamId)
            ->where('uuid', $service_uuid)
            ->with(['applications', 'databases'])
            ->firstOrFail();

        $metrics = [];

        foreach ($service->applications as $app) {
            try {
                $metrics[$app->uuid] = [
                    'name' => $app->name,
                    'cpu' => $app->getCpuMetrics(1),
                    'memory' => $app->getMemoryMetrics(1),
                ];
            } catch (\Exception $e) {
                // Skip if metrics fail for one container
            }
        }

        foreach ($service->databases as $db) {
            try {
                $metrics[$db->uuid] = [
                    'name' => $db->name,
                    'cpu' => $db->getCpuMetrics(1),
                    'memory' => $db->getMemoryMetrics(1),
                ];
            } catch (\Exception $e) {
                // Skip if metrics fail for one container
            }
        }

        return response()->json($metrics);
    }

    public function applicationMetrics(string $uuid)
    {
        $teamId = currentTeam()->id;
        $app = \App\Models\ServiceApplication::where('uuid', $uuid)
            ->whereRelation('service.environment.project.team', 'id', $teamId)
            ->firstOrFail();

        try {
            return response()->json([
                'cpu' => $app->getCpuMetrics(1),
                'memory' => $app->getMemoryMetrics(1),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function databaseMetrics(string $uuid)
    {
        $teamId = currentTeam()->id;
        $db = \App\Models\ServiceDatabase::where('uuid', $uuid)
            ->whereRelation('service.environment.project.team', 'id', $teamId)
            ->firstOrFail();

        try {
            return response()->json([
                'cpu' => $db->getCpuMetrics(1),
                'memory' => $db->getMemoryMetrics(1),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(string $service_uuid): \Illuminate\Http\RedirectResponse
    {
        $teamId = currentTeam()->id;

        $service = Service::whereRelation('environment.project.team', 'id', $teamId)
            ->where('uuid', $service_uuid)
            ->firstOrFail();

        $data = request()->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $service->update($data);

        return back()->with('success', 'Service updated successfully.');
    }

    public function destroy(string $service_uuid)
    {
        $teamId = currentTeam()->id;
        $service = Service::whereRelation('environment.project.team', 'id', $teamId)
            ->where('uuid', $service_uuid)
            ->firstOrFail();

        $delete_volumes = request()->boolean('delete_volumes', true);
        $docker_cleanup = request()->boolean('docker_cleanup', true);

        try {
            // Stop and cleanup containers before deleting the model
            \App\Actions\Service\StopService::dispatch($service, $delete_volumes, $docker_cleanup);
            $service->delete();

            return redirect()->route('portal.dashboard')->with('success', 'Service deletion initiated and removed from portal.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete service: '.$e->getMessage());
        }
    }

    public function storeVariable(string $service_uuid): \Illuminate\Http\RedirectResponse
    {
        $teamId = currentTeam()->id;

        $service = Service::whereRelation('environment.project.team', 'id', $teamId)
            ->where('uuid', $service_uuid)
            ->firstOrFail();

        $data = request()->validate([
            'key' => 'required|string',
            'value' => 'nullable|string',
        ]);

        $service->environment_variables()->create([
            'key' => $data['key'],
            'value' => $data['value'],
            'is_buildtime' => false,
            'is_runtime' => true,
            'is_preview' => false,
        ]);

        return back()->with('success', 'Environment variable added.');
    }

    public function deleteVariable(string $service_uuid, string $varId): \Illuminate\Http\RedirectResponse
    {
        $teamId = currentTeam()->id;

        $service = Service::whereRelation('environment.project.team', 'id', $teamId)
            ->where('uuid', $service_uuid)
            ->firstOrFail();

        $service->environment_variables()->where('id', $varId)->delete();

        return back()->with('success', 'Environment variable deleted.');
    }
}
