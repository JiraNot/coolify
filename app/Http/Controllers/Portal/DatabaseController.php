<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Environment;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DatabaseController extends Controller
{
    public function show(string $project_uuid, string $environment_uuid, string $database_uuid)
    {
        $project = Project::where('uuid', $project_uuid)
            ->where('team_id', currentTeam()->id)
            ->firstOrFail();

        $environment = Environment::where('uuid', $environment_uuid)
            ->where('project_id', $project->id)
            ->firstOrFail();

        // Use the same helper relation to fetch any type of database
        $database = $environment->databases()
            ->where('uuid', $database_uuid)
            ->firstOrFail();

        // Base database information
        $dbData = [
            'id' => $database->id,
            'uuid' => $database->uuid,
            'name' => $database->name,
            'description' => $database->description,
            'status' => $database->status,
            'image' => $database->image,
            'internal_db_url' => $database->internal_db_url,
            'external_db_url' => $database->external_db_url,
            'is_public' => $database->is_public,
            'public_port' => $database->public_port,
            'created_at' => $database->created_at?->diffForHumans(),
            'updated_at' => $database->updated_at?->diffForHumans(),
            'type' => str($database->getMorphClass())->afterLast('\\')->replace('Standalone', '')->lower()->value(),
            'native_url' => route('project.database.configuration', [
                'project_uuid' => $project->uuid,
                'environment_uuid' => $environment->uuid,
                'database_uuid' => $database->uuid,
            ]),
        ];

        // Safely extract type-specific credentials if available
        if ($dbData['type'] === 'postgresql') {
            $dbData['user'] = $database->postgres_user;
            $dbData['password'] = $database->postgres_password;
            $dbData['db_name'] = $database->postgres_db;
        } elseif ($dbData['type'] === 'mysql') {
            $dbData['user'] = $database->mysql_user;
            $dbData['password'] = $database->mysql_password;
            $dbData['db_name'] = $database->mysql_database;
            $dbData['root_password'] = $database->mysql_root_password;
        } elseif ($dbData['type'] === 'mariadb') {
            $dbData['user'] = $database->mariadb_user;
            $dbData['password'] = $database->mariadb_password;
            $dbData['db_name'] = $database->mariadb_database;
            $dbData['root_password'] = $database->mariadb_root_password;
        } elseif ($dbData['type'] === 'mongodb') {
            $dbData['user'] = $database->mongo_initdb_root_username;
            $dbData['password'] = $database->mongo_initdb_root_password;
            $dbData['db_name'] = $database->mongo_initdb_database;
        } elseif ($dbData['type'] === 'redis' || $dbData['type'] === 'keydb' || $dbData['type'] === 'dragonfly') {
            $dbData['password'] = $database->redis_password;
        } elseif ($dbData['type'] === 'clickhouse') {
            $dbData['user'] = $database->clickhouse_admin_user;
            $dbData['password'] = $database->clickhouse_admin_password;
            $dbData['db_name'] = $database->clickhouse_db;
        }

        // Fetch environment variables
        $environmentVariables = $database->environment_variables()->get()->map(function ($envVar) {
            return [
                'id' => $envVar->id,
                'key' => $envVar->key,
                'value' => $envVar->value,
                'is_preview' => $envVar->is_preview,
            ];
        });

        // Fetch backups if possible
        $backups = $database->scheduledBackups()->with(['executions' => function ($query) {
            $query->latest()->limit(5);
        }])->get();

        return Inertia::render('Project/Database/Show', [
            'project' => [
                'uuid' => $project->uuid,
                'name' => $project->name,
            ],
            'environment' => [
                'uuid' => $environment->uuid,
                'name' => $environment->name,
            ],
            'database' => $dbData,
            'environmentVariables' => $environmentVariables,
            'backups' => $backups,
            'user' => auth()->user(),
            'team' => currentTeam(),
        ]);
    }

    /**
     * Get real-time metrics for the database container.
     */
    public function metrics(string $uuid)
    {
        $teamId = currentTeam()->id;

        $database = \App\Models\StandalonePostgresql::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneRedis::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneMongodb::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneMysql::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneMariadb::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneKeydb::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneDragonfly::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneClickhouse::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->firstOrFail();

        try {
            return response()->json([
                'cpu' => $database->getCpuMetrics(1),
                'memory' => $database->getMemoryMetrics(1),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update the database settings.
     */
    public function update(string $database_uuid)
    {
        $database = $this->getDatabase($database_uuid);

        $data = request()->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
            'public_port' => 'nullable|integer',
        ]);

        $database->update($data);

        return back()->with('success', 'Database updated successfully.');
    }

    /**
     * Delete the database.
     */
    public function destroy(Request $request, string $database_uuid)
    {
        $database = $this->getDatabase($database_uuid);

        $deleteVolumes = $request->boolean('delete_volumes', true);
        $dockerCleanup = $request->boolean('docker_cleanup', true);
        $deleteConfigurations = $request->boolean('delete_configurations', true);

        \App\Jobs\DeleteResourceJob::dispatch(
            $database,
            $deleteVolumes,
            false, // deleteConnectedNetworks
            $deleteConfigurations,
            $dockerCleanup
        );

        $database->delete();

        return redirect()->route('portal.project.show', [
            'uuid' => $database->environment->project->uuid,
        ])->with('success', 'Database deletion initiated.');
    }

    /**
     * Store a new environment variable.
     */
    public function storeVariable(string $database_uuid)
    {
        $database = $this->getDatabase($database_uuid);

        $data = request()->validate([
            'key' => 'required|string',
            'value' => 'nullable|string',
        ]);

        $database->environment_variables()->create([
            'key' => $data['key'],
            'value' => $data['value'],
            'is_buildtime' => false,
            'is_runtime' => true,
            'is_preview' => false,
        ]);

        return back()->with('success', 'Environment variable added.');
    }

    /**
     * Delete an environment variable.
     */
    public function deleteVariable(string $database_uuid, string $varId)
    {
        $database = $this->getDatabase($database_uuid);
        $database->environment_variables()->where('id', $varId)->delete();

        return back()->with('success', 'Environment variable deleted.');
    }

    /**
     * Helper to get database genericly
     */
    private function getDatabase(string $uuid)
    {
        $teamId = currentTeam()->id;

        return \App\Models\StandalonePostgresql::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneRedis::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneMongodb::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneMysql::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneMariadb::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneKeydb::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneDragonfly::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->first()
            ?? \App\Models\StandaloneClickhouse::where('uuid', $uuid)->whereRelation('environment.project.team', 'id', $teamId)->firstOrFail();
    }

    /**
     * Get container logs for the database.
     */
    public function logs(string $uuid)
    {
        $database = $this->getDatabase($uuid);
        $server = $database->destination->server;
        $containerName = $database->uuid;

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
        ]);
    }
}
