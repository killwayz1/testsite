<?php
/**
 * send.php — receives a registration from the browser and pushes it to
 * Trackbox (Push Leads). Endpoint: {base_url}/api/signup/procform
 *
 * The source-site domain is sent to Trackbox in the "so" field (visible in
 * reports) so you always know which landing the lead came from.
 */
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');
require __DIR__ . '/trackbox.php';
$cfg = require __DIR__ . '/config.php';

header('Vary: Origin');
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') tb_respond(['ok'=>false,'code'=>'try_again'], 405);

$in = tb_read_input();

$firstname = trim($in['first_name'] ?? $in['firstname'] ?? '');
$lastname  = trim($in['last_name']  ?? $in['lastname']  ?? '');
$email     = trim($in['email'] ?? '');
$phone     = preg_replace('/[^\d]/', '', $in['phone'] ?? '');

if ($firstname === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($phone) < 6)
    tb_respond(['ok'=>false,'code'=>'try_again','message'=>'invalid input'], 422);

$password = !empty($in['password']) ? $in['password']
          : ($cfg['generate_password'] ? tb_random_password() : 'Aa12345!');

// Source-site domain: real Host at runtime, fallback to config.
$sourceDomain = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
if ($sourceDomain === '') $sourceDomain = $cfg['site_domain'] ?? '';

$body = [
    'ai'        => $cfg['ai'],
    'ci'        => $cfg['ci'],
    'gi'        => $cfg['gi'],
    'userip'    => tb_client_ip(),
    'firstname' => $firstname,
    'lastname'  => $lastname !== '' ? $lastname : $firstname,
    'email'     => $email,
    'password'  => $password,
    'phone'     => $phone,
    'lg'        => $cfg['lg'],
    'so'        => $sourceDomain,                 // <- source site (visible in reports)
    'sub'       => $in['sub'] ?? '',
    'ad'        => $in['ad'] ?? '',
    'term'      => $in['term'] ?? '',
    'campaign'  => $in['campaign'] ?? '',
    'medium'    => $in['medium'] ?? '',
];
// keep the campaign source (utm_source) without losing the domain in "so"
if (!empty($in['utm_source'])) $body['MPC_1'] = $in['utm_source'];
for ($i = 1; $i <= 12; $i++) if (!empty($in['MPC_'.$i])) $body['MPC_'.$i] = $in['MPC_'.$i];

$body = array_filter($body, fn($v) => $v !== '' && $v !== null);

$headers = [
    'x-trackbox-username: ' . $cfg['username'],
    'x-trackbox-password: ' . $cfg['password'],
    'x-api-key: ' . $cfg['api_key_push'],
    'Content-Type: application/json',
];

$url = rtrim($cfg['base_url'], '/') . '/api/signup/procform';
[$status, $resp, $rawBody, $curlErr] = tb_request($url, $headers, $body, $cfg['verify_ssl'] ?? true);

$out = ['ok'=>false,'code'=>'try_again'];
if ($curlErr) {
    $out = ['ok'=>false,'code'=>'try_again','message'=>'connection error'];
} elseif (tb_is_success($status, $resp)) {
    $out = ['ok'=>true,'redirect'=>tb_extract_redirect($resp)];
} else {
    $out = ['ok'=>false,'code'=>tb_error_code($resp)];
}
if (!empty($cfg['debug'])) $out['_debug'] = ['http'=>$status,'sent'=>$body,'trackbox'=>$resp ?? $rawBody,'curl'=>$curlErr];

tb_respond($out, 200);
