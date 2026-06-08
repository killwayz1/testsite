<?php
/**
 * config.php — Trackbox credentials & affiliate parameters.
 * Keep this file OUTSIDE the web root if possible, or protect it
 * (the included .htaccess denies direct access to *.php here only for
 * include files — adjust to your server).
 *
 * The three header credentials below are MANDATORY for the API to work.
 * They are NOT the same as ai/ci/gi. You must get them from your
 * Trackbox partner / account manager:
 *   - x-trackbox-username
 *   - x-trackbox-password
 *   - x-api-key   (one key for "push", one for "pull"; often the same)
 */

return [
    // ---- Auth headers (REQUIRED — fill these in) -----------------------
    'username'     => '627',
    'password'     => 'H5-<i5T$wd',
    'api_key_push' => '2643889w34df345676ssdas323tgc738',
    'api_key_pull' => '2643889w34df345676ssdas323tgc738',

    // ---- Affiliate parameters (provided) -------------------------------
    'base_url' => 'https://tb.finledger.pro', // Trackbox host
    'ai'       => '2958428', // affiliate id
    'ci'       => '1',       // campaign id
    'gi'       => '403',     // geo / goal id (UK)
    'lg'       => 'EN',      // lead language sent to Trackbox

    // ---- Behaviour -----------------------------------------------------
    // Auto-generate a password for each lead (the sign-up form has no
    // password field). Set false only if you collect a password yourself.
    'generate_password' => true,

    // Set true while testing to receive the raw Trackbox response back in
    // the JSON (so you can inspect it). Turn OFF in production.
    'debug' => false,

    // Optional: write every attempt/response to this file (or null).
    'log_file' => __DIR__ . '/trackbox.log',
];
