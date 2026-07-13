$request = Illuminate\Http\Request::create('/api/hr/vacataires', 'POST', [
    'first_name' => 'T',
    'last_name' => 'T',
    'email' => 't' . time() . '@t.com',
    'phone' => '0',
    'agreed_hours' => 30,
    'hourly_rate' => 400,
    'status' => 'pending',
    'contract_start' => '2027-01-01',
    'contract_end' => '2027-03-03'
]);
$user = App\Models\User::first();
$request->setUserResolver(function() use ($user) { return $user; });
$response = app()->handle($request);
echo "STATUS: " . $response->getStatusCode() . "\n";
echo "CONTENT: " . $response->getContent() . "\n";
