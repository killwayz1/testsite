<?php
/**
 * send.php — receives a registration from the browser and pushes it to
 * Trackbox (Push Leads / Registration method).
 *
 * Endpoint used: {base_url}/api/signup/procform
 * The browser calls THIS file; this file calls Trackbox with the secret
 * headers. That keeps username/password/api-key off the client.
 */

require __DIR__ . '/trackbox.php';
$cfg = require __DIR__ . '/config.php';

// --- CORS (same-origin by default). If the lander is on another domain
//     than this proxy, set the allowed origin explicitly. ---------------
header('Vary: Origin');
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    tb_respond(['ok' => false, 'code' => 'try_again'], 405);
}

$in = tb_read_input();

// --- Basic validation ----------------------------------------------------
$firstname = trim($in['first_name'] ?? $in['firstname'] ?? '');
$lastname  = trim($in['last_name'] ?? $in['lastname'] ?? '');
$email     = trim($in['email'] ?? '');
$phone     = preg_replace('/[^\d]/', '', $in['phone'] ?? '');

if ($firstname === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($phone) < 6) {
    tb_respond(['ok' => false, 'code' => 'try_again', 'message' => 'invalid input'], 422);
}

$password = !empty($in['password']) ? $in['password']
          : ($cfg['generate_password'] ? tb_random_password() : 'Aa12345!');

// --- Build the Trackbox payload -----------------------------------------
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
    // pass-through tracking (only sent if present)
    'so'        => $in['so'] ?? ($in['form_id'] ?? ''),
    'sub'       => $in['sub'] ?? ($in['subid'] ?? ''),
    'ad'        => $in['ad'] ?? '',
    'term'      => $in['term'] ?? '',
    'campaign'  => $in['campaign'] ?? '',
    'medium'    => $in['medium'] ?? '',
];
for ($i = 1; $i <= 12; $i++) {
    if (!empty($in['MPC_' . $i])) $body['MPC_' . $i] = $in['MPC_' . $i];
}
// drop empty optional keys
$body = array_filter($body, fn($v) => $v !== '' && $v !== null);

$headers = [
    'x-trackbox-username: ' . $cfg['username'],
    'x-trackbox-password: ' . $cfg['password'],
    'x-api-key: ' . $cfg['api_key_push'],
    'Content-Type: application/json',
];

// --- Call Trackbox -------------------------------------------------------
$url = rtrim($cfg['base_url'], '/') . '/api/signup/procform';
[$status, $resp, $rawBody, $curlErr] = tb_request($url, $headers, $body);

tb_log($cfg['log_file'] ?? null, 'PUSH ' . $email, ['http' => $status, 'resp' => $resp ?? $rawBody, 'curl' => $curlErr]);

$out = ['ok' => false, 'code' => 'try_again'];

if ($curlErr) {
    $out = ['ok' => false, 'code' => 'try_again', 'message' => 'connection error'];
} elseif (tb_is_success($status, $resp)) {
    $out = ['ok' => true, 'redirect' => tb_extract_redirect($resp)];
} else {
    $out = ['ok' => false, 'code' => tb_error_code($resp)];
}

if (!empty($cfg['debug'])) {
    $out['_debug'] = ['http' => $status, 'sent' => $body, 'trackbox' => $resp ?? $rawBody, 'curl' => $curlErr];
}

tb_respond($out, $out['ok'] ? 200 : 200);
