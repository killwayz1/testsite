<?php
/**
 * config.php — Trackbox credentials & affiliate parameters for plata-invest-ca.com.
 * The three header credentials are mandatory and come from your Trackbox
 * partner. ai/ci/gi are the affiliate/campaign/geo ids.
 */
return [
    // ---- Auth headers ----
    'username'     => '627',
    'password'     => 'H5-<i5T$wd',
    'api_key_push' => '2643889w34df345676ssdas323tgc738',
    'api_key_pull' => '2643889w34df345676ssdas323tgc738',

    // ---- Affiliate parameters ----
    'base_url' => 'https://tb.finledger.pro',
    'ai'       => '2958428',
    'ci'       => '1',
    'gi'       => '403',          // geo id (single geo for all sites)
    'lg'       => 'EN',
    'default_dial' => '1',       // lead language

    // ---- Source site (sent to Trackbox in "so", visible in reports) ----
    'site_domain' => 'plata-invest-ca.com',

    // ---- Behaviour ----
    'generate_password' => true, // sign-up forms have no password field
    'debug' => false,
    'verify_ssl' => true,
    'log_file' => null,          // local logging disabled per request
];
