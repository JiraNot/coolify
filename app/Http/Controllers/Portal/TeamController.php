<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TeamController extends Controller
{
    /**
     * Switch the current team in the session.
     */
    public function switchTeam(Request $request, $team_id)
    {
        $user = Auth::user();

        // Ensure user belongs to the target team
        $team = $user->teams()->find($team_id);

        if (! $team) {
            return redirect()->back()->with('error', 'You do not have access to this team.');
        }

        // Use Coolify's shared helper to update session and cache
        refreshSession($team);

        return redirect()->route('portal.dashboard');
    }
}
