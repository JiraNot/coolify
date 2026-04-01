<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $team = currentTeam();
        
        // Fetch projects for the current team
        $projects = Project::where('team_id', $team->id)
            ->with(['environments' => function($query) {
                $query->withCount(['applications', 'databases', 'services']);
            }])
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'uuid' => $project->uuid,
                    'name' => $project->name,
                    'description' => $project->description,
                    'environments' => $project->environments->map(function($env) {
                        return [
                            'id' => $env->id,
                            'name' => $env->name,
                            'resources_count' => $env->applications_count + $env->databases_count + $env->services_count,
                        ];
                    }),
                ];
            });

        return Inertia::render('Dashboard', [
            'projects' => $projects,
            'user' => auth()->user(),
            'team' => $team,
        ]);
    }

    public function show(string $uuid)
    {
        $project = Project::where('uuid', $uuid)
            ->where('team_id', currentTeam()->id)
            ->with(['environments.applications', 'environments.postgresqls', 'environments.redis', 'environments.mongodbs', 'environments.mysqls', 'environments.mariadbs', 'environments.keydbs', 'environments.dragonflies', 'environments.clickhouses', 'environments.services'])
            ->firstOrFail();

        $formattedProject = [
            'id' => $project->id,
            'uuid' => $project->uuid,
            'name' => $project->name,
            'description' => $project->description,
            'environments' => $project->environments->map(function ($env) {
                // Combine all resources into one collection for simpler UI handling
                $resources = collect()
                    ->concat($env->applications->map(fn($item) => $this->formatResource($item, 'application', $env)))
                    ->concat($env->postgresqls->map(fn($item) => $this->formatResource($item, 'database', $env)))
                    ->concat($env->redis->map(fn($item) => $this->formatResource($item, 'database', $env)))
                    ->concat($env->mongodbs->map(fn($item) => $this->formatResource($item, 'database', $env)))
                    ->concat($env->mysqls->map(fn($item) => $this->formatResource($item, 'database', $env)))
                    ->concat($env->mariadbs->map(fn($item) => $this->formatResource($item, 'database', $env)))
                    ->concat($env->keydbs->map(fn($item) => $this->formatResource($item, 'database', $env)))
                    ->concat($env->dragonflies->map(fn($item) => $this->formatResource($item, 'database', $env)))
                    ->concat($env->clickhouses->map(fn($item) => $this->formatResource($item, 'database', $env)))
                    ->concat($env->services->map(fn($item) => $this->formatResource($item, 'service', $env)));

                return [
                    'id' => $env->id,
                    'uuid' => $env->uuid,
                    'name' => $env->name,
                    'resources' => $resources,
                ];
            }),
        ];

        return Inertia::render('Project/Show', [
            'project' => $formattedProject,
            'user' => auth()->user(),
            'team' => currentTeam(),
        ]);
    }

    private function formatResource($item, $type, $env)
    {
        $routePrefix = $type === 'application' ? 'application' : ($type === 'service' ? 'service' : 'database');
        
        return [
            'id' => $item->id,
            'uuid' => $item->uuid,
            'name' => $item->name,
            'type' => $type,
            'status' => $item->status ?? 'running',
            'updated_at' => $item->updated_at?->diffForHumans(),
            'url' => route("project.{$routePrefix}.configuration", [
                'project_uuid' => $env->project->uuid,
                'environment_uuid' => $env->uuid,
                "{$routePrefix}_uuid" => $item->uuid,
            ]),
        ];
    }
}
