<?php

defined( 'ABSPATH' ) || exit;

require_once( ABSPATH . 'wp-admin/includes/file.php' );

class Mediebank_Rest_Api {
    private static ?Mediebank_Rest_Api $instance = null;

    private string $api_namespace = 'mediebank/v1';

    private Mediebank_Api $api;

    /**
     * Returns the *Singleton* instance of this class.
     *
     * @return Mediebank_Rest_Api
     */
    public static function get_instance(): Mediebank_Rest_Api {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function __construct() {
        $this->api = Mediebank_Api::get_instance();

        add_action( 'rest_api_init', [ $this, 'init' ] );
    }

    public function init() {
        register_rest_route( $this->api_namespace, '/options', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'store_options' ],
            'permission_callback' => function () {
                return current_user_can( 'manage_options' );
            }
        ] );

        register_rest_route( $this->api_namespace, '/assets', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_assets' ],
            'permission_callback' => function () {
                return current_user_can( 'upload_files' );
            }
        ] );

        register_rest_route( $this->api_namespace, '/assets/(?P<id>[_a-zA-Z0-9-]+)', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'store_asset' ],
            'permission_callback' => function () {
                return current_user_can( 'upload_files' );
            }
        ] );
    }

    public function store_options( WP_REST_Request $request ): WP_REST_Response {
        $old_options = Mediebank::get_options();
        update_option( Mediebank_Helper::OPTIONS_NAME, $request->get_json_params() );

        $connected = true;

        if ( $old_options !== $request->get_json_params() ) {
            try {
                $token     = $this->api->get_access_token( true );
                $connected = $token !== null;

                $organization = Mediebank_Helper::get_organization_from_user( $this->api->get_user() );

                if ( ! $organization ) {
                    $connected = false;
                }
            } catch ( Exception $e ) {
                $connected = false;
            }
        }

        update_option( Mediebank_Helper::OPTIONS_CONFIGURED, (int) $connected );

        Mediebank_Helper::transients_clear();

        return new WP_REST_Response( [
            'connected' => $connected,
            'options'   => get_option( Mediebank_Helper::OPTIONS_NAME )
        ] );
    }

    /**
     * @throws Exception
     */
    public function get_assets( WP_REST_Request $request ): array {
        return $this->api->get_assets( $request->get_query_params() );
    }

    /**
     * @throws Exception
     */
    public function store_asset( WP_REST_Request $request ): WP_Error|array {
        $id = $request->get_param( 'id' );

        if ( empty( $id ) ) {
            return new WP_Error(
                'unprocessable_entity',
                'You need to provide an id to download.',
                [ 'status' => 422 ]
            );
        }

        $asset = $this->api->get_asset( $id )['_data'];

        $file = $this->api->download_asset( $id );

        if ( isset( $file['_status']['error'] ) ) {
            return new WP_Error(
                'fatal_error',
                'Something went wrong.',
                [ 'status' => 500 ]
            );
        }

        // Prefix with id to prevent sharing the same file, even if the file itself is duplicate
        $original_filename = $asset['file']['originalFilename'];
        $path              = wp_upload_dir()['path'] . "/$id-$original_filename";

        $fp = fopen( $path, "w" );
        fwrite( $fp, $file );
        fclose( $fp );

        // Create or update media
        $query          = new WP_Query( [
            'post_type'   => 'attachment',
            'post_status' => 'inherit',
            'meta_query'  => [
                [
                    'key'   => Mediebank_Helper::META_ATTACHMENT_ID,
                    'value' => $id
                ]
            ],
            'limit'       => 1
        ] );
        $existing_media = $query->get_posts();

        if ( empty( $existing_media ) ) {
            $attachment_id = $this->wp_create_media( $id, $path, $asset );
        } else {
            $attachment_id = $this->wp_update_media( array_pop( $existing_media ), $path, $asset );
        }

        return [
            'success'    => true,
            'admin_url'  => admin_url(),
            'attachment' => [
                'id'       => $attachment_id,
                'url'      => wp_get_attachment_url( $attachment_id ),
                'edit_url' => get_edit_post_link( $attachment_id ),
                'caption'  => $asset['description'],
                'alt'      => $asset['altTextAccessibility']
            ]
        ];
    }

    private function wp_create_media( $id, $path, $asset ): int {
        $wp_filetype = wp_check_filetype( $path );

        $attachment = [
            'post_mime_type' => $wp_filetype['type'],
            'post_title'     => $asset['headline'],
            'post_content'   => '',
            'post_excerpt'   => $asset['description'],
            'post_status'    => 'inherit'
        ];

        $attachment_id = wp_insert_attachment( $attachment, $path );

        update_post_meta( $attachment_id, Mediebank_Helper::META_ATTACHMENT_ID, $id );

        if ( ! empty( $asset['alt'] ) ) {
            update_post_meta( $attachment_id, '_wp_attachment_image_alt', $asset['altTextAccessibility'] );
        }

        require_once( ABSPATH . 'wp-admin/includes/image.php' );
        require_once( ABSPATH . 'wp-admin/includes/media.php' );

        $attach_data = wp_generate_attachment_metadata( $attachment_id, $path );
        wp_update_attachment_metadata( $attachment_id, $attach_data );

        return $attachment_id;
    }

    private function wp_update_media( $post, $path, $asset ): int {
        $attachment_id = $post->ID;

        wp_update_post( [
            'ID'           => $attachment_id,
            'post_title'   => $asset['headline'],
            'post_excerpt' => $asset['description'],
        ] );

        if ( ! empty( $asset['alt'] ) ) {
            update_post_meta( $attachment_id, '_wp_attachment_image_alt', $asset['altTextAccessibility'] );
        }

        require_once( ABSPATH . 'wp-admin/includes/image.php' );
        require_once( ABSPATH . 'wp-admin/includes/media.php' );

        $attach_data = wp_generate_attachment_metadata( $attachment_id, $path );
        wp_update_attachment_metadata( $attachment_id, $attach_data );

        return $attachment_id;
    }
}
