<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect('/portal');
        }

        return Inertia::render('Login', [
            'csrf_token' => csrf_token(),
            'status' => session('status'),
            'errors' => session()->get('errors') ? session()->get('errors')->getBag('default')->getMessages() : [],
        ]);
    }
}
