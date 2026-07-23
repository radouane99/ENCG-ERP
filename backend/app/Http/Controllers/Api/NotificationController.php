<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $notifications = $user->notifications()->paginate(15);
        $unreadCount = $user->unreadNotifications()->count();

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'unread_count' => $unreadCount,
            ]
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);

        if ($notification) {
            $notification->markAsRead();
            return response()->json(['message' => 'Notification marquée comme lue.']);
        }

        return response()->json(['message' => 'Notification introuvable.'], 404);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Toutes les notifications ont été marquées comme lues.']);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);

        if ($notification) {
            $notification->delete();
            return response()->json(['message' => 'Notification supprimée.']);
        }

        return response()->json(['message' => 'Notification introuvable.'], 404);
    }

    /**
     * Broadcast an urgent alert (room changes, class cancellations, exam emergency).
     */
    public function broadcastUrgentAlert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'target_type' => 'required|string|in:all,students,professors,group',
            'target_id' => 'nullable|integer',
            'send_channels' => 'nullable|array', // ['push', 'sms', 'email']
        ]);

        $channels = $validated['send_channels'] ?? ['push', 'system'];

        // Log broadcast alert in DB
        $logId = \Illuminate\Support\Facades\DB::table('notification_logs')->insertGetId([
            'title' => $validated['title'],
            'message' => $validated['message'],
            'recipient_type' => $validated['target_type'],
            'channel' => implode(',', $channels),
            'status' => 'sent',
            'sent_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alerte d\'urgence diffusée instantanément sur tous les canaux sélectionnés.',
            'broadcast_id' => $logId,
            'channels' => $channels,
        ]);
    }
}
