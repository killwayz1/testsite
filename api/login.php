<?php
/**
 * login.php — the landing page has a "Sign In" form, but Trackbox is a
 * lead/CRM API with no end-user authentication. There is nothing to log
 * in against here. The usual behaviour is to send the visitor to the
 * broker's real login page. Set BROKER_LOGIN_URL accordingly, or remove
 * the sign-in form from the site.
 */
require __DIR__ . '/trackbox.php';

const BROKER_LOGIN_URL = ''; // e.g. 'https://your-broker.com/login'

header('Content-Type: application/json; charset=utf-8');
if (BROKER_LOGIN_URL !== '') {
    echo json_encode(['ok' => true, 'redirect' => BROKER_LOGIN_URL]);
} else {
    echo json_encode(['ok' => false, 'code' => 'ask_support']);
}
