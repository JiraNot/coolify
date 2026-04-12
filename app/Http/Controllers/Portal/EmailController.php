<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\InstanceSettings;
use App\Notifications\TransactionalEmails\Test;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmailController extends Controller
{
    /**
     * Show the email settings page.
     */
    public function show()
    {
        $team = auth()->user()->currentTeam();
        $emailSettings = $team->emailNotificationSettings;

        if (! $emailSettings) {
            $emailSettings = $team->emailNotificationSettings()->create([
                'use_instance_email_settings' => false,
            ]);
        }

        return Inertia::render('Settings/Email/Show', [
            'emailSettings' => $emailSettings,
            'instanceSettings' => InstanceSettings::get(),
        ]);
    }

    /**
     * Update the email settings.
     */
    public function update(Request $request)
    {
        $team = auth()->user()->currentTeam();
        $settings = $team->emailNotificationSettings;

        $validated = $request->validate([
            'use_instance_email_settings' => 'boolean',
            'smtp_enabled' => 'boolean',
            'smtp_from_address' => 'nullable|string',
            'smtp_from_name' => 'nullable|string',
            'smtp_host' => 'nullable|string',
            'smtp_port' => 'nullable|integer',
            'smtp_encryption' => 'nullable|string',
            'smtp_username' => 'nullable|string',
            'smtp_password' => 'nullable|string',
            'smtp_timeout' => 'nullable|integer',
            'resend_enabled' => 'boolean',
            'resend_api_key' => 'nullable|string',
        ]);

        $settings->update($validated);

        return back()->with('success', 'Email settings updated successfully.');
    }

    /**
     * Send a test email.
     */
    public function test(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $team = auth()->user()->currentTeam();

        try {
            $team->notify(new Test($request->email));

            return back()->with('success', 'Test email sent successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['email' => 'Failed to send test email: '.$e->getMessage()]);
        }
    }
}
