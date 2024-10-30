<?php

defined( 'ABSPATH' ) || exit;

if ( ! current_user_can( 'upload_files' ) ) {
    wp_die( esc_html__( 'You do not have sufficient capabilities to access this page.', 'mediebank' ) );
}

$source = 'standalone';

include_once MEDIEBANK_INTEGRATION_PLUGIN_PATH . "/includes/shared/localize-gallery.php"

?>

<div id="mediebank-app"></div>
