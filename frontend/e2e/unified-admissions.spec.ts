import { test, expect, type Page } from '@playwright/test'
import { mockApi, seedSession } from './helpers'
const json=(data:unknown)=>({contentType:'application/json',body:JSON.stringify(data)})
const base='/api/admissions/workflow'
const campaign={id:7,name:'CNAEM synthétique S7',academic_year_id:1,filiere_id:1,entry_route:'cnaem',entry_semester:7,status:'open',target_capacity:20,open_date:'2026-01-01',close_date:'2027-01-01'}
async function prepare(page:Page){await mockApi(page);await seedSession(page,'admin');await page.route(url=>url.pathname===`${base}/campaigns`,r=>r.fulfill(json({data:[campaign]})));await page.route(url=>url.pathname===`${base}/stats`,r=>r.fulfill(json({stats:{total_candidates:1,submitted:1,approved:0}})));await page.route(url=>url.pathname===`${base}/applications`,r=>r.fulfill(json({data:[{id:17,cne:'SYN-CNAEM',first_name:'Candidate',last_name:'Synthetic',dossier_status:'submitted',eligibility:'main',ranking:1}],total:1,last_page:1})));}
test.describe('Admissions unifiées et dossiers annuels',()=>{
 test.skip(!process.env.E2E_ROLE_AUDIT,'Données synthétiques uniquement.')
 for(const mobile of [false,true]){
 const device=mobile?'mobile':'desktop'
 test(`CNAEM : revue physique traçable et inscription unique — ${device}`,async({page})=>{
  if(mobile)await page.setViewportSize({width:390,height:844});await prepare(page)
  const required=['bac','cnie','releve_notes','photo','attestation_admission','releve_parcours']
  const physical={bac_original:'Bac original reçu',releve_notes:'Relevé reçu',cin_copy:'Copie CNIE reçue',photos:'Photos reçues',attestation_admission:'Admission CNAEM contrôlée',releve_parcours:'Parcours antérieur contrôlé'}
  let approved=false;let decisions=0
  const dossier=()=>({id:17,application_id:17,version:approved?5:4,reference_number:'SYN-CNAEM-17',cne:'SYN-CNAEM',cin:'AB123456',first_name:'Candidate',last_name:'Synthetic',email:'candidate@example.test',dossier_status:approved?'approved':'submitted',eligibility:'main',profile:{},documents:Object.fromEntries(required.map((type,i)=>[type,{id:i+1,type,mime_type:'image/png',version:1,status:'verified',signed_url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8N8AAAAASUVORK5CYII='}])),campaign,required_documents:required,physical_requirements:physical,reviews:approved?[{id:1,decision:'approved',created_at:'2026-10-24T10:00:00Z',reviewer_name:'Agent synthétique',physical_checklist:Object.fromEntries(Object.keys(physical).map(k=>[k,true]))}]:[],events:[],notifications:[],document_history:[]})
  await page.route(url=>url.pathname===`${base}/dossier`,r=>r.fulfill(json({candidate:dossier()})))
  await page.route(url=>url.pathname===`${base}/decide`,async r=>{expect(r.request().postDataJSON()).toMatchObject({application_id:17,version:4,official_number:'SYN-APO-17',physical_checklist:Object.fromEntries(Object.keys(physical).map(k=>[k,true]))});decisions++;approved=true;await r.fulfill(json({candidate:dossier()}))})
  await page.goto('/admin/tafem');await expect(page).toHaveURL(/academic\/enrollments/);await expect(page.getByRole('heading',{name:'Admissions & nouvelles inscriptions',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Ouvrir',exact:true}).click();const details=page.locator('details').filter({has:page.getByText('Validation physique et inscription définitive',{exact:true})});await details.locator('summary').click()
  await expect(details.getByRole('button',{name:'Valider l’inscription définitive'})).toBeDisabled();await expect(details.getByRole('checkbox')).toHaveCount(6)
  for(const box of await details.getByRole('checkbox').all())await box.check();await details.getByLabel('Numéro APOGEE officiel').fill('SYN-APO-17');await details.getByRole('button',{name:'Valider l’inscription définitive'}).click()
  await expect(page.getByRole('heading',{name:'Contrôle physique enregistré'})).toBeVisible();await expect(page.getByText(/Agent synthétique/)).toBeVisible();expect(decisions).toBe(1)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
 })
 test(`inscriptions définitives : contexte campagne et niveau CNAEM — ${device}`,async({page})=>{
  if(mobile)await page.setViewportSize({width:390,height:844});await prepare(page);const legacy:string[]=[];page.on('request',r=>{if(['/api/admin/students','/api/admin/admissions/applications'].some(p=>new URL(r.url()).pathname===p))legacy.push(r.url())})
  await page.route(url=>url.pathname===`${base}/enrollments`,r=>r.fulfill(json({data:[{id:2,name:'Étudiant synthétique',cne:'SYN-01',student_number:'APO-001',group:'S7-G1',sub_group:'G1.1',validated_at:'2026-10-24T10:00:00Z'}],total:1,last_page:1})))
  await page.goto('/academic/enrollments');await page.getByRole('button',{name:'Inscriptions & groupes'}).click();await expect(page.getByRole('heading',{name:'Inscriptions définitives · S7'})).toBeVisible();await expect(page.getByText('S7-G1',{exact:true})).toBeVisible();expect(legacy).toEqual([])
  await page.screenshot({path:`test-results/unified-enrollments-${device}.png`,fullPage:true})
 })
 test(`anciens : contrôle physique distinct et confirmé — ${device}`,async({page})=>{
  if(mobile)await page.setViewportSize({width:390,height:844});await mockApi(page);await seedSession(page,'admin');let verified=false
  const data=()=>({academic_year:'2026/2027',total_eligible:1,total_pending:0,total_physical_pending:verified?0:1,total_verified:verified?1:0,total_needs_review:0,by_level:{'3A':{total:1,confirmed:1,verified:verified?1:0}},meta:{total:1,last_page:1},physical_requirements:{identity_verified:'Identité vérifiée',academic_decision_verified:'Décision académique vérifiée',annual_file_received:'Dossier annuel reçu'},students:[{id:2,name:'Ancien synthétique',cne:'SYN-OLD',current_level:'S5',filiere:'Formation initiale',status:verified?'verified':'physical_pending',receipt_ref:'SYN-REC',physical_verified_at:verified?'2026-10-24T10:00:00Z':null,physical_verified_by:verified?'Agent synthétique':null}]})
  await page.route(url=>url.pathname==='/api/admin/reinscriptions/stats',r=>r.fulfill(json({data:data()})))
  await page.route(url=>url.pathname==='/api/admin/reinscriptions/2/physical-review',async r=>{expect(r.request().postDataJSON().checklist).toEqual({identity_verified:true,academic_decision_verified:true,annual_file_received:true});verified=true;await r.fulfill(json({message:'Contrôle physique annuel enregistré.'}))})
  await page.goto('/admin/reinscriptions');await page.getByRole('button',{name:'Contrôler le dossier'}).click();const dialog=page.getByRole('dialog',{name:'Vérification physique du dossier annuel'});await expect(dialog.getByRole('button',{name:'Valider le contrôle physique'})).toBeDisabled();for(const box of await dialog.getByRole('checkbox').all())await box.check();await dialog.getByRole('button',{name:'Valider le contrôle physique'}).click();await expect(dialog).toBeHidden();await expect(page.getByRole('table').getByText('Dossier finalisé',{exact:true})).toBeVisible()
 })
 }
})