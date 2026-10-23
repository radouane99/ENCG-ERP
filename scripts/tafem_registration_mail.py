from pathlib import Path
p=Path(__file__).resolve().parents[1]/'backend/app/Domain/Auth/Services/RegisterUserService.php';t=p.read_text(encoding='utf-8')
t=t.replace('                Application::create($appFields);','                $app = Application::create($appFields);')
start=t.index('            // 4. Send Confirmation');end=t.index('            return $user;',start)
t=t[:start]+'''            app(\\App\\Actions\\Admission\\ManageDossierAction::class)->event($app, 'account_created');
            app(\\App\\Services\\Admissions\\AdmissionNotificationService::class)->queue($app, 'account_created');

'''+t[end:];p.write_text(t,encoding='utf-8')
