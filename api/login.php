<?php
/**
 * login.php — the landings have a "Sign In" form, but Trackbox is a lead/CRM
 * API with no end-user auth. Set BROKER_LOGIN_URL to your broker's login page
 * to redirect visitors there, otherwise we ask them to contact support.
 */
require __DIR__ . '/trackbox.php';

const BROKER_LOGIN_URL = ''; // e.g. 'https://your-broker.com/login'

header('Content-Type: application/json; charset=utf-8');
if (BROKER_LOGIN_URL !== '') echo json_encode(['ok'=>true,'redirect'=>BROKER_LOGIN_URL]);
else echo json_encode(['ok'=>false,'code'=>'ask_support']);
