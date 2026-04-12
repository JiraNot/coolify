<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Application;
use Inertia\Inertia;

class ApplicationController extends Controller
{
    /**
     * Display the application details.
     */
    public function show(string $project_uuid, string $environment_uuid, string $application_uuid)
    {
        $team = auth()->user()->currentTeam();

        $project = \App\Models\Project::where('uuid', $project_uuid)
            ->where('team_id', $team->id)
            ->firstOrFail();

        $environment = \App\Models\Environment::where('uuid', $environment_uuid)
            ->where('project_id', $project->id)
            ->firstOrFail();

        $application = Application::where('uuid', $application_uuid)
            ->where('environment_id', $environment->id)
            ->with(['destination.server', 'environment_variables'])
            ->firstOrFail();

        return Inertia::render('Project/Application/Show', [
            'project' => [
                'uuid' => $project->uuid,
                'name' => $project->name,
            ],
            'environment' => [
                'uuid' => $environment->uuid,
                'name' => $environment->name,
            ],
            'application' => [
                'id' => $application->id,
                'uuid' => $application->uuid,
                'name' => $application->name,
                'description' => $application->description,
                'status' => $application->status,
                'fqdn' => $application->fqdn,
                'build_pack' => $application->build_pack,
                'ports_exposes' => $application->ports_exposes,
                'git_repository' => $application->git_repository,
                'git_branch' => $application->git_branch,
                'git_commit_sha' => $application->git_commit_sha,
                'destination' => [
                    'server' => [
                        'name' => $application->destination?->server?->name,
                    ],
                ],
                'native_url' => route('project.application.configuration', [
                    'project_uuid' => $project->uuid,
                    'environment_uuid' => $environment->uuid,
                    'application_uuid' => $application->uuid,
                ]),
            ],
            'environmentVariables' => $application->environment_variables,
            'user' => auth()->user(),
            'team' => $team,
        ]);
    }

    /**
     * Get real-time metrics for the application.
     */
    public function metrics(string $uuid)
    {
        $teamId = auth()->user()->currentTeam()->id;
        $application = Application::where('uuid', $uuid)
            ->whereRelation('environment.project.team', 'id', $teamId)
            ->firstOrFail();

        try {
            return response()->json([
                'cpu' => $application->getCpuMetrics(1),
                'memory' => $application->getMemoryMetrics(1),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the application settings.
     */
    public function update(string $uuid)
    {
        $teamId = auth()->user()->currentTeam()->id;
        $application = Application::where('uuid', $uuid)
            ->whereRelation('environment.project.team', 'id', $teamId)
            ->firstOrFail();

        $data = request()->validate([
            'name' => 'required|string|max:255',
            'fqdn' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $application->update($data);

        return back()->with('success', 'Application updated successfully.');
    }

    /**
     * Store a new environment variable.
     */
    public function storeVariable(string $uuid)
    {
        $teamId = auth()->user()->currentTeam()->id;
        $application = Application::where('uuid', $uuid)
            ->whereRelation('environment.project.team', 'id', $teamId)
            ->firstOrFail();

        $data = request()->validate([
            'key' => 'required|string',
            'value' => 'nullable|string',
            'is_buildtime' => 'boolean',
            'is_runtime' => 'boolean',
        ]);

        $application->environment_variables()->create([
            'key' => $data['key'],
            'value' => $data['value'],
            'is_buildtime' => $data['is_buildtime'] ?? true,
            'is_runtime' => $data['is_runtime'] ?? true,
            'is_preview' => false,
        ]);

        return back()->with('success', 'Environment variable added.');
    }

    /**
     * Delete an environment variable.
     */
    public function deleteVariable(string $uuid, string $varId)
    {
        $teamId = auth()->user()->currentTeam()->id;
        $application = Application::where('uuid', $uuid)
            ->whereRelation('environment.project.team', 'id', $teamId)
            ->firstOrFail();

        $application->environment_variables()->where('id', $varId)->delete();

        return back()->with('success', 'Environment variable deleted.');
    }

    /**
     * Get container logs for the application.
     */
    public function logs(string $uuid)
    {
        $teamId = auth()->user()->currentTeam()->id;
        $application = Application::where('uuid', $uuid)
            ->whereRelation('environment.project.team', 'id', $teamId)
            ->with(['destination.server'])
            ->firstOrFail();

        $server = $application->destination->server;
        $containerName = $application->uuid; // Coolify standard is the UUID or name-hash

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
