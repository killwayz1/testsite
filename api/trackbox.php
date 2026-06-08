<?php
/**
 * trackbox.php — shared helpers for talking to the Trackbox API.
 */

/** Read and JSON-decode the request body (falls back to form-encoded). */
function tb_read_input(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (is_array($data)) return $data;
    return $_POST ?: [];
}

/** Best-effort real client IP (honours common proxy headers). */
function tb_client_ip(): string
{
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $h) {
        if (!empty($_SERVER[$h])) {
            $ip = trim(explode(',', $_SERVER[$h])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

/** Generate a strong password for leads with no password field. */
function tb_random_password(int $len = 12): string
{
    $upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    $lower = 'abcdefghijkmnopqrstuvwxyz';
    $digit = '23456789';
    $all = $upper . $lower . $digit;
    $pw = $upper[random_int(0, strlen($upper) - 1)]
        . $lower[random_int(0, strlen($lower) - 1)]
        . $digit[random_int(0, strlen($digit) - 1)]
        . '!';
    for ($i = strlen($pw); $i < $len; $i++) {
        $pw .= $all[random_int(0, strlen($all) - 1)];
    }
    return str_shuffle($pw);
}

/** Append a line to the log file if configured. */
function tb_log(?string $file, string $label, $data): void
{
    if (!$file) return;
    $line = '[' . date('c') . "] $label " . (is_string($data) ? $data : json_encode($data)) . "\n";
    @file_put_contents($file, $line, FILE_APPEND);
}

/**
 * POST JSON to a Trackbox endpoint with the required headers.
 * Returns [httpStatus(int), decodedBody(array|null), rawBody(string), curlError(string)].
 */
function tb_request(string $url, array $headers, array $body): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    $decoded = is_string($raw) ? json_decode($raw, true) : null;
    return [$status, is_array($decoded) ? $decoded : null, (string) $raw, $err];
}

/**
 * Inspect a Trackbox response and pull out a redirect/autologin URL.
 * Trackbox payloads vary between setups, so we check the common keys.
 */
function tb_extract_redirect(?array $resp): ?string
{
    if (!$resp) return null;
    $candidates = [];
    // top level
    foreach (['url', 'redirect', 'redirectUrl', 'auto_login', 'autoLoginUrl', 'AutoLoginUrl'] as $k) {
        if (!empty($resp[$k]) && is_string($resp[$k])) $candidates[] = $resp[$k];
    }
    // nested "data"
    if (!empty($resp['data']) && is_array($resp['data'])) {
        foreach (['url', 'redirect', 'redirectUrl', 'auto_login', 'autoLoginUrl', 'AutoLoginUrl'] as $k) {
            if (!empty($resp['data'][$k]) && is_string($resp['data'][$k])) $candidates[] = $resp['data'][$k];
        }
    }
    foreach ($candidates as $c) {
        if (preg_match('~^https?://~i', $c)) return $c;
    }
    return null;
}

/** Was the call successful? Handles several Trackbox response shapes. */
function tb_is_success(int $httpStatus, ?array $resp): bool
{
    if ($httpStatus < 200 || $httpStatus >= 300) {
        // some setups return 200 always and signal status in body; keep checking body
    }
    if ($resp === null) return $httpStatus >= 200 && $httpStatus < 300;
    foreach (['status', 'success', 'ok', 'result'] as $k) {
        if (array_key_exists($k, $resp)) {
            $v = $resp[$k];
            if ($v === true || $v === 1 || $v === '1' || $v === 'true' || $v === 'success' || $v === 'ok') return true;
            if ($v === false || $v === 0 || $v === '0' || $v === 'false') return false;
        }
    }
    return $httpStatus >= 200 && $httpStatus < 300;
}

/** Map a Trackbox error message to one of the site's translation codes. */
function tb_error_code(?array $resp): string
{
    $msg = '';
    if ($resp) {
        foreach (['message', 'error', 'errorMessage', 'msg'] as $k) {
            if (!empty($resp[$k]) && is_string($resp[$k])) { $msg = strtolower($resp[$k]); break; }
        }
    }
    if (strpos($msg, 'exist') !== false || strpos($msg, 'already') !== false || strpos($msg, 'duplicate') !== false) {
        return 'already_reg';
    }
    if (strpos($msg, 'not found') !== false || strpos($msg, 'no user') !== false) {
        return 'no_user_found';
    }
    return 'try_again';
}

/** Send a JSON response and stop. */
function tb_respond(array $payload, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}
