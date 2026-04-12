<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Environment;
use App\Models\GithubApp;
use App\Models\Project;
use App\Models\Service;
use App\Models\StandaloneDocker;
use App\Models\SwarmDocker;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    public function storeApplication(Request $request, string $project_uuid, string $environment_uuid)
    {
        $project = Project::where('uuid', $project_uuid)
            ->where('team_id', currentTeam()->id)
            ->firstOrFail();

        $environment = Environment::where('uuid', $environment_uuid)
            ->where('project_id', $project->id)
            ->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'git_repository' => 'required|string',
            'git_branch' => 'required|string',
            'build_pack' => 'required|string',
            'destination_uuid' => 'required|string',
            'port' => 'nullable|integer',
            'source_id' => 'nullable|integer',
        ]);

        $destination = StandaloneDocker::where('uuid', $request->destination_uuid)->first()
            ?? SwarmDocker::where('uuid', $request->destination_uuid)->firstOrFail();

        $application_init = [
            'name' => $request->name,
            'git_repository' => $request->git_repository,
            'git_branch' => $request->git_branch,
            'ports_exposes' => $request->port ?? 3000,
            'environment_id' => $environment->id,
            'destination_id' => $destination->id,
            'destination_type' => $destination->getMorphClass(),
            'build_pack' => $request->build_pack,
            'base_directory' => '/',
        ];

        if ($request->source_id) {
            $source = GithubApp::findOrFail($request->source_id);
            $application_init['source_id'] = $source->id;
            $application_init['source_type'] = $source->getMorphClass();
        } else {
            $application_init['source_id'] = 0;
            $application_init['source_type'] = 'App\Models\GithubApp';
        }

        $application = Application::create($application_init);

        // Generate default FQDN
        $fqdn = generateUrl(server: $destination->server, random: $application->uuid);
        $application->fqdn = $fqdn;
        $application->save();

        return redirect()->route('portal.project.application.show', [
            'project_uuid' => $project->uuid,
            'environment_uuid' => $environment->uuid,
            'application_uuid' => $application->uuid,
        ])->with('success', 'Application created successfully.');
    }

    public function storeDatabase(Request $request, string $project_uuid, string $environment_uuid)
    {
        $project = Project::where('uuid', $project_uuid)
            ->where('team_id', currentTeam()->id)
            ->firstOrFail();

        $environment = Environment::where('uuid', $environment_uuid)
            ->where('project_id', $project->id)
            ->firstOrFail();

        $request->validate([
            'name' => 'nullable|string|max:255',
            'type' => 'required|in:postgresql,redis,mongodb,mysql,mariadb,keydb,dragonfly,clickhouse',
            'destination_uuid' => 'required|string',
            'image' => 'nullable|string',
        ]);

        $type = $request->type;
        $destination_uuid = $request->destination_uuid;
        $otherData = $request->name ? ['name' => $request->name] : null;

        $database = null;

        switch ($type) {
            case 'postgresql':
                $database = create_standalone_postgresql($environment->id, $destination_uuid, $otherData, $request->image ?? 'postgres:16-alpine');
                break;
            case 'redis':
                $database = create_standalone_redis($environment->id, $destination_uuid, $otherData);
                break;
            case 'mongodb':
                $database = create_standalone_mongodb($environment->id, $destination_uuid, $otherData);
                break;
            case 'mysql':
                $database = create_standalone_mysql($environment->id, $destination_uuid, $otherData);
                break;
            case 'mariadb':
                $database = create_standalone_mariadb($environment->id, $destination_uuid, $otherData);
                break;
            case 'keydb':
                $database = create_standalone_keydb($environment->id, $destination_uuid, $otherData);
                break;
            case 'dragonfly':
                $database = create_standalone_dragonfly($environment->id, $destination_uuid, $otherData);
                break;
            case 'clickhouse':
                $database = create_standalone_clickhouse($environment->id, $destination_uuid, $otherData);
                break;
        }

        return redirect()->route('portal.project.database.show', [
            'project_uuid' => $project->uuid,
            'environment_uuid' => $environment->uuid,
            'database_uuid' => $database->uuid,
        ])->with('success', ucfirst($type).' database created successfully.');
    }

    public function storeService(Request $request, string $project_uuid, string $environment_uuid)
    {
        $project = Project::where('uuid', $project_uuid)
            ->where('team_id', currentTeam()->id)
            ->firstOrFail();

        $environment = Environment::where('uuid', $environment_uuid)
            ->where('project_id', $project->id)
            ->firstOrFail();

        $request->validate([
            'service_type' => 'required|string',
            'destination_uuid' => 'required|string',
        ]);

        $services = get_service_templates();
        $service_name = $request->service_type;
        $template = data_get($services, $service_name);

        if (! $template) {
            return back()->withErrors(['service_type' => 'Invalid service template.']);
        }

        $destination = StandaloneDocker::where('uuid', $request->destination_uuid)->firstOrFail();

        $service_payload = [
            'docker_compose_raw' => base64_decode(data_get($template, 'compose')),
            'environment_id' => $environment->id,
            'service_type' => $service_name,
            'server_id' => $destination->server->id,
            'destination_id' => $destination->id,
            'destination_type' => $destination->getMorphClass(),
        ];

        if (in_array($service_name, NEEDS_TO_CONNECT_TO_PREDEFINED_NETWORK)) {
            data_set($service_payload, 'connect_to_docker_network', true);
        }

        $service = Service::create($service_payload);
        $service->name = "{$service_name}-".$service->uuid;
        $service->save();

        // Handle default envs if any
        $envs = data_get($template, 'envs');
        if ($envs) {
            $envs = str(base64_decode($envs))->split('/\r\n|\r|\n/')->filter(fn ($v) => ! empty($v));
            foreach ($envs as $env) {
                $key = str($env)->before('=');
                $value = str($env)->after('=');
                if ($key && $value) {
                    \App\Models\EnvironmentVariable::create([
                        'key' => $key,
                        'value' => $value,
                        'resourceable_id' => $service->id,
                        'resourceable_type' => $service->getMorphClass(),
                        'is_preview' => false,
                    ]);
                }
            }
        }

        $service->parse(isNew: true);
        applyServiceApplicationPrerequisites($service);

        return redirect()->route('portal.project.service.show', [
            'project_uuid' => $project->uuid,
            'environment_uuid' => $environment->uuid,
            'service_uuid' => $service->uuid,
        ])->with('success', 'Service created successfully.');
    }
}
