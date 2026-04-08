<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Environment;
use App\Models\Project;
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
        ];

        // Safely extract type-specific credentials if available
        if (isset($database->postgres_user)) {
            $dbData['user'] = $database->postgres_user;
            $dbData['password'] = $database->postgres_password;
            $dbData['db_name'] = $database->postgres_db;
            $dbData['type'] = 'postgresql';
        } elseif (isset($database->mysql_user)) {
            $dbData['user'] = $database->mysql_user;
            $dbData['password'] = $database->mysql_password;
            $dbData['db_name'] = $database->mysql_database;
            $dbData['root_password'] = $database->mysql_root_password;
            $dbData['type'] = 'mysql';
        } elseif (isset($database->mariadb_user)) {
            $dbData['user'] = $database->mariadb_user;
            $dbData['password'] = $database->mariadb_password;
            $dbData['db_name'] = $database->mariadb_database;
            $dbData['root_password'] = $database->mariadb_root_password;
            $dbData['type'] = 'mariadb';
        } elseif (isset($database->mongo_initdb_root_username)) {
            $dbData['user'] = $database->mongo_initdb_root_username;
            $dbData['password'] = $database->mongo_initdb_root_password;
            $dbData['db_name'] = $database->mongo_initdb_database;
            $dbData['type'] = 'mongodb';
        } elseif (isset($database->redis_password)) {
            $dbData['password'] = $database->redis_password;
            $dbData['type'] = 'redis';
        } else {
            $dbData['type'] = 'other';
        }

        // Fetch environment variables attached to this database
        $environmentVariables = $database->environment_variables()->get()->map(function ($envVar) {
            return [
                'id' => $envVar->id,
                'key' => $envVar->key,
                'value' => $envVar->value,
                'is_preview' => $envVar->is_preview,
            ];
        });

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
            'user' => auth()->user(),
            'team' => currentTeam(),
        ]);
    }
}
