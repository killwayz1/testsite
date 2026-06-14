<?php
/**
 * pull.php — fetch statuses & deposits from Trackbox (Pull method).
 * Endpoint: {base_url}/api/pull/customers (POST). ADMIN tool — protect it.
 *
 * Params (GET or JSON): from, to, type (2 leads | 3 leads+deposits | 4 deposits),
 * page, token (must equal ADMIN_TOKEN).
 */
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');
require __DIR__ . '/trackbox.php';
$cfg = require __DIR__ . '/config.php';

const ADMIN_TOKEN = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

$in = array_merge($_GET, tb_read_input());
if (($in['token'] ?? '') !== ADMIN_TOKEN) tb_respond(['ok'=>false,'error'=>'forbidden'], 403);

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
[$status, $resp, $rawBody, $curlErr] = tb_request($url, $headers, $body, $cfg['verify_ssl'] ?? true);
if ($curlErr) tb_respond(['ok'=>false,'error'=>$curlErr], 502);
tb_respond(['ok'=>tb_is_success($status,$resp),'http'=>$status,'request'=>$body,'response'=>$resp ?? $rawBody]);
