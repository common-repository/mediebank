<?php

defined( 'ABSPATH' ) || exit;

$configured = Mediebank_Helper::is_configured();

$organization = null;
if ( $configured ) {
    $organization = get_transient( Mediebank_Helper::TRANSIENT_ORGANIZATION );
    if ( ! $organization ) {
        $api          = Mediebank_Api::get_instance();
        $organization = Mediebank_Helper::get_organization_from_user( $api->get_user() );

        set_transient(
            Mediebank_Helper::TRANSIENT_ORGANIZATION,
            $organization,
            60 * 60 * 24 // a day
        );
    }
}

global $wpdb;
$assets_in_library = $wpdb->get_results(
    $wpdb->prepare( "SELECT meta_value FROM $wpdb->postmeta WHERE meta_key = %s", Mediebank_Helper::META_ATTACHMENT_ID ),
    ARRAY_A
);

$assets_in_library = array_map( function ( $row ) {
    return $row['meta_value'];
}, $assets_in_library );

wp_localize_script(
    'mediebank-integration',
    'Mediebank',
    [
        'configured'      => $configured,
        'organization'    => $organization,
        'assetsInLibrary' => $assets_in_library,
        'source'          => $source ?? "standalone"
    ]
);
