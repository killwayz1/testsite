<?php
/**
 * pull.php — fetch statuses & deposits from Trackbox (Pull method).
 *
 * Endpoint used: {base_url}/api/pull/customers   (method POST)
 *
 * This is an ADMIN tool — protect it (the simple token check below) and
 * do NOT expose it to the public. Call it from a cron job or by hand.
 *
 * Query params (GET or JSON body):
 *   from  "2026-06-01 00:00:00"   (default: first day of current month)
 *   to    "2026-06-30 23:59:59"   (default: now)
 *   type  2 = leads only | 3 = leads + deposits | 4 = deposits only (default 3)
 *   page  0,1,2...                (default 0)
 *   token must match ADMIN_TOKEN below
 */

require __DIR__ . '/trackbox.php';
$cfg = require __DIR__ . '/config.php';

// ---- simple protection: change this token ----
const ADMIN_TOKEN = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

$in = array_merge($_GET, tb_read_input());
if (($in['token'] ?? '') !== ADMIN_TOKEN) {
    tb_respond(['ok' => false, 'error' => 'forbidden'], 403);
}

$body = [
    'from' => $in['from'] ?? date('Y-m-01 00:00:00'),
    'to'   => $in['to']   ?? date('Y-m-d H:i:s'),
    'type' => (string) ($in['type'] ?? '3'),
    'page' => (string) ($in['page'] ?? '0'),
];

$headers = [
    'x-trackbox-username: ' . $cfg['username'],
    'x-trackbox-password: ' . $cfg['password'],
    'x-api-key: ' . $cfg['api_key_pull'],
    'Content-Type: application/json',
];

$url = rtrim($cfg['base_url'], '/') . '/api/pull/customers';
[$status, $resp, $rawBody, $curlErr] = tb_request($url, $headers, $body);

tb_log($cfg['log_file'] ?? null, 'PULL', ['http' => $status, 'req' => $body, 'curl' => $curlErr]);

if ($curlErr) tb_respond(['ok' => false, 'error' => $curlErr], 502);

tb_respond([
    'ok'       => tb_is_success($status, $resp),
    'http'     => $status,
    'request'  => $body,
    'response' => $resp ?? $rawBody,
]);
