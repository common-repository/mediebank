<?php

defined( 'ABSPATH' ) || exit;

if ( ! current_user_can( 'manage_options' ) ) {
    wp_die( esc_html__( 'You do not have sufficient capabilities to access this page.', 'mediebank' ) );
}

wp_localize_script( 'mediebank-integration', 'Mediebank', [
    'providers' => Mediebank::$providers,
    'options'   => Mediebank::get_options()
] );

?>

<div class="wrap">
    <div id="mediebank-settings"></div>
</div>
