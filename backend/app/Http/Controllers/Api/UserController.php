<?php
namespace App\Http\Controllers\Api;

use App\Actions\Auth\ManageUserAccessAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function __construct(private ManageUserAccessAction $access) {}
    private function resolve(Request $request, string $id): User
    {
        $q = User::with('roles')->where('institution_id', $request->user()->institution_id);
        return (ctype_digit($id) ? $q->whereKey((int) $id) : $q->where('uuid', $id))->firstOrFail();
    }
    public function index(Request $request)
    {
        abort_unless($request->user()->can('users.view'), 403);
        $users = User::with('roles')->where('institution_id', $request->user()->institution_id)->whereDoesntHave('roles', fn ($q) => $q->where('name', 'student'))->orderBy('id')->get();
        return response()->json(['success' => true, 'data' => UserResource::collection($users)]);
    }
    public function store(Request $request)
    {
        abort_unless($request->user()->can('users.manage'), 403);
        $data = $request->validate(['name' => 'required|string|max:255', 'first_name' => 'nullable|string|max:100', 'last_name' => 'nullable|string|max:100',
            'email' => 'required|email|max:255|unique:users,email', 'password' => 'required|string|min:12', 'role' => 'required|string']);
        $user = DB::transaction(function () use ($request, $data) {
            $user = User::create(array_diff_key($data, ['role' => true]) + ['institution_id' => $request->user()->institution_id]);
            return $this->access->execute($request->user(), $user, [$data['role']]);
        });
        return response()->json(['success' => true, 'data' => new UserResource($user)], 201);
    }
    public function show(Request $request, string $id)
    {
        abort_unless($request->user()->can('users.view'), 403);
        return response()->json(['success' => true, 'data' => new UserResource($this->resolve($request, $id))]);
    }
    public function update(Request $request, string $id)
    {
        abort_unless($request->user()->can('users.manage'), 403);
        $user = $this->resolve($request, $id); $this->access->assertManageable($request->user(), $user);
        $data = $request->validate(['name' => 'sometimes|required|string|max:255', 'email' => 'sometimes|required|email|max:255|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:12|confirmed', 'role' => 'sometimes|required|string']);
        DB::transaction(function () use ($request, $user, $data) {
            if (isset($data['role'])) $this->access->execute($request->user(), $user, [$data['role']]);
            unset($data['role']); if (empty($data['password'])) unset($data['password']);
            $user->fill($data)->save();
            activity()->causedBy($request->user())->performedOn($user)->log('user_updated');
        });
        return response()->json(['success' => true, 'message' => 'Utilisateur mis à jour.', 'data' => new UserResource($user->fresh('roles'))]);
    }
    public function destroy(Request $request, string $id)
    {
        abort_unless($request->user()->can('users.manage'), 403);
        $user = $this->resolve($request, $id); $this->access->assertManageable($request->user(), $user);
        abort_if($user->id === $request->user()->id || $user->hasAnyRole(['super-admin', 'super_admin']), 422, 'Ce compte ne peut pas être supprimé.');
        $user->update(['is_active' => false]); $user->tokens()->delete();
        activity()->causedBy($request->user())->performedOn($user)->log('user_disabled');
        return response()->json(['success' => true, 'message' => 'Compte désactivé ; historique conservé.']);
    }
}
