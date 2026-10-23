<?php
namespace App\Http\Controllers\Api\Admin;

use App\Actions\Finance\ManageTuitionInvoiceAction;
use App\Http\Controllers\Controller;
use App\Models\{AcademicYear, Filiere, Student};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TuitionFinanceController extends Controller
{
    public function __construct(private ManageTuitionInvoiceAction $action) {}
    private function query(Request $r) { $this->action->authorize($r->user()); return DB::table('tuition_invoices')->whereIn('student_id', Student::where('institution_id', $r->user()->institution_id)->select('id')); }
    public function stats(Request $r)
    {
        $q = $this->query($r); $list = clone $q;
        if ($r->filled('search')) {
            $term = mb_substr($r->string('search')->toString(), 0, 150);
            $list->where(fn ($query) => $query->whereLike('reference', '%'.$term.'%')->orWhereIn('student_id', Student::where('institution_id', $r->user()->institution_id)->where(fn ($s) => $s->whereLike('cne', '%'.$term.'%')->orWhereHas('user', fn ($u) => $u->whereLike('name', '%'.$term.'%')))->select('id')));
        }
        if ($r->input('status') === 'PAID') $list->where('status', 'paid');
        if ($r->input('status') === 'LATE') $list->where('status', '!=', 'paid')->where('due_on', '<', now()->toDateString());
        if ($r->input('status') === 'PENDING') $list->where('status', '!=', 'paid')->where('due_on', '>=', now()->toDateString());
        $rows = $list->orderByDesc('id')->paginate(min(100, max(1, $r->integer('per_page', 20))));
        $students = Student::with('user')->whereIn('id', collect($rows->items())->pluck('student_id'))->get()->keyBy('id');
        $filieres = Filiere::whereIn('id', collect($rows->items())->pluck('filiere_id'))->get()->keyBy('id');
        $payments = collect($rows->items())->map(fn ($i) => ['id' => $i->id, 'name' => $students[$i->student_id]->user->name, 'student_id' => $i->student_id,
            'cne' => $students[$i->student_id]->cne, 'type' => $filieres[$i->filiere_id]->name, 'tranche' => $i->reference, 'method' => 'Vérification par la régie',
            'amount' => number_format((float) $i->amount, 2).' MAD', 'paid_amount' => (float) $i->paid_amount, 'remaining_amount' => round((float) $i->amount - (float) $i->paid_amount, 2), 'date' => $i->due_on,
            'status' => $i->status === 'paid' ? 'PAID' : ($i->due_on < now()->toDateString() ? 'LATE' : 'PENDING'), 'receipt_number' => $i->reference]);
        $total = (float) (clone $q)->sum('amount'); $paid = (float) (clone $q)->sum('paid_amount');
        return response()->json(['success' => true, 'data' => ['revenue_month' => number_format((float) DB::table('tuition_payments')->whereIn('invoice_id', (clone $q)->select('id'))->where('verified_at', '>=', now()->startOfMonth())->sum('amount'), 2).' MAD',
            'unpaid_amount' => number_format($total - $paid, 2).' MAD', 'unpaid_count' => (clone $q)->where('status', '!=', 'paid')->count(), 'club_budget' => null, 'scholarship_total' => null,
            'payments' => $payments, 'meta' => ['current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'total' => $rows->total()]]]);
    }
    public function options(Request $r)
    {
        $this->action->authorize($r->user()); $students = Student::with('user')->where('institution_id', $r->user()->institution_id);
        if ($r->filled('search')) $students->where(function ($q) use ($r) { $q->where('cne', 'like', '%'.$r->input('search').'%')->orWhereHas('user', fn ($u) => $u->where('name', 'like', '%'.$r->input('search').'%')); });
        return response()->json(['students' => $students->limit(50)->get()->map(fn ($s) => ['id' => $s->id, 'name' => $s->user->name, 'cne' => $s->cne]),
            'years' => AcademicYear::where('institution_id', $r->user()->institution_id)->get(['id', 'label']),
            'filieres' => Filiere::where('institution_id', $r->user()->institution_id)->whereIn('type', \App\Domain\Deliberation\LmdRules::PAID_FILIERE_TYPES)->get(['id', 'name'])]);
    }
    public function store(Request $r)
    {
        $data = $r->validate(['student_id' => 'required|integer', 'academic_year_id' => 'required|integer', 'filiere_id' => 'required|integer', 'amount' => 'required|numeric|min:0.01|max:99999999|decimal:0,2', 'due_on' => 'required|date_format:Y-m-d']);
        return response()->json(['success' => true, 'invoice' => $this->action->create($r->user(), $data)], 201);
    }
    public function validatePayment(Request $r, int $id)
    {
        $data = $r->validate(['reference' => 'required|string|min:4|max:150', 'amount' => 'required|numeric|min:0.01|max:99999999|decimal:0,2',
            'provider' => 'required|in:bank,cash,cmi,wafacash', 'verification_note' => 'required|string|min:10|max:2000', 'receipt_verified' => 'required|accepted']);
        return response()->json(['success' => true, 'payment' => $this->action->confirm($r->user(), $id, $data)]);
    }
    public function remind(Request $r, ?int $id = null)
    {
        $q = $this->query($r)->where('status', '!=', 'paid'); if ($id !== null) $q->where('id', $id);
        $rows = $q->get(); foreach ($rows as $i) Student::with('user')->findOrFail($i->student_id)->user->notify(new \App\Notifications\SystemNotification('Rappel de règlement', 'La facture '.$i->reference.' présente un solde à régulariser auprès de la régie.', 'info', '/student/reinscription'));
        return response()->json(['success' => true, 'message' => 'Rappels enregistrés dans les espaces personnels.', 'sent_count' => $rows->count()]);
    }
}
