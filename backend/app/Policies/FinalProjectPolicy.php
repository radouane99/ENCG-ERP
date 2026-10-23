<?php
namespace App\Policies;
use App\Models\{FinalProject, User};
use App\Support\InternshipAccess;

class FinalProjectPolicy
{
    public function viewAny(User $user): bool { return $user->hasAnyRole(['student', 'professor', 'vacataire', 'scolarite']) || InternshipAccess::staff($user); }
    public function view(User $user, FinalProject $p): bool
    {
        return (int) $p->student->institution_id === (int) $user->institution_id && (InternshipAccess::staff($user) || $user->hasRole('scolarite') || (int) $user->student?->id === (int) $p->student_id || (int) $p->supervisor_id === (int) $user->id);
    }
    public function create(User $user): bool { return $user->hasRole('student') || InternshipAccess::staff($user) || $user->hasRole('scolarite'); }
    public function update(User $user, FinalProject $p): bool { return $this->view($user, $p); }
    public function delete(User $user, FinalProject $p): bool { return $this->view($user, $p) && (InternshipAccess::staff($user) || (int) $user->student?->id === (int) $p->student_id); }
}
