<?php
/** trackbox.php — shared helpers for talking to the Trackbox API. */

function tb_read_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (is_array($data)) return $data;
    return $_POST ?: [];
}

function tb_client_ip(): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $h) {
        if (!empty($_SERVER[$h])) {
            $ip = trim(explode(',', $_SERVER[$h])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

function tb_random_password(int $len = 12): string {
    $upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; $lower = 'abcdefghijkmnopqrstuvwxyz'; $digit = '23456789';
    $all = $upper . $lower . $digit;
    $pw = $upper[random_int(0, strlen($upper)-1)] . $lower[random_int(0, strlen($lower)-1)]
        . $digit[random_int(0, strlen($digit)-1)] . '!';
    for ($i = strlen($pw); $i < $len; $i++) $pw .= $all[random_int(0, strlen($all)-1)];
    return str_shuffle($pw);
}

/** POST JSON to a Trackbox endpoint. Returns [httpStatus, decoded|null, raw, curlError]. */
function tb_request(string $url, array $headers, array $body, bool $verify = true): array {
    $json = json_encode($body);

    // Preferred transport: cURL extension when available.
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => $verify,
            CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
        ]);
        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        $decoded = is_string($raw) ? json_decode($raw, true) : null;
        return [$status, is_array($decoded) ? $decoded : null, (string) $raw, $err];
    }

    // Fallback: HTTP stream (no cURL extension required). Uses fopen + stream
    // meta so it stays clean on PHP 8.4 (no deprecated $http_response_header).
    $ctx = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => implode("\r\n", $headers),
            'content'       => $json,
            'timeout'       => 30,
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer'       => $verify,
            'verify_peer_name'  => $verify,
            'allow_self_signed' => !$verify,
        ],
    ]);
    $fp = @fopen($url, 'r', false, $ctx);
    if (!$fp) {
        return [0, null, '', 'http request failed (no cURL; SSL/connection could not be established)'];
    }
    $raw = stream_get_contents($fp);
    $status = 0;
    $meta = stream_get_meta_data($fp);
    fclose($fp);
    if (!empty($meta['wrapper_data']) && is_array($meta['wrapper_data'])) {
        foreach ($meta['wrapper_data'] as $h) {
            if (preg_match('~^HTTP/\\S+\\s+(\\d+)~', $h, $mm)) $status = (int) $mm[1];
        }
    }
    $decoded = is_string($raw) ? json_decode($raw, true) : null;
    return [$status, is_array($decoded) ? $decoded : null, (string) $raw, ($raw === false ? 'empty response' : '')];
}

/** Pull a redirect / auto-login URL out of a Trackbox response. */
function tb_extract_redirect(?array $resp): ?string {
    if (!$resp) return null;
    $isUrl = fn($v) => is_string($v) && preg_match('~^https?://~i', $v);
    if (isset($resp['data']) && $isUrl($resp['data'])) return $resp['data'];
    $keys = ['loginURL','loginUrl','url','redirect','redirectUrl','auto_login','autoLoginUrl','AutoLoginUrl','brokerUrl'];
    $fallback = null; $stack = [$resp];
    while ($stack) {
        $node = array_pop($stack);
        if (!is_array($node)) continue;
        foreach ($keys as $k) if (isset($node[$k]) && $isUrl($node[$k])) return $node[$k];
        foreach ($node as $v) {
            if (is_array($v)) $stack[] = $v;
            elseif ($fallback === null && $isUrl($v)) $fallback = $v;
        }
    }
    return $fallback;
}

function tb_is_success(int $httpStatus, ?array $resp): bool {
    if ($resp === null) return $httpStatus >= 200 && $httpStatus < 300;
    foreach (['status','success','ok','result'] as $k) {
        if (array_key_exists($k, $resp)) {
            $v = $resp[$k];
            if ($v === true || $v === 1 || $v === '1' || $v === 'true' || $v === 'success' || $v === 'ok') return true;
            if ($v === false || $v === 0 || $v === '0' || $v === 'false') return false;
        }
    }
    return $httpStatus >= 200 && $httpStatus < 300;
}

function tb_error_code(?array $resp): string {
    $msg = '';
    if ($resp) foreach (['message','error','errorMessage','msg'] as $k)
        if (!empty($resp[$k]) && is_string($resp[$k])) { $msg = strtolower($resp[$k]); break; }
    if (strpos($msg,'exist')!==false || strpos($msg,'already')!==false || strpos($msg,'duplicate')!==false) return 'already_reg';
    if (strpos($msg,'not found')!==false || strpos($msg,'no user')!==false) return 'no_user_found';
    return 'try_again';
}

function tb_respond(array $payload, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}
