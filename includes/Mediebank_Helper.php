<?php

defined( 'ABSPATH' ) || exit;

class Mediebank_Helper {
    public const OPTIONS_NAME = 'mediebank-options';
    public const OPTIONS_CONFIGURED = 'mediebank-configured';
    public const TRANSIENT_ORGANIZATION = '_mediebank-organization';
    public const TRANSIENT_ACCESS_TOKEN = '_mediebank-access-token';
    public const META_ATTACHMENT_ID = '_mediebank_id';
    public const META_POST_PENDING_USAGE_REPORT = '_mediebank-pending-usage-report';
    public const META_POST_ASSET_USAGES = '_mediebank-asset-usages';

    public static function get_organization_from_user( array $user ): array|false {
        return $user['org'] ?? false;
    }

    public static function transients_clear(): void {
        delete_transient( self::TRANSIENT_ACCESS_TOKEN );
        delete_transient( self::TRANSIENT_ORGANIZATION );
    }

    public static function set_pending_usage_report( int $post_id, array $assets ): void {
        $existing_assets = get_post_meta( $post_id, self::META_POST_ASSET_USAGES, true ) ?? [];

        if ( ! empty( $existing_assets ) ) {
            $assets = array_map( function ( $asset ) use ( $existing_assets ) {
                // Mark assets that have already been reported as such
                if ( isset( $existing_assets[ $asset['mediebank_id'] ]['reported'] ) ) {
                    $asset['reported'] = true;
                }

                return $asset;
            }, $assets );
        }

        update_post_meta( $post_id, self::META_POST_ASSET_USAGES, $assets );

        // Trigger usage report for this post
        update_post_meta( $post_id, self::META_POST_PENDING_USAGE_REPORT, 1 );
    }

    public static function complete_usage_report( int $post_id ): void {
        $assets = get_post_meta( $post_id, self::META_POST_ASSET_USAGES, true ) ?? [];
        $assets = array_map( function ( $asset ) {
            $asset['reported'] = true;

            return $asset;
        }, $assets );

        update_post_meta( $post_id, self::META_POST_ASSET_USAGES, $assets );
        update_post_meta( $post_id, self::META_POST_PENDING_USAGE_REPORT, 0 );
    }

    public static function is_configured(): bool {
        return (bool) get_option( self::OPTIONS_CONFIGURED, 0 );
    }

    public static function is_wp_lt( string $version ): bool {
        global $wp_version;

        return version_compare( $wp_version, $version, '<' );
    }
}
